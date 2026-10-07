import logging
import re


class SensitiveDataScrubber(logging.Filter):
    """
    Logging filter parsing and scrubbing sensitive API keys, authorization tokens, 
    and secret credentials from log output streams.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if not isinstance(record.msg, str):
            return True

        # 1. Scrub Authorization Bearer Tokens
        record.msg = re.sub(
            r"bearer\s+[a-zA-Z0-9_\-\.]+", 
            "Bearer [SCRUBBED]", 
            record.msg, 
            flags=re.IGNORECASE
        )

        # 2. Scrub secret key-value assignments (JSON or text formats)
        record.msg = re.sub(
            r"(key|secret|token|password|password_hash|apikey)\s*(=|:)\s*['\"][^'\"]+['\"]", 
            r"\1 \2 [SCRUBBED]", 
            record.msg, 
            flags=re.IGNORECASE
        )

        return True
