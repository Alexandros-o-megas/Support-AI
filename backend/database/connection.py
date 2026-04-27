"""
Conexão assíncrona com PostgreSQL via SQLAlchemy
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://suporte:suporte123@localhost:5432/suporte_ia",
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
