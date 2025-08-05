from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime

from db.session import get_db
from models.nft import NFT
from models.transaction import Transaction, PaymentMethod, TransactionStatus
from models.user import User
from routes.auth import get_current_user

# Create FastAPI router
router = APIRouter()

@router.get("/nfts")
async def list_available_nfts(
    skip: int = Query(0, ge=0, description="Number of NFTs to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of NFTs to return"),
    min_price_inr: Optional[float] = Query(None, ge=0, description="Minimum price in INR"),
    max_price_inr: Optional[float] = Query(None, ge=0, description="Maximum price in INR"),
    db: Session = Depends(get_db)
):
    """
    List all available NFTs (not sold) with optional filtering and pagination
    
    Returns:
        List of available NFTs with title, image_url, price_inr, price_usd
    """
    
    try:
        # Build query for available NFTs
        query = db.query(NFT).filter(NFT.is_sold == False)
        
        # Apply price filters if provided
        if min_price_inr is not None:
            query = query.filter(NFT.price_inr >= min_price_inr)
        
        if max_price_inr is not None:
            query = query.filter(NFT.price_inr <= max_price_inr)
        
        # Apply pagination
        nfts = query.offset(skip).limit(limit).all()
        
        # Get total count for pagination info
        total_count = query.count()
        
        # Convert to public dictionary format
        nft_list = [nft.to_public_dict() for nft in nfts]
        
        return {
            "success": True,
            "data": nft_list,
            "pagination": {
                "total": total_count,
                "skip": skip,
                "limit": limit,
                "has_more": (skip + limit) < total_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch NFTs: {str(e)}")

@router.get("/nfts/{nft_id}")
async def get_nft_details(
    nft_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific NFT
    
    Args:
        nft_id: ID of the NFT to retrieve
        
    Returns:
        Detailed NFT information
    """
    
    try:
        # Get NFT from database
        nft = db.query(NFT).filter(NFT.id == nft_id).first()
        
        if not nft:
            raise HTTPException(status_code=404, detail="NFT not found")
        
        # Return public information (hide buyer details if sold)
        nft_data = nft.to_public_dict()
        
        return {
            "success": True,
            "data": nft_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch NFT details: {str(e)}")

@router.post("/buy/{nft_id}")
async def buy_nft(
    nft_id: int,
    payment_method: PaymentMethod,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate NFT purchase by locking the NFT and creating a pending transaction
    
    Args:
        nft_id: ID of the NFT to purchase
        payment_method: Payment method (INR or USD)
        current_user: Authenticated user from JWT token
        
    Returns:
        Transaction details for payment processing
    """
    
    try:
        # Get NFT from database
        nft = db.query(NFT).filter(NFT.id == nft_id).first()
        
        if not nft:
            raise HTTPException(status_code=404, detail="NFT not found")
        
        if nft.is_sold:
            raise HTTPException(status_code=400, detail="NFT is already sold")
        
        # Check if user already has a pending transaction for this NFT
        existing_transaction = db.query(Transaction).filter(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.nft_id == nft_id,
                Transaction.status == TransactionStatus.PENDING
            )
        ).first()
        
        if existing_transaction:
            return {
                "success": True,
                "message": "Transaction already pending for this NFT",
                "data": existing_transaction.to_dict()
            }
        
        # Lock the NFT (mark as sold and assign to user)
        nft.is_sold = True
        nft.sold_to_user_id = current_user.id
        nft.sold_at = datetime.utcnow()
        
        # Create pending transaction
        transaction = Transaction(
            user_id=current_user.id,
            nft_id=nft_id,
            payment_method=payment_method,
            status=TransactionStatus.PENDING,
            amount=str(nft.price_inr if payment_method == PaymentMethod.INR else nft.price_usd),
            currency=payment_method.value
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        db.refresh(nft)
        
        return {
            "success": True,
            "message": "NFT locked successfully. Complete payment to finalize purchase.",
            "data": {
                "transaction": transaction.to_dict(),
                "nft": nft.to_public_dict(),
                "payment_info": {
                    "amount": transaction.amount,
                    "currency": transaction.currency,
                    "payment_method": payment_method.value
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to initiate purchase: {str(e)}")

@router.post("/transactions/{transaction_id}/complete")
async def complete_transaction(
    transaction_id: int,
    txn_ref: str,
    gateway_response: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete a transaction after successful payment
    
    Args:
        transaction_id: ID of the transaction to complete
        txn_ref: Payment gateway transaction reference
        gateway_response: Optional payment gateway response
        current_user: Authenticated user from JWT token
        
    Returns:
        Completed transaction details
    """
    
    try:
        # Get transaction from database
        transaction = db.query(Transaction).filter(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == current_user.id
            )
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if transaction.status != TransactionStatus.PENDING:
            raise HTTPException(status_code=400, detail="Transaction is not in pending status")
        
        # Update transaction
        transaction.status = TransactionStatus.PAID
        transaction.txn_ref = txn_ref
        transaction.gateway_response = gateway_response
        transaction.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transaction)
        
        return {
            "success": True,
            "message": "Transaction completed successfully",
            "data": transaction.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete transaction: {str(e)}")

@router.get("/my-purchases")
async def get_user_purchases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all NFTs purchased by the current user
    
    Returns:
        List of purchased NFTs and their transaction details
    """
    
    try:
        # Get all completed transactions for the user
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.status == TransactionStatus.PAID
            )
        ).all()
        
        # Get purchased NFTs
        purchases = []
        for transaction in transactions:
            nft = db.query(NFT).filter(NFT.id == transaction.nft_id).first()
            if nft:
                purchases.append({
                    "nft": nft.to_dict(),
                    "transaction": transaction.to_public_dict()
                })
        
        return {
            "success": True,
            "data": purchases,
            "total_purchases": len(purchases)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch purchases: {str(e)}")

@router.get("/my-transactions")
async def get_user_transactions(
    status: Optional[TransactionStatus] = Query(None, description="Filter by transaction status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all transactions for the current user
    
    Args:
        status: Optional filter by transaction status
        
    Returns:
        List of user's transactions
    """
    
    try:
        # Build query
        query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        transactions = query.order_by(Transaction.created_at.desc()).all()
        
        # Convert to public dictionary format
        transaction_list = [transaction.to_public_dict() for transaction in transactions]
        
        return {
            "success": True,
            "data": transaction_list,
            "total_transactions": len(transaction_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")
