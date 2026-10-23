from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.documents import router as documents_router
from app.api.reports import router as reports_router
from app.api.diagnostics import router as diagnostics_router

api_router = APIRouter()

# User authentication & profile
api_router.include_router(auth_router)

# Case CRUD and case evidence
api_router.include_router(cases_router)

# Document upload, retrieval, and processing
api_router.include_router(documents_router)

# Case reports
api_router.include_router(reports_router)

# System & Gemini diagnostics
api_router.include_router(diagnostics_router)
