#!/usr/bin/env python3
"""
Seed script to populate the NFT database with sample data.
Run this script to add 5 sample NFTs to the marketplace.
"""

import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from db.session import SessionLocal, create_tables
from models.nft import NFT

def seed_nfts():
    """Seed the database with sample NFTs"""
    
    # Ensure tables exist
    create_tables()
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if NFTs already exist to avoid duplicates
        existing_count = db.query(NFT).count()
        if existing_count > 0:
            print(f"⚠️ Database already contains {existing_count} NFTs. Skipping seed to avoid duplicates.")
            print("To reseed, delete the marketplace.db file and run this script again.")
            return
        
        # Sample NFT data
        sample_nfts = [
            {
                "title": "Digital Art #1",
                "image_url": "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Art%20%231",
                "description": "A beautiful digital artwork representing the fusion of technology and creativity.",
                "price_inr": 5000.0,
                "price_usd": 60.0,
                "is_sold": False,
                "sold_to_user_id": None,
                "contract_address": "0x1234567890123456789012345678901234567890",
                "token_id": "1",
                "chain_id": 137  # Polygon
            },
            {
                "title": "Crypto Punk Style #2",
                "image_url": "https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Punk%20%232",
                "description": "A unique crypto punk style NFT with rare attributes and vibrant colors.",
                "price_inr": 7500.0,
                "price_usd": 90.0,
                "is_sold": False,
                "sold_to_user_id": None,
                "contract_address": "0x1234567890123456789012345678901234567890",
                "token_id": "2",
                "chain_id": 137
            },
            {
                "title": "Abstract Geometry #3",
                "image_url": "https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Geometry%20%233",
                "description": "An abstract geometric composition exploring mathematical beauty in digital form.",
                "price_inr": 3500.0,
                "price_usd": 42.0,
                "is_sold": False,
                "sold_to_user_id": None,
                "contract_address": "0x1234567890123456789012345678901234567890",
                "token_id": "3",
                "chain_id": 137
            },
            {
                "title": "Nature's Digital Echo #4",
                "image_url": "https://via.placeholder.com/400x400/96CEB4/FFFFFF?text=Nature%20%234",
                "description": "A digital interpretation of nature's patterns and organic structures.",
                "price_inr": 6000.0,
                "price_usd": 72.0,
                "is_sold": False,
                "sold_to_user_id": None,
                "contract_address": "0x1234567890123456789012345678901234567890",
                "token_id": "4",
                "chain_id": 137
            },
            {
                "title": "Futuristic Vision #5",
                "image_url": "https://via.placeholder.com/400x400/FFEAA7/000000?text=Future%20%235",
                "description": "A visionary piece depicting the future of digital art and blockchain technology.",
                "price_inr": 8500.0,
                "price_usd": 102.0,
                "is_sold": False,
                "sold_to_user_id": None,
                "contract_address": "0x1234567890123456789012345678901234567890",
                "token_id": "5",
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
        db.commit()
        
        print(f"✅ Successfully seeded {len(sample_nfts)} NFTs to the database!")
        print("\nSeeded NFTs:")
        for i, nft_data in enumerate(sample_nfts, 1):
            print(f"  {i}. {nft_data['title']} - ₹{nft_data['price_inr']} / ${nft_data['price_usd']}")
        
        print(f"\n📊 Database now contains {db.query(NFT).count()} total NFTs")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise e
        
    finally:
        db.close()

def clear_nfts():
    """Clear all NFTs from the database (use with caution!)"""
    db: Session = SessionLocal()
    
    try:
        # Delete all NFTs
        deleted_count = db.query(NFT).delete()
        db.commit()
        
        print(f"🗑️ Cleared {deleted_count} NFTs from the database")
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        db.rollback()
        raise e
        
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed the NFT database")
    parser.add_argument("--clear", action="store_true", help="Clear all NFTs before seeding")
    parser.add_argument("--clear-only", action="store_true", help="Only clear NFTs, don't seed")
    
    args = parser.parse_args()
    
    if args.clear_only:
        clear_nfts()
    elif args.clear:
        clear_nfts()
        seed_nfts()
    else:
        seed_nfts()
