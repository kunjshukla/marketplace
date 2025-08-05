#!/usr/bin/env python3
"""
Test script for NFT Marketplace backend utilities
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.qr import generate_upi_qr, get_upi_info
from utils.email import validate_email_config
import asyncio

def test_qr_generation():
    """Test UPI QR code generation"""
    print("Testing UPI QR code generation...")
    
    try:
        # Test QR code generation
        qr_base64 = generate_upi_qr(
            user_email="test@example.com",
            amount=1000.0,
            transaction_id="TEST123456"
        )
        
        print(f"✅ QR code generated successfully")
        print(f"   Base64 length: {len(qr_base64)} characters")
        print(f"   First 50 chars: {qr_base64[:50]}...")
        
        # Test UPI info
        info = get_upi_info()
        print(f"✅ UPI info retrieved: {info}")
        
    except Exception as e:
        print(f"❌ QR generation failed: {str(e)}")

def test_email_config():
    """Test email configuration"""
    print("\nTesting email configuration...")
    
    try:
        is_valid = validate_email_config()
        if is_valid:
            print("✅ Email configuration is valid")
        else:
            print("⚠️  Email configuration is missing")
    except Exception as e:
        print(f"❌ Email configuration test failed: {str(e)}")

def main():
    """Run all tests"""
    print("NFT Marketplace Backend - Utility Tests")
    print("=" * 50)
    
    # Test QR generation
    test_qr_generation()
    
    # Test email config
    test_email_config()
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    main()
