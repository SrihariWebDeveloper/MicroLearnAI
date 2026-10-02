import unittest

from app.ai.agent_service import AgentService
from app.utils.db import MongoDatabaseManager


class FakeProvider:
    def __init__(self):
        self.calls = 0

    def generate_json(self, prompt, schema, schema_name):
        self.calls += 1
        return {
            "title": "Python functions",
            "overview": "A function packages reusable behavior.",
            "key_concepts": ["Parameters", "Return values"],
            "detailed_content": (
                "Define a function with def, give it parameters when inputs are needed, "
                "and return a value when the caller needs a result. Try changing an input "
                "and tracing the returned value through a short example."
            ),
            "code_examples": [],
            "summary": "Functions package reusable behavior and return values to callers.",
            "video_script": None,
        }


class AIContentTests(unittest.TestCase):
    def test_adk_structured_output_validates_and_cache_prevents_second_provider_call(self):
        provider = FakeProvider()
        service = AgentService(MongoDatabaseManager(use_memory=True), provider=provider)
        first = service.generate_lesson(
            "user-1", "subtopic-1", "Python", "beginner", "Define and call a function."
        )
        second = service.generate_lesson(
            "user-1", "subtopic-1", "Python", "beginner", "Define and call a function."
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(first["content_source"], "google_adk_openrouter")
        self.assertEqual(first["title"], second["title"])
        self.assertEqual(second["subtopic_id"], "subtopic-1")


if __name__ == "__main__":
    unittest.main()