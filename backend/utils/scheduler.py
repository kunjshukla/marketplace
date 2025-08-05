from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_

from db.session import SessionLocal
from models.nft import NFT
from models.transaction import Transaction

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

def create_scheduler():
    """Create and configure the scheduler"""
    global scheduler
    if scheduler is None:
        scheduler = AsyncIOScheduler()
        
        # Add job to check expired reservations every 5 minutes
        scheduler.add_job(
            func=check_expired_reservations,
            trigger=IntervalTrigger(minutes=5),
            id='check_expired_reservations',
            name='Check for expired NFT reservations',
            replace_existing=True
        )
        
        logger.info("Scheduler created with reservation expiry job")
    
    return scheduler

def start_scheduler():
    """Start the scheduler"""
    global scheduler
    if scheduler is None:
        scheduler = create_scheduler()
    
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")

def stop_scheduler():
    """Stop the scheduler"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")

async def check_expired_reservations():
    """
    Check for expired NFT reservations and release them
    Reservations expire after 30 minutes
    """
    try:
        db: Session = SessionLocal()
        
        # Calculate expiry time (30 minutes ago)
        expiry_time = datetime.utcnow() - timedelta(minutes=30)
        
        # Find reserved NFTs that have expired
        expired_nfts = db.query(NFT).filter(
            and_(
                NFT.is_reserved == True,
                NFT.is_sold == False,
                NFT.reserved_at < expiry_time
            )
        ).all()
        
        if expired_nfts:
            logger.info(f"Found {len(expired_nfts)} expired reservations")
            
            for nft in expired_nfts:
                # Release the reservation
                nft.is_reserved = False
                nft.reserved_at = None
                
                # Find and cancel related pending transactions
                pending_transactions = db.query(Transaction).filter(
                    and_(
                        Transaction.nft_id == nft.id,
                        Transaction.status == "pending"
                    )
                ).all()
                
                for transaction in pending_transactions:
                    transaction.status = "expired"
                    transaction.updated_at = datetime.utcnow()
                    logger.info(f"Expired transaction {transaction.id} for NFT {nft.id}")
                
                logger.info(f"Released expired reservation for NFT {nft.id}")
            
            db.commit()
            logger.info(f"Successfully processed {len(expired_nfts)} expired reservations")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error checking expired reservations: {str(e)}")
        if 'db' in locals():
            db.rollback()
            db.close()

def add_reservation_expiry_job(nft_id: int, minutes: int = 30):
    """
    Add a specific job to expire a reservation after specified minutes
    
    Args:
        nft_id: NFT ID to expire
        minutes: Minutes until expiry (default 30)
    """
    global scheduler
    if scheduler is None:
        scheduler = create_scheduler()
    
    # Schedule expiry for specific NFT
    run_date = datetime.utcnow() + timedelta(minutes=minutes)
    
    scheduler.add_job(
        func=expire_specific_reservation,
        args=[nft_id],
        trigger='date',
        run_date=run_date,
        id=f'expire_nft_{nft_id}',
        name=f'Expire reservation for NFT {nft_id}',
        replace_existing=True
    )
    
    logger.info(f"Scheduled reservation expiry for NFT {nft_id} at {run_date}")

async def expire_specific_reservation(nft_id: int):
    """
    Expire a specific NFT reservation
    
    Args:
        nft_id: NFT ID to expire
    """
    try:
        db: Session = SessionLocal()
        
        # Find the NFT
        nft = db.query(NFT).filter(
            and_(
                NFT.id == nft_id,
                NFT.is_reserved == True,
                NFT.is_sold == False
            )
        ).first()
        
        if nft:
            # Release the reservation
            nft.is_reserved = False
            nft.reserved_at = None
            
            # Cancel related pending transactions
            pending_transactions = db.query(Transaction).filter(
                and_(
                    Transaction.nft_id == nft_id,
                    Transaction.status == "pending"
                )
            ).all()
            
            for transaction in pending_transactions:
                transaction.status = "expired"
                transaction.updated_at = datetime.utcnow()
                logger.info(f"Expired transaction {transaction.id} for NFT {nft_id}")
            
            db.commit()
            logger.info(f"Expired specific reservation for NFT {nft_id}")
        else:
            logger.info(f"NFT {nft_id} is no longer reserved or was sold")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error expiring specific reservation for NFT {nft_id}: {str(e)}")
        if 'db' in locals():
            db.rollback()
            db.close()

def cancel_reservation_expiry(nft_id: int):
    """
    Cancel a scheduled reservation expiry (e.g., when payment is completed)
    
    Args:
        nft_id: NFT ID to cancel expiry for
    """
    global scheduler
    if scheduler:
        try:
            scheduler.remove_job(f'expire_nft_{nft_id}')
            logger.info(f"Cancelled reservation expiry for NFT {nft_id}")
        except Exception as e:
            logger.warning(f"Could not cancel reservation expiry for NFT {nft_id}: {str(e)}")
