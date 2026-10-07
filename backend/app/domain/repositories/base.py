from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

T = TypeVar('T')

class IRepository(Generic[T], ABC):
    """Domain layer repository interface contract."""
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Fetch all items with pagination support."""
        pass
    
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Optional[T]:
        """Fetch single item by UUID."""
        pass
    
    @abstractmethod
    async def add(self, entity: T) -> T:
        """Create new entity in DB context."""
        pass
    
    @abstractmethod
    async def update(self, id: UUID, entity: T) -> Optional[T]:
        """Update existing entity in DB context."""
        pass
    
    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Soft delete entity from active fetches."""
        pass
    
    @abstractmethod
    async def restore(self, id: UUID) -> bool:
        """Restore soft-deleted entity."""
        pass
