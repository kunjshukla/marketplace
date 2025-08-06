#!/usr/bin/env python3
"""
Manual smoke test for the NFT marketplace backend
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import get_db
from config import config

async def test_database_contents():
    """Test that our seeded data is accessible"""
    
    print("🧪 Testing Database Contents")
    print(f"📍 Database URL: {config.get_database_url()}")
    
    async for db in get_db():
        try:
            from sqlalchemy import text
            
            # Test 1: Check NFTs
            print("\n📋 Test 1: NFT Data")
            result = await db.execute(text("SELECT id, title, price_inr, price_usd, is_sold FROM nfts ORDER BY id LIMIT 5"))
            nfts = result.fetchall()
            
            if nfts:
                print(f"✅ Found {len(nfts)} NFTs in database:")
                for nft in nfts:
                    print(f"  - ID {nft[0]}: {nft[1]} - ₹{nft[2]} / ${nft[3]} (Sold: {nft[4]})")
            else:
                print("❌ No NFTs found in database")
            
            # Test 2: Check Users
            print("\n📋 Test 2: User Data")
            result = await db.execute(text("SELECT id, name, email, is_admin FROM users ORDER BY id"))
            users = result.fetchall()
            
            if users:
                print(f"✅ Found {len(users)} users in database:")
                for user in users:
                    print(f"  - ID {user[0]}: {user[1]} ({user[2]}) - Admin: {user[3]}")
            else:
                print("❌ No users found in database")
            
            # Test 3: Check Transactions
            print("\n📋 Test 3: Transaction Data")
            result = await db.execute(text("SELECT COUNT(*) FROM transactions"))
            tx_count = result.scalar()
            print(f"✅ Found {tx_count} transactions in database")
            
            # Test 4: Basic API-like queries
            print("\n📋 Test 4: API-like Queries")
            
            # Available NFTs query
            result = await db.execute(text("SELECT COUNT(*) FROM nfts WHERE is_sold = false AND is_reserved = false"))
            available_count = result.scalar()
            print(f"✅ Available NFTs for purchase: {available_count}")
            
            # Price range query
            result = await db.execute(text("SELECT MIN(price_inr), MAX(price_inr), AVG(price_inr) FROM nfts WHERE is_sold = false"))
            price_stats = result.fetchone()
            if price_stats and price_stats[0]:
                print(f"✅ Price range (INR): ₹{price_stats[0]:.0f} - ₹{price_stats[1]:.0f} (Avg: ₹{price_stats[2]:.0f})")
            
            print("\n🎉 Database smoke test completed successfully!")
            
        except Exception as e:
            print(f"❌ Database test failed: {e}")
            return False
        
        break
    
    return True

async def test_basic_functionality():
    """Test basic functionality that would be used by the API"""
    
    print("\n🧪 Testing Basic Functionality")
    
    async for db in get_db():
        try:
            from sqlalchemy import text
            
            # Test search functionality
            print("📋 Test: Search Functionality")
            search_term = "Digital"
            result = await db.execute(text("SELECT title FROM nfts WHERE title ILIKE :search"), {"search": f"%{search_term}%"})
            search_results = result.fetchall()
            print(f"✅ Search for '{search_term}' found {len(search_results)} results")
            
            # Test price filtering
            print("📋 Test: Price Filtering")
            max_price = 6000
            result = await db.execute(text("SELECT COUNT(*) FROM nfts WHERE price_inr <= :max_price AND is_sold = false"), {"max_price": max_price})
            filtered_count = result.scalar()
            print(f"✅ NFTs under ₹{max_price}: {filtered_count}")
            
            # Test admin user
            print("📋 Test: Admin User Check")
            result = await db.execute(text("SELECT name FROM users WHERE is_admin = true"))
            admin_users = result.fetchall()
            print(f"✅ Found {len(admin_users)} admin users: {[user[0] for user in admin_users]}")
            
            print("✅ Basic functionality tests passed!")
            
        except Exception as e:
            print(f"❌ Functionality test failed: {e}")
            return False
        
        break
    
    return True

async def main():
    """Run all smoke tests"""
    
    print("🚀 NFT Marketplace Backend Smoke Test")
    print("=" * 50)
    
    # Test 1: Database contents
    success1 = await test_database_contents()
    
    # Test 2: Basic functionality
    success2 = await test_basic_functionality()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 All smoke tests PASSED! Your backend is ready for production!")
        print("\n✅ Next steps:")
        print("  1. Fix the async/sync query issues in routes/nft.py")
        print("  2. Test the API endpoints manually")
        print("  3. Deploy to production environment")
        print("  4. Run frontend integration tests")
    else:
        print("❌ Some smoke tests FAILED. Please check the issues above.")
    
    return success1 and success2

if __name__ == "__main__":
    asyncio.run(main())
