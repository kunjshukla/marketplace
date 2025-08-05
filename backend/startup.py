#!/usr/bin/env python3
"""
Startup script for the NFT Marketplace FastAPI backend.
This script initializes the database and starts the server.
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.session import create_tables, test_connection
from config import config

def initialize_database():
    """Initialize the database with tables and seed data"""
    print("🔧 Initializing database...")
    
    # Test database connection
    if not test_connection():
        print("❌ Database connection failed. Please check your DATABASE_URL.")
        return False
    
    # Create tables
    create_tables()
    
    # Optional: Run seed script
    try:
        from db.seed import seed_nfts
        seed_nfts()
    except Exception as e:
        print(f"⚠️ Seeding failed (this is optional): {e}")
    
    return True

def validate_environment():
    """Validate required environment variables"""
    print("🔍 Validating environment configuration...")
    
    missing_vars = config.validate_required_vars()
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file and ensure all required variables are set.")
        return False
    
    print("✅ Environment configuration is valid")
    return True

def main():
    """Main startup function"""
    print("🚀 Starting NFT Marketplace API...")
    print(f"Environment: {config.ENVIRONMENT}")
    print(f"Port: {config.PORT}")
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Initialize database
    if not initialize_database():
        sys.exit(1)
    
    print("✅ Initialization complete!")
    print(f"🌐 API will be available at: http://localhost:{config.PORT}")
    print(f"📚 API Documentation: http://localhost:{config.PORT}/docs")
    print(f"🔍 Health Check: http://localhost:{config.PORT}/health")

if __name__ == "__main__":
    main()
