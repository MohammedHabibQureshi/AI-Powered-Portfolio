import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

logger = logging.getLogger("app.services.github_sync")

GITHUB_API = "https://api.github.com"


class GitHubSyncService:
    """Fetches public repository metadata from the GitHub REST API and persists
    a normalized copy into the canonical data/github.json knowledge source.

    The assistant reads repositories from data/github.json, so syncing updates
    the AI's GitHub knowledge (spec sections 14, 32).
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "portfolio-builder",
        }
        if settings.GITHUB_ACCESS_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_ACCESS_TOKEN}"
        self.client = httpx.AsyncClient(headers=self.headers, timeout=15.0)
        self.data_dir = data_dir or self._default_data_dir()

    @staticmethod
    def _default_data_dir() -> Path:
        if settings.KNOWLEDGE_DATA_DIR:
            return Path(settings.KNOWLEDGE_DATA_DIR).resolve()
        return Path(__file__).resolve().parents[3] / "data"

    async def fetch_user_repos(self, username: str) -> List[Dict[str, Any]]:
        """Pulls list of repositories for a target username."""
        url = f"{GITHUB_API}/users/{username}/repos"
        try:
            response = await self.client.get(url, params={"per_page": 100, "sort": "updated"})
            if response.status_code != 200:
                logger.error(f"GitHub fetch failed with code {response.status_code}: {response.text}")
                return []
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch GitHub repositories for '{username}': {e}")
            return []

    async def fetch_repo_readme(self, owner: str, repo: str) -> Optional[str]:
        """Pulls raw markdown README file for a specific repository."""
        url = f"{GITHUB_API}/repos/{owner}/{repo}/readme"
        headers = {**self.headers, "Accept": "application/vnd.github.raw+json"}
        try:
            response = await self.client.get(url, headers=headers)
            if response.status_code == 200:
                return response.text
            return None
        except Exception as e:
            logger.error(f"Failed to fetch README for '{owner}/{repo}': {e}")
            return None

    async def fetch_repo_languages(self, owner: str, repo: str) -> List[str]:
        url = f"{GITHUB_API}/repos/{owner}/{repo}/languages"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                return list(response.json().keys())
            return []
        except Exception as e:
            logger.error(f"Failed to fetch languages for '{owner}/{repo}': {e}")
            return []

    async def sync_github_data(self, username: str, db: AsyncSession) -> bool:
        """Fetch, normalize and persist repository knowledge to data/github.json."""
        logger.info(f"Starting GitHub synchronization check for user '{username}'")
        repos = await self.fetch_user_repos(username)
        if not repos:
            return False

        records: List[Dict[str, Any]] = []
        for repo_data in repos:
            name = repo_data.get("name")
            readme = await self.fetch_repo_readme(username, name)
            languages = await self.fetch_repo_languages(username, name)

            license_spdx = None
            if repo_data.get("license"):
                license_spdx = repo_data["license"].get("spdx_id")

            records.append(
                {
                    "name": name,
                    "full_name": repo_data.get("full_name"),
                    "description": repo_data.get("description"),
                    "readme": readme,
                    "language": repo_data.get("language"),
                    "languages": languages,
                    "topics": repo_data.get("topics") or [],
                    "url": repo_data.get("html_url"),
                    "homepage": repo_data.get("homepage"),
                    "license": license_spdx,
                    "stars": repo_data.get("stargazers_count", 0),
                    "forks": repo_data.get("forks_count", 0),
                    "last_updated": repo_data.get("updated_at"),
                }
            )
            logger.info(f"Synced Repo: {name} | Stars: {repo_data.get('stargazers_count', 0)}")

        if not records:
            return False

        self._write_github_json(records)
        self._refresh_knowledge()
        return True

    def _write_github_json(self, records: List[Dict[str, Any]]) -> None:
        """Best-effort write to the canonical data/github.json."""
        path = self.data_dir / "github.json"
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
            logger.info("Persisted %d repositories to %s", len(records), path)
        except Exception as e:
            # Immutable filesystems (e.g. serverless) cannot write; the committed
            # data/github.json remains the source of truth in production.
            logger.warning(f"Could not persist github.json to {path}: {e}")

    def _refresh_knowledge(self) -> None:
        try:
            from app.services.knowledge import get_knowledge_service

            changed = get_knowledge_service().refresh()
            logger.info("Knowledge refreshed after GitHub sync (changed=%s)", changed)
        except Exception as e:
            logger.warning(f"Knowledge refresh after GitHub sync failed: {e}")

    async def close(self):
        await self.client.aclose()


# Dependency injector
async def get_github_sync_service() -> GitHubSyncService:
    service = GitHubSyncService()
    try:
        yield service
    finally:
        await service.close()
