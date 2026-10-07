from fastapi import APIRouter

from app.api.v1 import admin as v1_admin
from app.api.v1 import ai as v1_ai
from app.api.v1 import media as v1_media
from app.api.v1 import portfolio as v1_portfolio

api_router = APIRouter()

# Version 1 endpoints mapping
api_router.include_router(v1_portfolio.router, tags=["portfolio"])
api_router.include_router(v1_ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(v1_admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(v1_media.router, prefix="/admin/media", tags=["media"])
