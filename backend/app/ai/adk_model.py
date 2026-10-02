import asyncio
import json

from google.adk.models.base_llm import BaseLlm
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai.types import Content, Part
from pydantic import PrivateAttr


class OpenRouterADKModel(BaseLlm):
    _provider: object = PrivateAttr()

    def __init__(self, provider, model: str):
        super().__init__(model=model)
        self._provider = provider

    async def generate_content_async(self, llm_request: LlmRequest, stream: bool = False):
        if stream:
            raise ValueError("Streaming is not supported for structured generation.")
        prompt_parts = []
        for content in llm_request.contents:
            for part in content.parts or []:
                if part.text:
                    prompt_parts.append(f"{content.role or 'user'}: {part.text}")
        schema = getattr(llm_request.config, "response_schema", None)
        if schema is None:
            raise ValueError("ADK must provide an output schema for OpenRouter generation.")
        if hasattr(schema, "model_json_schema"):
            schema_dict = schema.model_json_schema()
        elif hasattr(schema, "model_dump"):
            schema_dict = schema.model_dump(by_alias=True, exclude_none=True)
        else:
            raise ValueError("ADK response schema is not supported.")
        result = await asyncio.to_thread(
            self._provider.generate_json,
            "\n\n".join(prompt_parts),
            schema_dict,
            "adk_structured_output",
        )
        yield LlmResponse(
            content=Content(role="model", parts=[Part.from_text(text=json.dumps(result))]),
            modelVersion=self.model,
            turnComplete=True,
        )