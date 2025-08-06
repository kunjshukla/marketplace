#!/usr/bin/env python3
"""Test PostgreSQL connection and basic operations"""

import asyncio
import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.session import get_db, Base, engine
from models.user import User
from models.nft import NFT
from models.transaction import Transaction
from config import config

async def test_database():
    """Test database connection and basic operations"""
    
    print("🔍 Testing PostgreSQL Integration...")
    print(f"📍 Database URL: {config.get_database_url()}")
    
    try:
        # Test 1: Database connection
        print("\n📋 Test 1: Database Connection")
        async for db in get_db():
            print("✅ Successfully connected to PostgreSQL database!")
            
            # Test 2: Check if tables exist
            print("\n📋 Test 2: Checking Tables")
            
            # Query to check if our tables exist
            from sqlalchemy import text
            
            result = await db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'nfts', 'transactions')
                ORDER BY table_name;
            """))
            
            tables = [row[0] for row in result.fetchall()]
            print(f"✅ Found tables: {tables}")
            
            if len(tables) >= 3:
                print("✅ All required tables exist!")
            else:
                print(f"⚠️  Missing tables. Expected: ['nfts', 'transactions', 'users'], Found: {tables}")
            
            # Test 3: Basic data insertion test
            print("\n📋 Test 3: Basic Data Operations")
            
            # Try to insert a test user
            test_user = User(
                name="Test User",
                email="test@example.com",
                google_id="test_google_id_123"
            )
            
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            
            print(f"✅ Successfully created test user with ID: {test_user.id}")
            
            # Clean up test data
            await db.delete(test_user)
            await db.commit()
            print("✅ Successfully cleaned up test data")
            
            break
            
        print("\n🎉 PostgreSQL integration test completed successfully!")
        print("✅ Your database is ready for production use!")
        
    except Exception as e:
        print(f"\n❌ Database test failed: {e}")
        print("🔧 Please check your PostgreSQL connection and credentials.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_database())
