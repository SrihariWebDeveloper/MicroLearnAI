import asyncio
import hashlib
import json
from datetime import datetime, timedelta, timezone

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.ai.adk_model import OpenRouterADKModel
from app.ai.openrouter_provider import OpenRouterProvider
from app.ai.schemas import AgentSummary, GeneratedLesson
from app.config import Config


AGENT_INSTRUCTIONS = {
    "learner_profiling_agent": "Summarize learner goals, topic, level, schedule, and preferences. Never infer unstated personal traits.",
    "learning_planner_agent": "Create ordered learning steps grounded in the learner's topic and skill level. Return structured output only.",
    "content_agent": "Write accurate, beginner-appropriate micro-lessons. Do not invent citations, videos, test outcomes, or learner progress.",
    "coding_lab_agent": "Describe code exercises and expected behavior. Never claim submitted code ran or passed.",
    "assessment_agent": "Explain concepts and question structure. Backend code, not the model, determines scores and progression.",
    "performance_analysis_agent": "Summarize only supplied measured results. Do not invent scores, predictions, or accuracy.",
    "recommendation_agent": "Give actionable recommendations based only on supplied measured learner records.",
}


class AgentService:
    def __init__(self, db, provider=None):
        self.db = db
        self.provider = provider or OpenRouterProvider()
        self.cache = db.get_collection("content_cache")
        model = OpenRouterADKModel(self.provider, Config.OPENROUTER_MODEL)
        self.agents = {
            name: Agent(
                name=name,
                model=model,
                instruction=instruction,
                output_schema=GeneratedLesson if name == "content_agent" else AgentSummary,
                disallow_transfer_to_parent=True,
                disallow_transfer_to_peers=True,
            )
            for name, instruction in AGENT_INSTRUCTIONS.items()
        }
        self.root_agent = Agent(
            name="microlearn_root_agent",
            model=model,
            instruction=(
                "You are the MicroLearn AI orchestrator. Delegate requests to the appropriate named specialist. "
                "The specialists use backend provider-backed structured generation. Do not claim actions that were not run."
            ),
            sub_agents=list(self.agents.values()),
            output_schema=AgentSummary,
        )

    def generate_lesson(self, user_id, subtopic_id, topic, skill_level, description):
        prompt = (
            "Create one concise micro-lesson for the learner. Use the topic, level, and description only as context. "
            "Provide correct explanations and runnable illustrative snippets. Do not claim this output was validated.\n"
            f"Topic: {topic}\nSkill level: {skill_level}\nLearning objective: {description}"
        )
        cache_key = hashlib.sha256(
            f"{Config.OPENROUTER_MODEL}\0{prompt}".encode("utf-8")
        ).hexdigest()
        cached = self.cache.find_one({"cache_key": cache_key})
        if cached and cached.get("expires_at", datetime.min.replace(tzinfo=timezone.utc)) > datetime.now(timezone.utc):
            lesson = GeneratedLesson.model_validate(cached["content"]).model_dump()
            return {
                **lesson,
                "id": f"lesson_{subtopic_id}",
                "subtopic_id": subtopic_id,
                "content_source": "google_adk_openrouter",
            }

        lesson_data = self.run_agent("content_agent", user_id, prompt)
        lesson = GeneratedLesson.model_validate(lesson_data).model_dump()
        lesson.update({
            "id": f"lesson_{subtopic_id}",
            "subtopic_id": subtopic_id,
            "content_source": "google_adk_openrouter",
        })
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        self.cache.update_one(
            {"cache_key": cache_key},
            {"$set": {
                "cache_key": cache_key,
                "model": Config.OPENROUTER_MODEL,
                "content": GeneratedLesson.model_validate(lesson).model_dump(),
                "expires_at": expires_at,
            }},
            upsert=True,
        )
        return lesson

    def run_agent(self, agent_name, user_id, prompt):
        agent = self.root_agent if agent_name == "microlearn_root_agent" else self.agents.get(agent_name)
        if agent is None:
            raise ValueError("Unknown MicroLearn AI agent.")

        async def run():
            sessions = InMemorySessionService()
            session = await sessions.create_session(
                app_name="microlearn_ai",
                user_id=user_id,
            )
            runner = Runner(
                agent=agent,
                app_name="microlearn_ai",
                session_service=sessions,
            )
            response_text = None
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session.id,
                new_message=Content(role="user", parts=[Part.from_text(text=prompt)]),
            ):
                if event.is_final_response() and event.content:
                    response_text = "".join(
                        part.text or "" for part in event.content.parts or []
                    )
            if not response_text:
                raise ValueError("The agent returned no structured content.")
            return json.loads(response_text)

        response = asyncio.run(run())
        if agent_name == "content_agent":
            return GeneratedLesson.model_validate(response).model_dump()
        return AgentSummary.model_validate(response).model_dump()