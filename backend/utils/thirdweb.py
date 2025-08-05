"""
Thirdweb integration utilities for fetching NFT metadata from blockchain contracts.
This module provides functions to interact with thirdweb's MarketplaceV3 contracts.
"""

import httpx
import asyncio
from typing import Dict, Optional, Any
from config import config

# Thirdweb API base URL
THIRDWEB_API_BASE = "https://api.thirdweb.com"

async def fetch_nft_metadata(
    chain: str, 
    contract_address: str, 
    nft_id: str
) -> Dict[str, Any]:
    """
    Fetch NFT metadata from thirdweb's MarketplaceV3 contract
    
    Args:
        chain: Blockchain network (e.g., "polygon", "ethereum", "137")
        contract_address: Smart contract address
        nft_id: Token ID of the NFT
        
    Returns:
        Dictionary containing NFT metadata (title, image_url, description, etc.)
        
    Raises:
        ValueError: If contract address or NFT ID is invalid
        httpx.HTTPError: If API request fails
        Exception: For other errors
    """
    
    if not contract_address or not nft_id:
        raise ValueError("Contract address and NFT ID are required")
    
    if not config.THIRDWEB_CLIENT_ID:
        raise ValueError("THIRDWEB_CLIENT_ID is not configured")
    
    # Normalize chain identifier
    chain_mapping = {
        "polygon": "137",
        "ethereum": "1",
        "mumbai": "80001",
        "goerli": "5"
    }
    
    chain_id = chain_mapping.get(chain.lower(), chain)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Construct API URL for NFT metadata
            url = f"{THIRDWEB_API_BASE}/v1/chains/{chain_id}/contracts/{contract_address}/nfts/{nft_id}"
            
            headers = {
                "Authorization": f"Bearer {config.THIRDWEB_CLIENT_ID}",
                "Content-Type": "application/json"
            }
            
            # Make API request
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                raise ValueError(f"NFT not found: chain={chain_id}, contract={contract_address}, token_id={nft_id}")
            
            if response.status_code != 200:
                raise httpx.HTTPError(f"Thirdweb API error: {response.status_code} - {response.text}")
            
            data = response.json()
            
            # Extract and normalize metadata
            metadata = {
                "title": data.get("metadata", {}).get("name", f"NFT #{nft_id}"),
                "description": data.get("metadata", {}).get("description", ""),
                "image_url": data.get("metadata", {}).get("image", ""),
                "attributes": data.get("metadata", {}).get("attributes", []),
                "token_id": str(nft_id),
                "contract_address": contract_address,
                "chain_id": chain_id,
                "owner": data.get("owner", ""),
                "token_uri": data.get("uri", ""),
                "supply": data.get("supply", "1"),
                "type": data.get("type", "ERC721")
            }
            
            # Clean up image URL (handle IPFS URLs)
            if metadata["image_url"].startswith("ipfs://"):
                metadata["image_url"] = metadata["image_url"].replace("ipfs://", "https://ipfs.io/ipfs/")
            
            return metadata
            
    except httpx.TimeoutException:
        raise Exception("Timeout while fetching NFT metadata from thirdweb")
    except httpx.HTTPError as e:
        raise Exception(f"HTTP error while fetching NFT metadata: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to fetch NFT metadata: {str(e)}")

async def fetch_marketplace_listings(
    chain: str,
    contract_address: str,
    start: int = 0,
    count: int = 100
) -> Dict[str, Any]:
    """
    Fetch active marketplace listings from thirdweb's MarketplaceV3 contract
    
    Args:
        chain: Blockchain network
        contract_address: Marketplace contract address
        start: Starting index for pagination
        count: Number of listings to fetch
        
    Returns:
        Dictionary containing active listings
    """
    
    if not contract_address:
        raise ValueError("Contract address is required")
    
    if not config.THIRDWEB_CLIENT_ID:
        raise ValueError("THIRDWEB_CLIENT_ID is not configured")
    
    # Normalize chain identifier
    chain_mapping = {
        "polygon": "137",
        "ethereum": "1",
        "mumbai": "80001",
        "goerli": "5"
    }
    
    chain_id = chain_mapping.get(chain.lower(), chain)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Construct API URL for marketplace listings
            url = f"{THIRDWEB_API_BASE}/v1/chains/{chain_id}/contracts/{contract_address}/marketplace/listings"
            
            headers = {
                "Authorization": f"Bearer {config.THIRDWEB_CLIENT_ID}",
                "Content-Type": "application/json"
            }
            
            params = {
                "start": start,
                "count": count
            }
            
            # Make API request
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                raise httpx.HTTPError(f"Thirdweb API error: {response.status_code} - {response.text}")
            
            data = response.json()
            
            return {
                "listings": data.get("result", []),
                "total_count": data.get("totalCount", 0),
                "start": start,
                "count": count
            }
            
    except Exception as e:
        raise Exception(f"Failed to fetch marketplace listings: {str(e)}")

async def sync_nft_with_blockchain(
    chain: str,
    contract_address: str,
    nft_id: str
) -> Dict[str, Any]:
    """
    Sync NFT data from blockchain and return normalized data for database storage
    
    Args:
        chain: Blockchain network
        contract_address: Smart contract address
        nft_id: Token ID of the NFT
        
    Returns:
        Dictionary with normalized NFT data ready for database insertion
    """
    
    try:
        # Fetch metadata from blockchain
        metadata = await fetch_nft_metadata(chain, contract_address, nft_id)
        
        # Normalize data for database storage
        nft_data = {
            "title": metadata["title"],
            "description": metadata["description"],
            "image_url": metadata["image_url"],
            "contract_address": contract_address,
            "token_id": str(nft_id),
            "chain_id": int(metadata["chain_id"]),
            # Default pricing (should be updated based on marketplace data)
            "price_inr": 0.0,
            "price_usd": 0.0,
            "is_sold": False,
            "sold_to_user_id": None
        }
        
        return nft_data
        
    except Exception as e:
        raise Exception(f"Failed to sync NFT with blockchain: {str(e)}")

# Synchronous wrapper functions for non-async contexts
def fetch_nft_metadata_sync(chain: str, contract_address: str, nft_id: str) -> Dict[str, Any]:
    """Synchronous wrapper for fetch_nft_metadata"""
    return asyncio.run(fetch_nft_metadata(chain, contract_address, nft_id))

def sync_nft_with_blockchain_sync(chain: str, contract_address: str, nft_id: str) -> Dict[str, Any]:
    """Synchronous wrapper for sync_nft_with_blockchain"""
    return asyncio.run(sync_nft_with_blockchain(chain, contract_address, nft_id))

# Example usage and testing
async def test_thirdweb_integration():
    """Test function to verify thirdweb integration"""
    
    try:
        # Test with a sample contract (replace with actual values)
        test_chain = "polygon"
        test_contract = "0x1234567890123456789012345678901234567890"
        test_nft_id = "1"
        
        print(f"Testing thirdweb integration...")
        print(f"Chain: {test_chain}")
        print(f"Contract: {test_contract}")
        print(f"NFT ID: {test_nft_id}")
        
        # Fetch metadata
        metadata = await fetch_nft_metadata(test_chain, test_contract, test_nft_id)
        print(f"✅ Successfully fetched metadata: {metadata['title']}")
        
        # Sync with blockchain
        nft_data = await sync_nft_with_blockchain(test_chain, test_contract, test_nft_id)
        print(f"✅ Successfully synced NFT data for database")
        
        return True
        
    except Exception as e:
        print(f"❌ Thirdweb integration test failed: {e}")
        return False

if __name__ == "__main__":
    # Run test
    asyncio.run(test_thirdweb_integration())
