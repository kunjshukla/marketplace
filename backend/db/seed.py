#!/usr/bin/env python3
"""
Seed script to populate the NFT database with sample data.
Run this script to add sample NFTs to the marketplace.
"""

import sys
import os
import asyncio

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import get_db
from models.nft import NFT
from models.user import User
from config import config

async def seed_nfts():
    """Seed the database with sample NFTs"""
    
    print(f"🌱 Seeding database: {config.get_database_url()}")
    
    # Get database session
    async for db in get_db():
        try:
            # Check if NFTs already exist to avoid duplicates
            from sqlalchemy import select, func
            result = await db.execute(select(func.count(NFT.id)))
            existing_count = result.scalar()
            
            if existing_count > 0:
                print(f"⚠️ Database already contains {existing_count} NFTs. Skipping seed to avoid duplicates.")
                print("To reseed, run with --clear flag.")
                return
            
            # Sample NFT data with better images
            sample_nfts = [
                {
                    "title": "Digital Harmony #001",
                    "image_url": "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400&h=400&fit=crop",
                    "description": "A stunning digital artwork that captures the harmony between technology and nature.",
                    "price_inr": 5000.0,
                    "price_usd": 60.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "1",
                    "chain_id": 137  # Polygon
                },
                {
                    "title": "Cyber Genesis #002",
                    "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
                    "description": "A cyberpunk-inspired NFT exploring the genesis of digital consciousness.",
                    "price_inr": 7500.0,
                    "price_usd": 90.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "2",
                    "chain_id": 137
                },
                {
                    "title": "Abstract Dimensions #003",
                    "image_url": "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop",
                    "description": "An exploration of geometric patterns and abstract dimensions in digital space.",
                    "price_inr": 3500.0,
                    "price_usd": 42.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "3",
                    "chain_id": 137
                },
                {
                    "title": "Quantum Dreams #004",
                    "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop",
                    "description": "A vivid representation of quantum mechanics through digital artistry.",
                    "price_inr": 6000.0,
                    "price_usd": 72.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "4",
                    "chain_id": 137
                },
                {
                    "title": "Neural Networks #005",
                    "image_url": "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=400&h=400&fit=crop",
                    "description": "A visualization of artificial intelligence and neural network connections.",
                    "price_inr": 8500.0,
                    "price_usd": 102.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "5",
                    "chain_id": 137
                },
                {
                    "title": "Cosmic Voyage #006",
                    "image_url": "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=400&fit=crop",
                    "description": "A journey through space and time rendered in stunning digital detail.",
                    "price_inr": 4500.0,
                    "price_usd": 54.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "6",
                    "chain_id": 137
                },
                {
                    "title": "Ethereal Fragments #007",
                    "image_url": "https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400&h=400&fit=crop",
                    "description": "Fragmented memories of the digital realm captured in ethereal beauty.",
                    "price_inr": 5500.0,
                    "price_usd": 66.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890", 
                    "token_id": "7",
                    "chain_id": 137
                },
                {
                    "title": "Holographic Mind #008",
                    "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
                    "description": "A holographic representation of consciousness and thought patterns.",
                    "price_inr": 9500.0,
                    "price_usd": 114.0,
                    "is_sold": False,
                    "is_reserved": False,
                    "contract_address": "0x1234567890123456789012345678901234567890",
                    "token_id": "8",
                    "chain_id": 137
                }
            ]
            
            # Create NFT objects
            nft_objects = []
            for nft_data in sample_nfts:
                nft = NFT(**nft_data)
                nft_objects.append(nft)
            
            # Add all NFTs to the session
            db.add_all(nft_objects)
            
            # Commit the transaction
            await db.commit()
            
            print(f"✅ Successfully seeded {len(sample_nfts)} NFTs to the database!")
            print("\nSeeded NFTs:")
            for i, nft_data in enumerate(sample_nfts, 1):
                print(f"  {i}. {nft_data['title']} - ₹{nft_data['price_inr']} / ${nft_data['price_usd']}")
            
            # Get final count
            result = await db.execute(select(func.count(NFT.id)))
            total_count = result.scalar()
            print(f"\n📊 Database now contains {total_count} total NFTs")
            
        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            await db.rollback()
            raise e
        
        break  # Exit the async generator

async def clear_nfts():
    """Clear all NFTs from the database (use with caution!)"""
    async for db in get_db():
        try:
            # Delete all NFTs
            from sqlalchemy import delete
            result = await db.execute(delete(NFT))
            deleted_count = result.rowcount
            await db.commit()
            
            print(f"🗑️ Cleared {deleted_count} NFTs from the database")
            
        except Exception as e:
            print(f"❌ Error clearing database: {e}")
            await db.rollback()
            raise e
        
        break  # Exit the async generator

async def seed_admin_user():
    """Seed the database with an admin user for testing"""
    async for db in get_db():
        try:
            # Check if admin user already exists
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.email == "admin@marketplace.com"))
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("⚠️ Admin user already exists, skipping...")
                return
            
            # Create admin user
            admin_user = User(
                name="Admin User",
                email="admin@marketplace.com",
                google_id="admin_google_id_123",
                is_admin=True,
                profile_pic="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            )
            
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
            
            print(f"✅ Successfully created admin user with ID: {admin_user.id}")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            await db.rollback()
            raise e
        
        break  # Exit the async generator

async def main():
    """Main function to handle command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed the NFT database")
    parser.add_argument("--clear", action="store_true", help="Clear all NFTs before seeding")
    parser.add_argument("--clear-only", action="store_true", help="Only clear NFTs, don't seed")
    parser.add_argument("--admin", action="store_true", help="Create admin user")
    
    args = parser.parse_args()
    
    if args.clear_only:
        await clear_nfts()
    elif args.clear:
        await clear_nfts()
        await seed_nfts()
        if args.admin:
            await seed_admin_user()
    else:
        await seed_nfts()
        if args.admin:
            await seed_admin_user()

if __name__ == "__main__":
    asyncio.run(main())
