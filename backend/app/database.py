from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.base import Base

# Ensure all models are registered on Base.metadata
import app.models  # noqa: F401


def _normalize_database_url(raw_url: str) -> str:
    """Ensure PostgreSQL URLs use the asyncpg dialect driver for SQLAlchemy async."""
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _get_engine():
    db_url = _normalize_database_url(settings.DATABASE_URL)
    try:
        return create_async_engine(db_url, echo=settings.DEBUG)
    except Exception:
        # Fallback to local SQLite if PostgreSQL driver or connection is unavailable
        fallback_url = "sqlite+aiosqlite:///./claimscope.db"
        return create_async_engine(fallback_url, echo=settings.DEBUG)


engine = _get_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
