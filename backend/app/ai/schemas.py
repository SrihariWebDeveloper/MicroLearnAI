from pydantic import BaseModel, Field


class LessonCodeExample(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    language: str = Field(min_length=1, max_length=40)
    code: str = Field(min_length=1, max_length=6000)
    explanation: str = Field(min_length=1, max_length=1000)


class GeneratedLesson(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    overview: str = Field(min_length=1, max_length=1000)
    key_concepts: list[str] = Field(min_length=2, max_length=8)
    detailed_content: str = Field(min_length=100, max_length=12000)
    code_examples: list[LessonCodeExample] = Field(max_length=5)
    summary: str = Field(min_length=1, max_length=1200)
    video_script: str | None = Field(default=None, max_length=6000)


class AgentSummary(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    items: list[str] = Field(default_factory=list, max_length=12)
    next_action: str | None = Field(default=None, max_length=500)