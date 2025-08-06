#!/usr/bin/env python3
"""
Direct Frontend API Test
Test the exact API call that the frontend would make
"""

import requests
import json

def test_frontend_api_call():
    """Test the exact API call the frontend makes"""
    
    print("🧪 Direct Frontend API Test")
    print("=" * 40)
    
    # This mimics the exact API call from your frontend
    api_url = "http://localhost:8000/api/nfts"
    
    # Headers that match what a browser would send
    headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Parameters that match your frontend call
    params = {
        'limit': 8
    }
    
    try:
        print(f"📍 Making API call to: {api_url}")
        print(f"🔧 Parameters: {params}")
        print(f"🌐 Origin: {headers['Origin']}")
        
        response = requests.get(api_url, headers=headers, params=params)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"🔗 CORS Headers:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"   {header}: {value}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                nfts = data.get('data', [])
                print(f"\n✅ API Success! Retrieved {len(nfts)} NFTs")
                
                if nfts:
                    print(f"\n🎨 Sample NFT data (what frontend receives):")
                    sample = nfts[0]
                    print(f"   ID: {sample['id']}")
                    print(f"   Title: {sample['title']}")
                    print(f"   Price INR: ₹{sample['price_inr']}")
                    print(f"   Price USD: ${sample['price_usd']}")
                    print(f"   Image: {sample['image_url'][:60]}...")
                    print(f"   Sold: {sample['is_sold']}")
                
                # Test the exact structure your frontend expects
                print(f"\n🔍 Data Structure Check:")
                required_fields = ['id', 'title', 'description', 'image_url', 'price_inr', 'price_usd', 'is_sold', 'is_reserved']
                
                missing_fields = []
                for field in required_fields:
                    if field not in sample:
                        missing_fields.append(field)
                
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✅ All required fields present")
                
                print(f"\n🎉 Frontend should successfully display these NFTs!")
                
            else:
                print(f"❌ API returned success=false: {data.get('error', 'Unknown error')}")
                
        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    test_frontend_api_call()
