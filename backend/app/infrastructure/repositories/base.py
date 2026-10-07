from datetime import date, datetime
from typing import Any, Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.base import IRepository
from app.infrastructure.models.others import AuditLog

ModelType = TypeVar("ModelType")

def serialize_value(val: Any) -> Any:
    """Helper converting date/time and UUID objects to JSON-serializable strings."""
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, UUID):
        return str(val)
    return val

def entity_to_dict(entity: Any) -> dict:
    """Converts ORM entity attributes to a clean dictionary mapping."""
    result = {}
    for column in entity.__table__.columns:
        val = getattr(entity, column.name)
        result[column.name] = serialize_value(val)
    return result

class SQLAlchemyRepository(Generic[ModelType], IRepository[ModelType]):
    """Concrete SQLAlchemy 2.0 repository implementing soft-deletes and audited logging."""

    def __init__(self, model: Type[ModelType], db: AsyncSession, current_user_id: Optional[UUID] = None):
        self.model = model
        self.db = db
        self.current_user_id = current_user_id

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = (
            select(self.model)
            .where(self.model.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        stmt = (
            select(self.model)
            .where(self.model.id == id)
            .where(self.model.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def add(self, entity: ModelType) -> ModelType:
        # Add entity to db context
        self.db.add(entity)
        await self.db.flush()

        # Write Audit Log
        if self.model != AuditLog:
            audit = AuditLog(
                user_id=self.current_user_id,
                action="create",
                table_name=self.model.__tablename__,
                record_id=entity.id,
                previous_value={},
                new_value=entity_to_dict(entity)
            )
            self.db.add(audit)
            await self.db.flush()

        return entity

    async def update(self, id: UUID, entity_data: dict) -> Optional[ModelType]:
        item = await self.get_by_id(id)
        if not item:
            return None

        # Capture state before modifications
        old_values = entity_to_dict(item) if self.model != AuditLog else {}

        # Apply changes
        for key, value in entity_data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        await self.db.flush()

        # Write Audit Log
        if self.model != AuditLog:
            audit = AuditLog(
                user_id=self.current_user_id,
                action="update",
                table_name=self.model.__tablename__,
                record_id=item.id,
                previous_value=old_values,
                new_value=entity_to_dict(item)
            )
            self.db.add(audit)
            await self.db.flush()

        return item

    async def delete(self, id: UUID) -> bool:
        item = await self.get_by_id(id)
        if not item:
            return False

        old_values = entity_to_dict(item) if self.model != AuditLog else {}
        item.deleted_at = datetime.utcnow()
        await self.db.flush()

        # Write Audit Log
        if self.model != AuditLog:
            audit = AuditLog(
                user_id=self.current_user_id,
                action="soft_delete",
                table_name=self.model.__tablename__,
                record_id=item.id,
                previous_value=old_values,
                new_value=entity_to_dict(item)
            )
            self.db.add(audit)
            await self.db.flush()

        return True

    async def restore(self, id: UUID) -> bool:
        stmt = (
            select(self.model)
            .where(self.model.id == id)
            .where(self.model.deleted_at.is_not(None))
        )
        result = await self.db.execute(stmt)
        item = result.scalars().first()
        if not item:
            return False

        old_values = entity_to_dict(item) if self.model != AuditLog else {}
        item.deleted_at = None
        await self.db.flush()

        # Write Audit Log
        if self.model != AuditLog:
            audit = AuditLog(
                user_id=self.current_user_id,
                action="restore",
                table_name=self.model.__tablename__,
                record_id=item.id,
                previous_value=old_values,
                new_value=entity_to_dict(item)
            )
            self.db.add(audit)
            await self.db.flush()

        return True
