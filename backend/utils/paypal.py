import paypalrestsdk
import logging
from typing import Optional

from config import Config

logger = logging.getLogger(__name__)

def configure_paypal():
    """Configure PayPal SDK"""
    paypalrestsdk.configure({
        "mode": "sandbox",  # Change to "live" for production
        "client_id": Config.PAYPAL_CLIENT_ID,
        "client_secret": Config.PAYPAL_CLIENT_SECRET
    })

def initiate_paypal_payment(
    amount: float,
    nft_id: int,
    transaction_id: str,
    buyer_currency: str,
    return_url: str,
    cancel_url: str
) -> Optional[str]:
    """
    Initiate PayPal payment and return approval URL
    
    Args:
        amount: Payment amount
        nft_id: NFT ID being purchased
        transaction_id: Transaction reference ID
        buyer_currency: Currency code (USD, EUR, etc.)
        return_url: URL to redirect after successful payment
        cancel_url: URL to redirect after cancelled payment
    
    Returns:
        Approval URL for PayPal payment or None if failed
    """
    try:
        configure_paypal()
        
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": return_url,
                "cancel_url": cancel_url
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"NFT #{nft_id}",
                        "sku": f"nft_{nft_id}",
                        "price": str(amount),
                        "currency": buyer_currency,
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(amount),
                    "currency": buyer_currency
                },
                "description": f"Purchase of NFT #{nft_id}",
                "custom": transaction_id  # Store transaction reference
            }]
        })
        
        if payment.create():
            logger.info(f"PayPal payment created: {payment.id} for transaction {transaction_id}")
            
            # Find approval URL
            for link in payment.links:
                if link.rel == "approval_url":
                    return link.href
            
            logger.error(f"No approval URL found in PayPal response for transaction {transaction_id}")
            return None
            
        else:
            logger.error(f"PayPal payment creation failed: {payment.error}")
            return None
            
    except Exception as e:
        logger.error(f"PayPal payment initiation error: {str(e)}")
        return None

def execute_paypal_payment(payment_id: str, payer_id: str) -> bool:
    """
    Execute approved PayPal payment
    
    Args:
        payment_id: PayPal payment ID
        payer_id: PayPal payer ID
    
    Returns:
        True if payment execution succeeded, False otherwise
    """
    try:
        configure_paypal()
        
        payment = paypalrestsdk.Payment.find(payment_id)
        
        if payment.execute({"payer_id": payer_id}):
            logger.info(f"PayPal payment executed successfully: {payment_id}")
            return True
        else:
            logger.error(f"PayPal payment execution failed: {payment.error}")
            return False
            
    except Exception as e:
        logger.error(f"PayPal payment execution error: {str(e)}")
        return False

def get_payment_details(payment_id: str) -> Optional[dict]:
    """
    Get PayPal payment details
    
    Args:
        payment_id: PayPal payment ID
    
    Returns:
        Payment details dictionary or None if failed
    """
    try:
        configure_paypal()
        
        payment = paypalrestsdk.Payment.find(payment_id)
        
        if payment:
            return {
                "id": payment.id,
                "state": payment.state,
                "amount": payment.transactions[0].amount.total,
                "currency": payment.transactions[0].amount.currency,
                "custom": payment.transactions[0].custom,
                "payer_email": payment.payer.payer_info.email if payment.payer.payer_info else None
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting PayPal payment details: {str(e)}")
        return None
