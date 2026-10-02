from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    def generate_json(self, prompt: str, schema: dict, schema_name: str) -> dict:
        raise NotImplementedError