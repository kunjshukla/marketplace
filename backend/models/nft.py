from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.session import Base

class NFT(Base):
    """NFT model for storing NFT information and marketplace data"""
    
    __tablename__ = "nfts"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # NFT information
    title = Column(String(255), nullable=False, index=True)
    image_url = Column(Text, nullable=False)  # URL to NFT image
    description = Column(Text, nullable=True)  # Optional NFT description
    
    # Pricing information
    price_inr = Column(Float, nullable=False, index=True)  # Price in Indian Rupees
    price_usd = Column(Float, nullable=False, index=True)  # Price in US Dollars
    
    # Marketplace status
    is_sold = Column(Boolean, default=False, nullable=False, index=True)
    is_reserved = Column(Boolean, default=False, nullable=False, index=True)  # Reservation status
    
    # Buyer information (nullable until sold)
    sold_to_user_id = Column(
        Integer, 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        index=True
    )
    
    # Blockchain information (optional, for thirdweb integration)
    contract_address = Column(String(255), nullable=True, index=True)
    token_id = Column(String(255), nullable=True, index=True)
    chain_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    sold_at = Column(DateTime(timezone=True), nullable=True)  # When NFT was sold
    reserved_at = Column(DateTime(timezone=True), nullable=True)  # When NFT was reserved
    
    # Relationships
    buyer = relationship("User", back_populates="purchased_nfts")
    transactions = relationship("Transaction", back_populates="nft")
    
    def __repr__(self):
        return f"<NFT(id={self.id}, title='{self.title}', price_inr={self.price_inr}, is_sold={self.is_sold})>"
    
    def to_dict(self):
        """Convert NFT object to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "image_url": self.image_url,
            "description": self.description,
            "price_inr": self.price_inr,
            "price_usd": self.price_usd,
            "is_sold": self.is_sold,
            "is_reserved": self.is_reserved,
            "sold_to_user_id": self.sold_to_user_id,
            "contract_address": self.contract_address,
            "token_id": self.token_id,
            "chain_id": self.chain_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sold_at": self.sold_at.isoformat() if self.sold_at else None,
            "reserved_at": self.reserved_at.isoformat() if self.reserved_at else None,
        }
    
    def to_public_dict(self):
        """Convert NFT object to dictionary for public API (excludes sensitive info)"""
        return {
            "id": self.id,
            "title": self.title,
            "image_url": self.image_url,
            "description": self.description,
            "price_inr": self.price_inr,
            "price_usd": self.price_usd,
            "is_sold": self.is_sold,
            "is_reserved": self.is_reserved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
