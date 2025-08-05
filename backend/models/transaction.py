from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.session import Base
import enum

class PaymentMethod(enum.Enum):
    """Enum for payment methods"""
    INR = "INR"
    USD = "USD"

class TransactionStatus(enum.Enum):
    """Enum for transaction status"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Transaction(Base):
    """Transaction model for storing payment and purchase information"""
    
    __tablename__ = "transactions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign keys
    user_id = Column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    nft_id = Column(
        Integer, 
        ForeignKey("nfts.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Payment information
    payment_method = Column(
        Enum(PaymentMethod), 
        nullable=False,
        index=True
    )
    status = Column(
        Enum(TransactionStatus), 
        default=TransactionStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Transaction reference from payment gateway
    txn_ref = Column(String(255), nullable=True, index=True)  # PayPal/Razorpay transaction ID
    
    # Payment gateway response (store full response for debugging)
    gateway_response = Column(Text, nullable=True)  # JSON string of gateway response
    
    # Amount information
    amount = Column(String(50), nullable=True)  # Store as string to avoid float precision issues
    currency = Column(String(10), nullable=True)  # INR, USD, etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)  # When payment was completed
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    nft = relationship("NFT", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, user_id={self.user_id}, nft_id={self.nft_id}, status={self.status.value})>"
    
    def to_dict(self):
        """Convert transaction object to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "nft_id": self.nft_id,
            "payment_method": self.payment_method.value if self.payment_method else None,
            "status": self.status.value if self.status else None,
            "txn_ref": self.txn_ref,
            "amount": self.amount,
            "currency": self.currency,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
    
    def to_public_dict(self):
        """Convert transaction object to dictionary for public API (excludes sensitive info)"""
        return {
            "id": self.id,
            "nft_id": self.nft_id,
            "payment_method": self.payment_method.value if self.payment_method else None,
            "status": self.status.value if self.status else None,
            "amount": self.amount,
            "currency": self.currency,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
