"""Async SQLAlchemy engine and session factory."""

from collections.abc import AsyncGenerator
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def _async_database_url(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def get_engine() -> Optional[AsyncEngine]:
    global _engine, _session_factory
    if not settings.DATABASE_URL:
        return None
    if _engine is None:
        _engine = create_async_engine(
            _async_database_url(settings.DATABASE_URL),
            echo=settings.DEBUG,
            pool_pre_ping=True,
        )
        _session_factory = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )
    return _engine


def get_session_factory() -> Optional[async_sessionmaker[AsyncSession]]:
    get_engine()
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with factory() as session:
        yield session


async def init_db() -> None:
    """Create tables if they do not exist (dev convenience; use Alembic in prod)."""
    from db.base import Base
    from db.models import DigitalWill  # noqa: F401

    engine = get_engine()
    if engine is None:
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
