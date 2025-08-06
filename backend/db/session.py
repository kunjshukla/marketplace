from config import config
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator

# Detect if using PostgreSQL (async) or SQLite (sync)
db_url = config.get_database_url()

if db_url.startswith("postgresql+asyncpg"):
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    engine = create_async_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=config.is_development(),
    )
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession
    )
    async def get_db() -> Generator[AsyncSession, None, None]:
        async with SessionLocal() as session:
            yield session
else:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        db_url,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
            "timeout": 20,
        },
        pool_pre_ping=True,
        pool_recycle=300,
        echo=config.is_development(),
    )
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    def get_db() -> Generator[Session, None, None]:
        with SessionLocal() as session:
            yield session

Base = declarative_base()

def create_tables():
    """
    Create all database tables.
    This should be called when the application starts.
    """
    # Import all models to ensure they are registered with Base
    from models.user import User
    from models.nft import NFT
    from models.transaction import Transaction
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def drop_tables():
    """
    Drop all database tables.
    Use with caution - this will delete all data!
    """
    Base.metadata.drop_all(bind=engine)
    print("⚠️ All database tables dropped")

def reset_database():
    """
    Reset the database by dropping and recreating all tables.
    Use with caution - this will delete all data!
    """
    drop_tables()
    create_tables()
    print("🔄 Database reset complete")

# Test database connection
def test_connection():
    """Test database connection"""
    try:
        from sqlalchemy import text
        db = SessionLocal()
        # Try to execute a simple query
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    # Test the database connection
    if test_connection():
        print("✅ Database connection successful")
        create_tables()
    else:
        print("❌ Database connection failed")
