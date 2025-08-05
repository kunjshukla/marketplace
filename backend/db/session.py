from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import os
from config import config

# Create SQLAlchemy engine with thread-safe configuration for SQLite
engine = create_engine(
    config.get_database_url(),
    # SQLite specific configurations for production
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False,  # Allow multiple threads
        "timeout": 20,  # Connection timeout in seconds
    },
    # Connection pool settings
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,  # Recycle connections every 5 minutes
    echo=config.is_development(),  # Log SQL queries in development
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create Base class for SQLAlchemy models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency to get database session.
    This function will be used as a dependency in FastAPI route handlers.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Rollback in case of exception
        db.rollback()
        raise e
    finally:
        # Always close the session
        db.close()

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
