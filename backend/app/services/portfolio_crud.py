from typing import Any, Dict, List, Optional

from app.db.session import get_supabase_client


class BaseCRUDService:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def get_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        query = client.table(self.table_name).select("*")
        
        if filters:
            for key, val in filters.items():
                query = query.eq(key, val)
                
        response = query.execute()
        return response.data

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        response = client.table(self.table_name).select("*").eq("id", item_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    def _sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            k: (v.isoformat() if hasattr(v, "isoformat") else v)
            for k, v in data.items()
            if v is not None
        }

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        client = get_supabase_client()
        # Convert date objects to ISO strings if present
        sanitized_data = self._sanitize(data)
        response = client.table(self.table_name).insert(sanitized_data).execute()
        return response.data[0]

    def update(self, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        sanitized_data = self._sanitize(data)
        response = client.table(self.table_name).update(sanitized_data).eq("id", item_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    def delete(self, item_id: str) -> bool:
        client = get_supabase_client()
        response = client.table(self.table_name).delete().eq("id", item_id).execute()
        return len(response.data) > 0


class ProjectService(BaseCRUDService):
    def __init__(self):
        super().__init__("projects")

    def get_published(self) -> List[Dict[str, Any]]:
        return self.get_all(filters={"status": "published"})


class ExperienceService(BaseCRUDService):
    def __init__(self):
        super().__init__("experience")


class EducationService(BaseCRUDService):
    def __init__(self):
        super().__init__("education")


class SkillService(BaseCRUDService):
    def __init__(self):
        super().__init__("skills")
