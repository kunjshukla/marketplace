#!/usr/bin/env python3
"""
Simple seed script to populate the NFT database with sample data.
This version avoids relationship complexities and focuses on basic seeding.
"""

import sys
import os
import asyncio

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import get_db
from config import config

async def simple_seed():
    """Simple seed function using raw SQL to avoid ORM relationship issues"""
    
    print(f"🌱 Seeding database: {config.get_database_url()}")
    
    async for db in get_db():
        try:
            from sqlalchemy import text
            
            # Check if NFTs already exist
            result = await db.execute(text("SELECT COUNT(*) FROM nfts"))
            existing_count = result.scalar()
            
            if existing_count > 0:
                print(f"⚠️ Database already contains {existing_count} NFTs. Skipping seed to avoid duplicates.")
                return
            
            # Insert NFTs using raw SQL
            nft_data = [
                ("Digital Harmony #001", "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400&h=400&fit=crop", "A stunning digital artwork that captures the harmony between technology and nature.", 5000.0, 60.0, "0x1234567890123456789012345678901234567890", "1", 137),
                ("Cyber Genesis #002", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop", "A cyberpunk-inspired NFT exploring the genesis of digital consciousness.", 7500.0, 90.0, "0x1234567890123456789012345678901234567890", "2", 137),
                ("Abstract Dimensions #003", "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop", "An exploration of geometric patterns and abstract dimensions in digital space.", 3500.0, 42.0, "0x1234567890123456789012345678901234567890", "3", 137),
                ("Quantum Dreams #004", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop", "A vivid representation of quantum mechanics through digital artistry.", 6000.0, 72.0, "0x1234567890123456789012345678901234567890", "4", 137),
                ("Neural Networks #005", "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=400&h=400&fit=crop", "A visualization of artificial intelligence and neural network connections.", 8500.0, 102.0, "0x1234567890123456789012345678901234567890", "5", 137),
                ("Cosmic Voyage #006", "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=400&fit=crop", "A journey through space and time rendered in stunning digital detail.", 4500.0, 54.0, "0x1234567890123456789012345678901234567890", "6", 137),
                ("Ethereal Fragments #007", "https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400&h=400&fit=crop", "Fragmented memories of the digital realm captured in ethereal beauty.", 5500.0, 66.0, "0x1234567890123456789012345678901234567890", "7", 137),
                ("Holographic Mind #008", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop", "A holographic representation of consciousness and thought patterns.", 9500.0, 114.0, "0x1234567890123456789012345678901234567890", "8", 137)
            ]
            
            # Insert each NFT
            for title, image_url, description, price_inr, price_usd, contract_address, token_id, chain_id in nft_data:
                await db.execute(text("""
                    INSERT INTO nfts (title, image_url, description, price_inr, price_usd, 
                                     is_sold, is_reserved, contract_address, token_id, chain_id)
                    VALUES (:title, :image_url, :description, :price_inr, :price_usd, 
                           false, false, :contract_address, :token_id, :chain_id)
                """), {
                    "title": title,
                    "image_url": image_url,
                    "description": description,
                    "price_inr": price_inr,
                    "price_usd": price_usd,
                    "contract_address": contract_address,
                    "token_id": token_id,
                    "chain_id": chain_id
                })
            
            # Insert admin user
            await db.execute(text("""
                INSERT INTO users (name, email, google_id, is_admin, profile_pic)
                VALUES (:name, :email, :google_id, :is_admin, :profile_pic)
                ON CONFLICT (email) DO NOTHING
            """), {
                "name": "Admin User",
                "email": "admin@marketplace.com",
                "google_id": "admin_google_id_123",
                "is_admin": True,
                "profile_pic": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            })
            
            await db.commit()
            
            # Get final counts
            nft_result = await db.execute(text("SELECT COUNT(*) FROM nfts"))
            user_result = await db.execute(text("SELECT COUNT(*) FROM users"))
            
            nft_count = nft_result.scalar()
            user_count = user_result.scalar()
            
            print(f"✅ Successfully seeded {len(nft_data)} NFTs and 1 admin user!")
            print(f"📊 Database now contains {nft_count} NFTs and {user_count} users")
            
            print("\nSeeded NFTs:")
            for i, (title, _, _, price_inr, price_usd, _, _, _) in enumerate(nft_data, 1):
                print(f"  {i}. {title} - ₹{price_inr} / ${price_usd}")
                
        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            await db.rollback()
            raise e
        
        break  # Exit the async generator

if __name__ == "__main__":
    asyncio.run(simple_seed())
