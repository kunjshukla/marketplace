from fastapi import APIRouter, Depends, HTTPException, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import uuid
import logging
from pydantic import BaseModel, field_validator

from db.session import get_db
from models.user import User
from models.nft import NFT
from models.transaction import Transaction
from models.pydantic_models import PurchaseRequest, TransactionResponse
from utils.qr import generate_upi_qr
from utils.email import send_upi_qr_email
from utils.paypal import initiate_paypal_payment
from utils.auth import get_current_user
from utils.response import success_response, error_response, not_found_response, validation_error_response, server_error_response

router = APIRouter()
logger = logging.getLogger(__name__)

# Input validation schemas
class NFTIdPath(BaseModel):
    nft_id: int

    @field_validator('nft_id')
    @classmethod
    def validate_nft_id(cls, v):
        if v <= 0:
            raise ValueError('NFT ID must be a positive integer')
        if v > 999999:  # Reasonable upper limit
            raise ValueError('NFT ID too large')
        # Check for potential SQL injection patterns
        nft_id_str = str(v)
        import re
        if re.search(r"[;'\"\\]|--|/\*|\*/|union|select|drop|insert|update|delete", nft_id_str, re.IGNORECASE):
            raise ValueError('Invalid NFT ID format')
        return v

def validate_nft_id_path(nft_id: int = Path(..., gt=0, lt=1000000, description="NFT ID must be between 1 and 999999")):
    """Validate NFT ID from path parameter"""
    # Additional security checks
    nft_id_str = str(nft_id)
    if re.search(r'[;\'"\\]|--|/\*|\*/|union|select|drop|insert|update|delete', nft_id_str, re.IGNORECASE):
        raise HTTPException(
            status_code=400,
            detail="Invalid NFT ID format - potential security threat detected"
        )
    return nft_id

@router.post("/purchase/inr/{nft_id}")
async def purchase_inr(
    nft_id: int = Depends(validate_nft_id_path),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiate INR purchase with UPI QR code"""
    
    # Log security event for rate limiting/monitoring
    logger.info(f"INR purchase attempt for NFT {nft_id} by user {current_user.id} from IP: {getattr(current_user, 'ip_address', 'unknown')}")
    
    # Validate NFT exists and is available
    nft = db.query(NFT).filter(
        and_(
            NFT.id == nft_id,
            NFT.is_sold == False,
            NFT.is_reserved == False
        )
    ).first()
    
    if not nft:
        # Log potential attack
        logger.warning(f"Invalid NFT access attempt: NFT {nft_id} by user {current_user.id}")
        return not_found_response("NFT not found, already sold, or reserved")
    
    # Generate transaction reference
    txn_ref = str(uuid.uuid4())
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        nft_id=nft_id,
        payment_method="INR",
        status="pending",
        txn_ref=txn_ref,
        buyer_currency="INR",
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.flush()  # Get transaction ID
    
    try:
        # Generate UPI QR code
        qr_base64 = generate_upi_qr(
            user_email=current_user.email,
            amount=nft.price_inr,
            transaction_id=txn_ref
        )
        
        # Send email with QR code
        await send_upi_qr_email(
            recipient_email=current_user.email,
            qr_base64=qr_base64,
            amount=nft.price_inr,
            transaction_id=txn_ref
        )
        
        # Reserve the NFT
        nft.is_reserved = True
        nft.reserved_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"INR purchase initiated for NFT {nft_id} by user {current_user.id}")
        
        return success_response(
            data={
                "transaction_id": transaction.id,
                "txn_ref": txn_ref,
                "amount": nft.price_inr,
                "currency": "INR",
                "status": "pending"
            }
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initiate INR purchase: {str(e)}")
        return server_error_response("Failed to initiate purchase")

@router.post("/purchase/usd/{nft_id}")
async def purchase_usd(
    nft_id: int = Depends(validate_nft_id_path),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiate USD purchase with PayPal"""
    
    # Log security event for rate limiting/monitoring
    logger.info(f"USD purchase attempt for NFT {nft_id} by user {current_user.id} from IP: {getattr(current_user, 'ip_address', 'unknown')}")
    
    # Validate NFT exists and is available
    nft = db.query(NFT).filter(
        and_(
            NFT.id == nft_id,
            NFT.is_sold == False,
            NFT.is_reserved == False
        )
    ).first()
    
    if not nft:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "data": None, "error": "NFT not found, already sold, or reserved"}
        )
    
    # Generate transaction reference
    txn_ref = str(uuid.uuid4())
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        nft_id=nft_id,
        payment_method="USD",
        status="pending",
        txn_ref=txn_ref,
        buyer_currency="USD",
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.flush()  # Get transaction ID
    
    try:
        # Initiate PayPal payment
        approval_url = initiate_paypal_payment(
            amount=nft.price_usd,
            nft_id=nft_id,
            transaction_id=txn_ref,
            buyer_currency="USD",
            return_url="/payment/paypal-callback",
            cancel_url="/payment/cancel"
        )
        
        # Reserve the NFT
        nft.is_reserved = True
        nft.reserved_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"USD purchase initiated for NFT {nft_id} by user {current_user.id}")
        
        return {
            "success": True,
            "data": {
                "transaction_id": transaction.id,
                "txn_ref": txn_ref,
                "amount": nft.price_usd,
                "currency": "USD",
                "status": "pending",
                "approval_url": approval_url
            },
            "error": None
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initiate USD purchase: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "data": None, "error": "Failed to initiate purchase"}
        )

@router.post("/payment/paypal-webhook")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle PayPal webhook events with signature verification"""
    import paypalrestsdk
    from config import Config
    import httpx

    # Configure PayPal SDK
    paypalrestsdk.configure({
        "mode": "sandbox",  # Change to "live" for production
        "client_id": Config.PAYPAL_CLIENT_ID,
        "client_secret": Config.PAYPAL_CLIENT_SECRET
    })

    # Extract headers for verification
    headers = request.headers
    transmission_id = headers.get("PAYPAL-TRANSMISSION-ID")
    transmission_time = headers.get("PAYPAL-TRANSMISSION-TIME")
    cert_url = headers.get("PAYPAL-CERT-URL")
    auth_algo = headers.get("PAYPAL-AUTH-ALGO")
    transmission_sig = headers.get("PAYPAL-TRANSMISSION-SIG")
    webhook_id = Config.PAYPAL_WEBHOOK_ID  # Set this in your config

    # Get raw body
    body = await request.body()
    event = await request.json()

    # Verify webhook signature
    verify_payload = {
        "transmission_id": transmission_id,
        "transmission_time": transmission_time,
        "cert_url": cert_url,
        "auth_algo": auth_algo,
        "transmission_sig": transmission_sig,
        "webhook_id": webhook_id,
        "webhook_event": event
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {Config.PAYPAL_ACCESS_TOKEN}"},
            json=verify_payload
        )
        verification = resp.json()
    if verification.get("verification_status") != "SUCCESS":
        logger.error(f"PayPal webhook signature verification failed: {verification}")
        raise HTTPException(status_code=400, detail={"success": False, "data": None, "error": "Invalid PayPal webhook signature"})

    try:
        event_type = event.get("event_type")
        if event_type == "PAYMENT.SALE.COMPLETED":
            resource = event.get("resource", {})
            custom_data = resource.get("custom", "")
            buyer_currency = resource.get("amount", {}).get("currency", "USD")
            txn_ref = custom_data
            transaction = db.query(Transaction).filter(
                Transaction.txn_ref == txn_ref
            ).first()
            if transaction:
                transaction.status = "paid"
                transaction.buyer_currency = buyer_currency
                transaction.updated_at = datetime.utcnow()
                nft = db.query(NFT).filter(NFT.id == transaction.nft_id).first()
                if nft:
                    nft.is_sold = True
                    nft.is_reserved = False
                    nft.sold_to_user_id = transaction.user_id
                    nft.sold_at = datetime.utcnow()
                db.commit()
                logger.info(f"PayPal payment completed for transaction {txn_ref}, currency: {buyer_currency}")
            else:
                logger.error(f"Transaction not found for PayPal webhook: {txn_ref}")
        return {"success": True, "data": {"status": "success"}, "error": None}
    except Exception as e:
        logger.error(f"PayPal webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail={"success": False, "data": None, "error": "Webhook processing failed"})

@router.post("/admin/verify-transaction/{transaction_id}")
async def verify_inr_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to manually verify INR payments"""
    
    # Check if user is admin (assuming admin role exists)
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail={"success": False, "data": None, "error": "Admin access required"}
        )
    
    # Find the transaction
    transaction = db.query(Transaction).filter(
        and_(
            Transaction.id == transaction_id,
            Transaction.payment_method == "INR",
            Transaction.status == "pending"
        )
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "data": None, "error": "Transaction not found, not INR payment, or already processed"}
        )
    
    try:
        # Update transaction status
        transaction.status = "paid"
        transaction.updated_at = datetime.utcnow()
        
        # Update NFT as sold
        nft = db.query(NFT).filter(NFT.id == transaction.nft_id).first()
        if nft:
            nft.is_sold = True
            nft.is_reserved = False
            nft.sold_to_user_id = transaction.user_id
            nft.sold_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Admin verified INR transaction {transaction_id}")
        
        return {
            "success": True,
            "data": {
                "transaction_id": transaction_id,
                "status": "paid"
            },
            "error": None
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to verify transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "data": None, "error": "Failed to verify transaction"}
        )

@router.get("/admin/transactions")
async def get_pending_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to list pending INR transactions"""
    
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail={"success": False, "data": None, "error": "Admin access required"}
        )
    try:
        # Get pending INR transactions with user and NFT details
        transactions = db.query(Transaction).join(User).join(NFT).filter(
            and_(
                Transaction.payment_method == "INR",
                Transaction.status == "pending"
            )
        ).all()
        
        transaction_list = []
        for transaction in transactions:
            user = db.query(User).filter(User.id == transaction.user_id).first()
            nft = db.query(NFT).filter(NFT.id == transaction.nft_id).first()
            
            transaction_list.append({
                "transaction_id": transaction.id,
                "txn_ref": transaction.txn_ref,
                "nft_id": transaction.nft_id,
                "nft_title": nft.title if nft else "Unknown",
                "user_email": user.email if user else "Unknown",
                "amount": nft.price_inr if nft else 0,
                "status": transaction.status,
                "created_at": transaction.created_at.isoformat() if transaction.created_at else None
            })
        
        logger.info(f"Admin {current_user.id} fetched {len(transaction_list)} pending transactions")
        
        return {
            "success": True,
            "data": {
                "transactions": transaction_list,
                "total": len(transaction_list)
            },
            "error": None
        }
    except Exception as e:
        logger.error(f"Error fetching admin transactions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "data": None, "error": "Failed to fetch transactions"}
        )
