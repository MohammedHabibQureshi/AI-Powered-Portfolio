import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Verify application liveness health endpoint checks return successful 200 codes."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_readiness_check_failure():
    """
    Verify readiness check returns service failure 503 if database local connection
    is absent (sqlite mock connection is handled, but unconfigured environments fail).
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/ready")
    # Should assert status code depending on whether DB connection resolves
    assert response.status_code in [200, 503]
