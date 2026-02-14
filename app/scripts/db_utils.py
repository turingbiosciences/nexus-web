import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

_engine = None
_session_factory = None

def get_database_session():
    """
    Creates and returns an async database session factory using DATABASE_URL_ADMIN.
    The engine is cached for reuse.
    """
    global _engine, _session_factory

    # If the session factory is already created, return it
    if _session_factory:
        return _session_factory

    load_dotenv()
    db_url = os.getenv("DATABASE_URL_ADMIN")
    if not db_url:
        print("Error: DATABASE_URL_ADMIN not found in .env")
        return None

    if not _engine:
        # Create engine
        _engine = create_async_engine(db_url)

    # Create the session factory
    _session_factory = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _session_factory

async def close_engine():
    """Closes the database engine."""
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None
