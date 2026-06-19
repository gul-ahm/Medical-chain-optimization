from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "supply_chain.db"))
DATABASE_URL = os.getenv("POSTGRES_URL", f"sqlite+aiosqlite:///{db_path.replace(os.sep, '/')}")

engine = create_async_engine(DATABASE_URL, echo=False)

# Optimize SQLite performance for concurrent workloads when using aiosqlite
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass
