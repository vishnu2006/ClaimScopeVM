from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.document_processor import DocumentProcessor
from app.services.fnol_extractor import FNOLExtractor
from app.services.llm_provider import LLMProvider, get_llm_provider

# Global document processor instance
_document_processor = DocumentProcessor()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async for session in get_db():
        yield session


def get_document_processor() -> DocumentProcessor:
    """Dependency that provides the DocumentProcessor service."""
    return _document_processor


def get_llm() -> LLMProvider:
    """Dependency that provides the configured LLM provider."""
    return get_llm_provider()


def get_fnol_extractor(
    llm: LLMProvider = Depends(get_llm),
) -> FNOLExtractor:
    """Dependency that provides the FNOLExtractor service."""
    return FNOLExtractor(llm_provider=llm)
