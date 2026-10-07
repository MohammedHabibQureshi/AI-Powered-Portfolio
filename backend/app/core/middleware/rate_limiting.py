import time
from typing import Dict, List

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter protecting endpoints against rate abuse.
    Requires no Redis connection, keeping footprints lightweight.
    """

    def __init__(self, requests_limit: int, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # In-memory registry: key: (client_ip, path) -> value: list of timestamps
        self.history: Dict[tuple, List[float]] = {}

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = (client_ip, path)
        now = time.time()

        # Retrieve request timestamps list
        timestamps = self.history.get(key, [])
        
        # Prune logs older than window limits
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        
        if len(timestamps) >= self.requests_limit:
            # Raise 429 Too Many Requests
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum: {self.requests_limit} requests per {self.window_seconds}s."
            )
            
        # Log active request
        timestamps.append(now)
        self.history[key] = timestamps
        return True
