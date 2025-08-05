"""
Email utilities for sending UPI QR codes and payment notifications.
Uses Gmail SMTP with HTML templates and embedded images.
"""

import smtplib
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.utils import formataddr
from typing import Optional
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

from config import Config

# Set up logging
def setup_email_logging():
    """Set up email logging"""
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(f'{log_dir}/email.log'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

logger = setup_email_logging()

def create_upi_email_template(
    recipient_name: str,
    amount: float,
    transaction_id: str,
    qr_base64: str,
    upi_id: str
) -> str:
    """
    Create HTML email template with embedded UPI QR code
    
    Args:
        recipient_name: User's name
        amount: Payment amount
        transaction_id: Transaction ID
        qr_base64: Base64 encoded QR code image
        upi_id: UPI ID for payment
        
    Returns:
        HTML email content
    """
    
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NFT Payment - UPI QR Code</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }}
            .container {{
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 20px;
            }}
            .header h1 {{
                color: #495057;
                margin: 0;
                font-size: 28px;
            }}
            .header p {{
                color: #6c757d;
                margin: 10px 0 0 0;
                font-size: 16px;
            }}
            .payment-details {{
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #28a745;
            }}
            .payment-details h3 {{
                margin-top: 0;
                color: #495057;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #dee2e6;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .detail-label {{
                font-weight: 600;
                color: #495057;
            }}
            .detail-value {{
                color: #28a745;
                font-weight: 500;
            }}
            .qr-section {{
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #fff;
                border: 2px dashed #28a745;
                border-radius: 12px;
            }}
            .qr-code {{
                max-width: 250px;
                height: auto;
                margin: 15px 0;
                border: 1px solid #dee2e6;
                border-radius: 8px;
            }}
            .instructions {{
                background: #e7f3ff;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #007bff;
            }}
            .instructions h4 {{
                margin-top: 0;
                color: #495057;
            }}
            .instructions ol {{
                margin: 10px 0;
                padding-left: 20px;
            }}
            .instructions li {{
                margin: 8px 0;
                color: #495057;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                color: #6c757d;
                font-size: 14px;
            }}
            .amount-highlight {{
                font-size: 24px;
                font-weight: bold;
                color: #28a745;
            }}
            .transaction-id {{
                font-family: 'Courier New', monospace;
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎨 NFT Purchase Payment</h1>
                <p>Complete your payment using UPI</p>
            </div>
            
            <p>Dear {recipient_name},</p>
            
            <p>Thank you for your NFT purchase! Please complete your payment using the UPI QR code below.</p>
            
            <div class="payment-details">
                <h3>💳 Payment Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value amount-highlight">₹{amount:.2f}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Currency:</span>
                    <span class="detail-value">INR</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <span class="detail-value transaction-id">{transaction_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">UPI ID:</span>
                    <span class="detail-value">{upi_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payee:</span>
                    <span class="detail-value">NFT Marketplace</span>
                </div>
            </div>
            
            <div class="qr-section">
                <h3>📱 Scan QR Code to Pay</h3>
                <img src="data:image/png;base64,{qr_base64}" alt="UPI QR Code" class="qr-code">
                <p><strong>Scan this QR code with any UPI app</strong></p>
                <p style="color: #6c757d; font-size: 14px;">
                    Supported apps: PhonePe, Google Pay, Paytm, BHIM, etc.
                </p>
            </div>
            
            <div class="instructions">
                <h4>📋 Payment Instructions</h4>
                <ol>
                    <li>Open any UPI app on your mobile device</li>
                    <li>Scan the QR code above using your UPI app</li>
                    <li>Verify the payment details (amount: ₹{amount:.2f})</li>
                    <li>Enter your UPI PIN to complete the payment</li>
                    <li>Take a screenshot of the payment confirmation</li>
                </ol>
                
                <p><strong>⏰ Important:</strong> Please complete your payment within 24 hours. After this time, the NFT reservation will expire.</p>
            </div>
            
            <div class="footer">
                <p>Need help? Contact our support team</p>
                <p>NFT Marketplace | Powered by UPI</p>
                <p style="font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_template

async def send_upi_qr_email(
    recipient_email: str,
    qr_base64: str,
    amount: float,
    transaction_id: str,
    recipient_name: Optional[str] = None
) -> bool:
    """
    Send UPI QR code email asynchronously
    
    Args:
        recipient_email: Recipient's email address
        qr_base64: Base64 encoded QR code image
        amount: Payment amount in INR
        transaction_id: Transaction ID
        recipient_name: Recipient's name (optional)
        
    Returns:
        True if email sent successfully, False otherwise
    """
    
    # Validate configuration
    if not Config.GMAIL_EMAIL or not Config.GMAIL_APP_PASSWORD:
        logger.error("Gmail credentials not configured")
        return False
    
    # Set default name if not provided
    if not recipient_name:
        recipient_name = recipient_email.split('@')[0].title()
    
    try:
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor,
                _send_email_sync,
                recipient_email,
                qr_base64,
                amount,
                transaction_id,
                recipient_name
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to send UPI QR email to {recipient_email}: {str(e)}")
        return False

def _send_email_sync(
    recipient_email: str,
    qr_base64: str,
    amount: float,
    transaction_id: str,
    recipient_name: str
) -> bool:
    """
    Synchronous email sending (used by async wrapper)
    """
    
    try:
        # Create message
        msg = MIMEMultipart('related')
        msg['From'] = formataddr(('NFT Marketplace', Config.GMAIL_EMAIL))
        msg['To'] = recipient_email
        msg['Subject'] = f"Complete Your NFT Payment - ₹{amount:.2f} | Transaction: {transaction_id}"
        
        # Get UPI ID from config
        upi_id = getattr(config, 'UPI_ID', 'marketplace@upi')
        
        # Create HTML content
        html_content = create_upi_email_template(
            recipient_name, amount, transaction_id, qr_base64, upi_id
        )
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Connect and send email
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(Config.GMAIL_EMAIL, Config.GMAIL_APP_PASSWORD)
            server.send_message(msg)
        
        # Log success
        logger.info(f"UPI QR email sent successfully to {recipient_email} | Amount: ₹{amount} | Transaction: {transaction_id}")
        
        return True
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending email to {recipient_email}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending email to {recipient_email}: {str(e)}")
        return False

async def send_payment_confirmation_email(
    recipient_email: str,
    amount: float,
    transaction_id: str,
    nft_title: str,
    recipient_name: Optional[str] = None
) -> bool:
    """
    Send payment confirmation email
    
    Args:
        recipient_email: Recipient's email
        amount: Payment amount
        transaction_id: Transaction ID
        nft_title: NFT title
        recipient_name: Recipient's name
        
    Returns:
        True if sent successfully
    """
    
    if not recipient_name:
        recipient_name = recipient_email.split('@')[0].title()
    
    try:
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor,
                _send_confirmation_email_sync,
                recipient_email,
                amount,
                transaction_id,
                nft_title,
                recipient_name
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {recipient_email}: {str(e)}")
        return False

def _send_confirmation_email_sync(
    recipient_email: str,
    amount: float,
    transaction_id: str,
    nft_title: str,
    recipient_name: str
) -> bool:
    """Send payment confirmation email synchronously"""
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = formataddr(('NFT Marketplace', Config.GMAIL_EMAIL))
        msg['To'] = recipient_email
        msg['Subject'] = f"Payment Confirmed - {nft_title} | ₹{amount:.2f}"
        
        # Simple confirmation HTML
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🎉 Payment Confirmed!</h2>
            <p>Dear {recipient_name},</p>
            <p>Your payment has been successfully confirmed!</p>
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Purchase Details:</h3>
                <p><strong>NFT:</strong> {nft_title}</p>
                <p><strong>Amount:</strong> ₹{amount:.2f}</p>
                <p><strong>Transaction ID:</strong> {transaction_id}</p>
                <p><strong>Status:</strong> ✅ Confirmed</p>
            </div>
            
            <p>Thank you for your purchase!</p>
            <p>NFT Marketplace Team</p>
        </body>
        </html>
        """
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(Config.GMAIL_EMAIL, Config.GMAIL_APP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Confirmation email sent to {recipient_email} | Transaction: {transaction_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending confirmation email: {str(e)}")
        return False

# Test function
async def test_email_sending():
    """Test email sending functionality"""
    
    try:
        print("Testing email sending...")
        
        # Mock data
        test_email = "test@example.com"
        test_qr = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        test_amount = 999.0
        test_txn_id = "TEST_TXN_123"
        
        # Test UPI QR email
        result = await send_upi_qr_email(test_email, test_qr, test_amount, test_txn_id)
        print(f"UPI QR email test: {'✅ Passed' if result else '❌ Failed'}")
        
        # Test confirmation email
        result2 = await send_payment_confirmation_email(
            test_email, test_amount, test_txn_id, "Test NFT #1"
        )
        print(f"Confirmation email test: {'✅ Passed' if result2 else '❌ Failed'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        return False

if __name__ == "__main__":
    # Run async test
    asyncio.run(test_email_sending())
