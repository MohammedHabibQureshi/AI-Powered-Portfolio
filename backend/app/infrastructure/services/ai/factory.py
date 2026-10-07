import logging

from app.core.config import settings
from app.domain.repositories.ai_provider import AIProvider
from app.infrastructure.services.ai.gemini import GeminiProvider

logger = logging.getLogger("app.infrastructure.services.ai.factory")

class AIFactory:
    _provider_instance: AIProvider = None

    @classmethod
    def get_provider(cls) -> AIProvider:
        """Dynamically instantiates and returns the configured AI provider."""
        if cls._provider_instance is not None:
            return cls._provider_instance

        provider_name = settings.LLM_PROVIDER.lower()
        logger.info(f"Resolving AI Provider: {provider_name}")

        if provider_name == "gemini":
            cls._provider_instance = GeminiProvider()
        else:
            logger.warning(
                f"Configured provider '{provider_name}' is not supported. "
                "Defaulting to GeminiProvider."
            )
            cls._provider_instance = GeminiProvider()

        return cls._provider_instance
