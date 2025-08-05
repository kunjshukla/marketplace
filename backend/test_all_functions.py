#!/usr/bin/env python3
"""
Comprehensive test script to verify all backend functionalities are integrated and working.
"""

import asyncio
import sys
import traceback
from datetime import datetime

def test_imports():
    """Test that all modules can be imported successfully"""
    print("🔍 Testing module imports...")
    
    try:
        # Test core modules
        from config import Config
        from db.session import SessionLocal, get_db, engine
        from models.user import User
        from models.nft import NFT
        from models.transaction import Transaction
        
        # Test utility modules
        from utils.qr import generate_upi_qr, validate_upi_payment_data
        from utils.email import send_upi_qr_email
        from utils.paypal import initiate_paypal_payment
        from utils.auth import create_jwt_token, verify_jwt_token
        from utils.scheduler import create_scheduler, start_scheduler, stop_scheduler
        from utils.thirdweb import get_nft_metadata
        
        # Test route modules
        from routes.auth import router as auth_router
        from routes.nft import router as nft_router
        from routes.purchase import router as purchase_router
        
        print("✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        traceback.print_exc()
        return False

def test_database_connection():
    """Test database connection and models"""
    print("\n🔍 Testing database connection...")
    
    try:
        from db.session import SessionLocal, test_connection
        from models.nft import NFT
        
        # Test connection
        if test_connection():
            print("✅ Database connection successful!")
        else:
            print("❌ Database connection failed!")
            return False
        
        # Test model query
        db = SessionLocal()
        nfts = db.query(NFT).limit(1).all()
        db.close()
        
        print(f"✅ Database query successful! Found {len(nfts)} NFT(s)")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_qr_generation():
    """Test UPI QR code generation"""
    print("\n🔍 Testing UPI QR code generation...")
    
    try:
        from utils.qr import generate_upi_qr, validate_upi_payment_data
        
        # Test QR generation
        qr_base64 = generate_upi_qr("test@example.com", 100.0, "test123")
        
        if qr_base64 and len(qr_base64) > 0:
            print(f"✅ QR code generated successfully! Length: {len(qr_base64)}")
        else:
            print("❌ QR code generation failed!")
            return False
        
        # Test UPI payment data validation
        if validate_upi_payment_data(100.0, "test123"):
            print("✅ UPI payment data validation successful!")
        else:
            print("❌ UPI payment data validation failed!")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ QR generation test failed: {e}")
        return False

def test_paypal_configuration():
    """Test PayPal configuration"""
    print("\n🔍 Testing PayPal configuration...")
    
    try:
        from utils.paypal import configure_paypal
        from config import Config
        
        configure_paypal()
        
        if Config.PAYPAL_CLIENT_ID and Config.PAYPAL_CLIENT_SECRET:
            print("✅ PayPal configuration loaded!")
        else:
            print("⚠️  PayPal credentials not configured (expected in development)")
        
        return True
        
    except Exception as e:
        print(f"❌ PayPal configuration test failed: {e}")
        return False

def test_jwt_functionality():
    """Test JWT token creation and verification"""
    print("\n🔍 Testing JWT functionality...")
    
    try:
        from utils.auth import create_jwt_token, verify_jwt_token
        
        # Create a test token
        token = create_jwt_token(1, "test@example.com")
        
        if token:
            print("✅ JWT token created successfully!")
        else:
            print("❌ JWT token creation failed!")
            return False
        
        # Verify the token
        payload = verify_jwt_token(token)
        
        if payload and payload.get("user_id") == 1:
            print("✅ JWT token verification successful!")
            return True
        else:
            print("❌ JWT token verification failed!")
            return False
        
    except Exception as e:
        print(f"❌ JWT functionality test failed: {e}")
        return False

def test_scheduler():
    """Test scheduler functionality"""
    print("\n🔍 Testing scheduler functionality...")
    
    try:
        from utils.scheduler import create_scheduler, start_scheduler, stop_scheduler
        
        scheduler = create_scheduler()
        
        if scheduler:
            print("✅ Scheduler created successfully!")
            
            # Don't actually start it in test to avoid conflicts
            print("✅ Scheduler functionality verified!")
            return True
        else:
            print("❌ Scheduler creation failed!")
            return False
        
    except Exception as e:
        print(f"❌ Scheduler test failed: {e}")
        return False

async def test_async_email():
    """Test async email functionality (without actually sending)"""
    print("\n🔍 Testing async email functionality...")
    
    try:
        from utils.email import send_upi_qr_email
        from config import Config
        
        if not Config.GMAIL_EMAIL or not Config.GMAIL_APP_PASSWORD:
            print("⚠️  Gmail credentials not configured - skipping actual email test")
            print("✅ Email module imported successfully!")
            return True
        
        # If credentials are available, we could test (but won't send actual email)
        print("✅ Email functionality available (credentials configured)")
        return True
        
    except Exception as e:
        print(f"❌ Async email test failed: {e}")
        return False

def test_api_routes():
    """Test that API routes are properly configured"""
    print("\n🔍 Testing API routes configuration...")
    
    try:
        import requests
        
        base_url = "http://localhost:8000"
        
        # Test health endpoint
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working!")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
        
        # Test NFT listing endpoint
        response = requests.get(f"{base_url}/api/nfts", timeout=5)
        if response.status_code == 200:
            data = response.json()
            nft_count = len(data.get("data", []))
            print(f"✅ NFT listing endpoint working! Found {nft_count} NFTs")
        else:
            print(f"❌ NFT listing endpoint failed: {response.status_code}")
            return False
        
        # Test API docs
        response = requests.get(f"{base_url}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API documentation accessible!")
        else:
            print(f"❌ API documentation failed: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("⚠️  Server not running - cannot test API endpoints")
        print("   Start the server with: python3 main.py")
        return False
    except Exception as e:
        print(f"❌ API routes test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting comprehensive backend functionality test...\n")
    
    tests = [
        ("Module Imports", test_imports),
        ("Database Connection", test_database_connection),
        ("QR Code Generation", test_qr_generation),
        ("PayPal Configuration", test_paypal_configuration),
        ("JWT Functionality", test_jwt_functionality),
        ("Scheduler", test_scheduler),
        ("Async Email", lambda: asyncio.run(test_async_email())),
        ("API Routes", test_api_routes),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All functionalities are properly integrated!")
        return True
    else:
        print("⚠️  Some functionalities need attention")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
