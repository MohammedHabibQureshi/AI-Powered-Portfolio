"""Automatic knowledge refresh tests (spec sections 30-31).

Verifies that updating data/linkedin.txt refreshes the assistant's knowledge
without any code or prompt changes, and that stale data is fully replaced.
"""

import pytest

from app.services.knowledge import KnowledgeService

SIMPLE_V1 = """Name: Mohammed Habib Qureshi
Role: Student

Skills:
Python
C
AWS
"""

SIMPLE_V2 = """Name: Mohammed Habib Qureshi
Role: Software Engineering Intern

Skills:
Python
C
AWS
Terraform
Blockchain
"""


@pytest.fixture
def knowledge(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "linkedin.txt").write_text(SIMPLE_V1, encoding="utf-8")
    return KnowledgeService(data_dir)


def _write(tmp_path, content: str) -> None:
    (tmp_path / "data" / "linkedin.txt").write_text(content, encoding="utf-8")


def test_skills_refresh_after_linkedin_update(knowledge, tmp_path):
    """Updating linkedin.txt adds Terraform/Blockchain with no code change."""
    profile = knowledge.snapshot().profile
    assert profile.skills == ["Python", "C", "AWS"]
    version_before = knowledge.snapshot().version

    _write(tmp_path, SIMPLE_V2)
    changed = knowledge.refresh()

    assert changed is True
    refreshed = knowledge.snapshot().profile
    assert refreshed.skills == ["Python", "C", "AWS", "Terraform", "Blockchain"]
    assert knowledge.snapshot().version != version_before


def test_stale_role_replaced(knowledge, tmp_path):
    """The AI must use the new role and stop answering with the old one."""
    assert knowledge.snapshot().profile.role == "Student"

    _write(tmp_path, SIMPLE_V2)
    knowledge.refresh()

    assert knowledge.snapshot().profile.role == "Software Engineering Intern"
    assert "Student" not in knowledge.snapshot().profile.role


def test_no_change_returns_false_without_rebuild(knowledge, tmp_path):
    """Identical content is a no-op (content hashing, spec section 17)."""
    version_before = knowledge.snapshot().version

    _write(tmp_path, SIMPLE_V1)  # same bytes
    changed = knowledge.refresh()

    assert changed is False
    assert knowledge.snapshot().version == version_before


def test_content_hash_tracks_linkedin(knowledge):
    """Knowledge version must change when the LinkedIn source hash changes."""
    linkedin_source = knowledge.snapshot().sources["linkedin"]
    assert linkedin_source.loaded is True
    assert linkedin_source.content_hash
    assert knowledge.snapshot().version.startswith(linkedin_source.content_hash)


def test_github_knowledge_loaded(tmp_path):
    """GitHub repository knowledge is loaded from data/github.json."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "linkedin.txt").write_text(SIMPLE_V1, encoding="utf-8")
    (data_dir / "github.json").write_text(
        '[{"name": "Blockchain-Learning", "description": "A blockchain learning repo", '
        '"readme": "# Blockchain Learning", "language": "Solidity"}]',
        encoding="utf-8",
    )

    service = KnowledgeService(data_dir)
    snapshot = service.snapshot()
    assert len(snapshot.repositories) == 1
    assert snapshot.repositories[0]["name"] == "Blockchain-Learning"
    assert "blockchain" in snapshot.vocabulary()
