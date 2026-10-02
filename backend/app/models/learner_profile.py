from pydantic import BaseModel, ConfigDict, Field, model_validator


class LearnerProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    learning_goal: str = Field(min_length=1, max_length=500)
    topic: str = Field(min_length=1, max_length=200)
    target_domain: str | None = Field(default=None, min_length=1, max_length=200)
    skill_level: str = Field(pattern="^(beginner|intermediate|advanced)$")
    hours_per_day: float = Field(gt=0, le=24)
    preferred_schedule: str = Field(min_length=1, max_length=120)
    preferences: list[str] | dict[str, str | bool | int | float] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def accept_existing_domain_field(cls, values):
        if isinstance(values, dict) and "topic" not in values and "target_domain" in values:
            values = {**values, "topic": values["target_domain"]}
        return values

    @model_validator(mode="after")
    def keep_frontend_domain_alias(self):
        self.target_domain = self.topic
        return self