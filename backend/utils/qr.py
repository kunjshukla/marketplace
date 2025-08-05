"""
UPI QR Code generation utilities for INR payments.
Generates UPI payment QR codes for embedding in emails.
"""

import pyqrcode
import io
import base64
from typing import Optional
from config import Config

def generate_upi_qr(user_email: str, amount: float, transaction_id: str) -> str:
    """
    Generate a UPI QR code for payment
    
    Args:
        user_email: User's email address (for reference)
        amount: Payment amount in INR
        transaction_id: Unique transaction ID
        
    Returns:
        Base64 encoded PNG image of the QR code
        
    Raises:
        ValueError: If amount is invalid or UPI ID is not configured
        Exception: For QR code generation errors
    """
    
    # Validate input
    if not user_email:
        raise ValueError("User email is required")
    
    if not transaction_id:
        raise ValueError("Transaction ID is required")
    
    if amount <= 0:
        raise ValueError("Amount must be greater than 0")
    
    if amount > 100000:  # Reasonable upper limit
        raise ValueError("Amount cannot exceed ₹1,00,000")
    
    # Get UPI ID from configuration
    upi_id = getattr(Config, 'UPI_ID', 'marketplace@upi')
    if not upi_id:
        raise ValueError("UPI_ID is not configured in environment variables")
    
    try:
        # Format UPI URI according to NPCI specification
        upi_uri = (
            f"upi://pay?"
            f"pa={upi_id}&"  # Payee Address (UPI ID)
            f"pn=NFT Marketplace&"  # Payee Name
            f"am={amount:.2f}&"  # Amount
            f"cu=INR&"  # Currency
            f"tid={transaction_id}&"  # Transaction ID
            f"tn=NFT Purchase Payment"  # Transaction Note
        )
        
        # Generate QR code
        qr_code = pyqrcode.create(upi_uri)
        
        # Create PNG in memory
        buffer = io.BytesIO()
        qr_code.png(buffer, scale=8, module_color=[0, 0, 0, 128], background=[255, 255, 255])
        buffer.seek(0)
        
        # Convert to base64 for email embedding
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return qr_base64
        
    except Exception as e:
        raise Exception(f"Failed to generate UPI QR code: {str(e)}")

def validate_upi_payment_data(amount: float, transaction_id: str) -> bool:
    """
    Validate UPI payment data before QR generation
    
    Args:
        amount: Payment amount in INR
        transaction_id: Transaction ID
        
    Returns:
        True if valid, False otherwise
    """
    
    try:
        # Check amount
        if not isinstance(amount, (int, float)) or amount <= 0:
            return False
        
        if amount > 100000:  # Upper limit
            return False
        
        # Check transaction ID format
        if not transaction_id or len(transaction_id) < 5:
            return False
        
        # Check UPI ID configuration
        upi_id = getattr(Config, 'UPI_ID', '')
        if not upi_id:
            return False
        
        return True
        
    except Exception:
        return False

def get_upi_payment_info(amount: float, transaction_id: str) -> dict:
    """
    Get UPI payment information for display
    
    Args:
        amount: Payment amount in INR
        transaction_id: Transaction ID
        
    Returns:
        Dictionary with payment information
    """
    
    upi_id = getattr(Config, 'UPI_ID', 'marketplace@upi')
    
    return {
        "upi_id": upi_id,
        "amount": f"₹{amount:.2f}",
        "currency": "INR",
        "transaction_id": transaction_id,
        "payee_name": "NFT Marketplace",
        "note": "NFT Purchase Payment"
    }

# Test function for development
def test_upi_qr_generation():
    """Test UPI QR code generation"""
    
    try:
        # Test with sample data
        test_email = "test@example.com"
        test_amount = 1000.0
        test_transaction_id = "TXN_TEST_12345"
        
        print(f"Testing UPI QR generation...")
        print(f"Email: {test_email}")
        print(f"Amount: ₹{test_amount}")
        print(f"Transaction ID: {test_transaction_id}")
        
        # Generate QR code
        qr_base64 = generate_upi_qr(test_email, test_amount, test_transaction_id)
        
        print(f"✅ QR code generated successfully")
        print(f"Base64 length: {len(qr_base64)} characters")
        
        # Validate payment data
        is_valid = validate_upi_payment_data(test_amount, test_transaction_id)
        print(f"✅ Payment data validation: {'Passed' if is_valid else 'Failed'}")
        
        # Get payment info
        payment_info = get_upi_payment_info(test_amount, test_transaction_id)
        print(f"✅ Payment info: {payment_info}")
        
        return True
        
    except Exception as e:
        print(f"❌ UPI QR generation test failed: {e}")
        return False

if __name__ == "__main__":
    # Run test
    test_upi_qr_generation()
