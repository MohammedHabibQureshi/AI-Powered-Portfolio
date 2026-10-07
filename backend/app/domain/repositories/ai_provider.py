from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List


class AIProvider(ABC):
    """Domain layer interface contract decoupling AI providers from FastAPI services."""

    @abstractmethod
    async def generate(self, prompt: str, system_instruction: str) -> Dict[str, Any]:
        """Generate static text response."""
        pass

    @abstractmethod
    async def stream(
        self, 
        prompt: str, 
        history: List[Dict[str, Any]], 
        system_instruction: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chunks of response containing text segments, confidence, and source citations."""
        pass

    @abstractmethod
    async def summarize(self, text: str) -> str:
        """Helper task summarizing large chunks of text content."""
        pass

    @abstractmethod
    async def classify(self, text: str, categories: List[str]) -> str:
        """Classify input query intent into a target category classification."""
        pass

    @abstractmethod
    async def extract(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured JSON maps matching specified validation schemas."""
        pass
