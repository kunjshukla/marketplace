"""
Pydantic v2 models for API request/response validation
"""
from pydantic import BaseModel, field_validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    INR = "INR"
    USD = "USD"


class TransactionStatus(str, Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"


# User Models
class UserBase(BaseModel):
    """Base user model"""
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: str = Field(..., min_length=5, max_length=255, description="User's email address")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()


class UserCreate(UserBase):
    """User creation model"""
    google_id: str = Field(..., min_length=1, max_length=100, description="Google OAuth ID")
    profile_pic: Optional[str] = Field(None, max_length=500, description="Profile picture URL")


class UserResponse(UserBase):
    """User response model"""
    id: int = Field(..., description="User ID")
    google_id: str = Field(..., description="Google OAuth ID")
    profile_pic: Optional[str] = Field(None, description="Profile picture URL")
    is_admin: bool = Field(default=False, description="Admin status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    
    class Config:
        from_attributes = True


# NFT Models
class NFTBase(BaseModel):
    """Base NFT model"""
    title: str = Field(..., min_length=1, max_length=200, description="NFT title")
    description: Optional[str] = Field(None, max_length=1000, description="NFT description")
    price_inr: float = Field(..., gt=0, description="Price in Indian Rupees")
    price_usd: float = Field(..., gt=0, description="Price in US Dollars")
    
    @field_validator('price_inr', 'price_usd')
    @classmethod
    def validate_price(cls, v: float) -> float:
        """Validate price is positive and reasonable"""
        if v <= 0:
            raise ValueError('Price must be positive')
        if v > 1000000:  # 10 lakh INR or 10k USD max
            raise ValueError('Price too high')
        return round(v, 2)


class NFTCreate(NFTBase):
    """NFT creation model"""
    image_url: str = Field(..., min_length=1, max_length=500, description="NFT image URL")
    contract_address: str = Field(..., min_length=42, max_length=42, description="Ethereum contract address")
    token_id: int = Field(..., ge=0, description="Token ID on the contract")
    
    @field_validator('contract_address')
    @classmethod
    def validate_contract_address(cls, v: str) -> str:
        """Validate Ethereum contract address format"""
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum contract address format')
        return v.lower()


class NFTResponse(NFTBase):
    """NFT response model"""
    id: int = Field(..., description="NFT ID")
    image_url: str = Field(..., description="NFT image URL")
    contract_address: str = Field(..., description="Ethereum contract address")
    token_id: int = Field(..., description="Token ID on the contract")
    is_sold: bool = Field(default=False, description="Whether NFT is sold")
    is_reserved: bool = Field(default=False, description="Whether NFT is reserved")
    sold_to_user_id: Optional[int] = Field(None, description="ID of user who bought the NFT")
    reserved_at: Optional[datetime] = Field(None, description="Reservation timestamp")
    sold_at: Optional[datetime] = Field(None, description="Sale timestamp")
    created_at: datetime = Field(..., description="NFT creation timestamp")
    
    class Config:
        from_attributes = True


class NFTPublicResponse(BaseModel):
    """Public NFT response model (hides sensitive buyer information)"""
    id: int = Field(..., description="NFT ID")
    title: str = Field(..., description="NFT title")
    description: Optional[str] = Field(None, description="NFT description")
    image_url: str = Field(..., description="NFT image URL")
    price_inr: float = Field(..., description="Price in Indian Rupees")
    price_usd: float = Field(..., description="Price in US Dollars")
    is_sold: bool = Field(..., description="Whether NFT is sold")
    is_reserved: bool = Field(..., description="Whether NFT is reserved")
    contract_address: str = Field(..., description="Ethereum contract address")
    token_id: int = Field(..., description="Token ID on the contract")
    
    class Config:
        from_attributes = True


# Transaction Models
class TransactionBase(BaseModel):
    """Base transaction model"""
    payment_method: PaymentMethod = Field(..., description="Payment method used")
    buyer_currency: str = Field(..., min_length=3, max_length=3, description="Currency used by buyer")
    
    @field_validator('buyer_currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency code format"""
        if not re.match(r'^[A-Z]{3}$', v):
            raise ValueError('Currency must be a 3-letter uppercase code')
        return v


class TransactionCreate(TransactionBase):
    """Transaction creation model"""
    nft_id: int = Field(..., gt=0, description="NFT ID being purchased")
    
    @field_validator('nft_id')
    @classmethod
    def validate_nft_id(cls, v: int) -> int:
        """Validate NFT ID"""
        if v <= 0:
            raise ValueError('NFT ID must be positive')
        if v > 999999:  # Reasonable upper limit
            raise ValueError('NFT ID too large')
        return v


class TransactionResponse(TransactionBase):
    """Transaction response model"""
    id: int = Field(..., description="Transaction ID")
    user_id: int = Field(..., description="User ID who made the transaction")
    nft_id: int = Field(..., description="NFT ID being purchased")
    status: TransactionStatus = Field(..., description="Transaction status")
    txn_ref: str = Field(..., description="Transaction reference ID")
    amount: str = Field(..., description="Transaction amount")
    currency: str = Field(..., description="Transaction currency")
    gateway_response: Optional[str] = Field(None, description="Payment gateway response")
    created_at: datetime = Field(..., description="Transaction creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Transaction update timestamp")
    completed_at: Optional[datetime] = Field(None, description="Transaction completion timestamp")
    
    class Config:
        from_attributes = True


class TransactionPublicResponse(BaseModel):
    """Public transaction response model (minimal info)"""
    id: int = Field(..., description="Transaction ID")
    status: TransactionStatus = Field(..., description="Transaction status")
    payment_method: PaymentMethod = Field(..., description="Payment method used")
    amount: str = Field(..., description="Transaction amount")
    currency: str = Field(..., description="Transaction currency")
    created_at: datetime = Field(..., description="Transaction creation timestamp")
    
    class Config:
        from_attributes = True


# Request/Response Models
class PurchaseRequest(BaseModel):
    """Purchase initiation request"""
    nft_id: int = Field(..., gt=0, le=999999, description="NFT ID to purchase")
    
    @field_validator('nft_id')
    @classmethod
    def validate_nft_id(cls, v: int) -> int:
        """Validate NFT ID for security"""
        nft_id_str = str(v)
        if re.search(r"[;'\"\\]|--|/\*|\*/|union|select|drop|insert|update|delete", nft_id_str, re.IGNORECASE):
            raise ValueError('Invalid NFT ID format - potential security threat detected')
        return v


class NFTListResponse(BaseModel):
    """NFT list response with pagination"""
    nfts: List[NFTPublicResponse] = Field(..., description="List of NFTs")
    total: int = Field(..., description="Total number of NFTs")
    skip: int = Field(..., description="Number of items skipped")
    limit: int = Field(..., description="Number of items per page")
    has_more: bool = Field(..., description="Whether more items are available")


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Success status")
    data: Optional[dict] = Field(default=None, description="Response data")
    error: str = Field(..., description="Error message")


class SuccessResponse(BaseModel):
    """Success response model"""
    success: bool = Field(default=True, description="Success status")
    data: dict = Field(..., description="Response data")
    error: Optional[str] = Field(default=None, description="Error message")


# Admin Models
class AdminVerifyTransactionRequest(BaseModel):
    """Admin transaction verification request"""
    transaction_id: int = Field(..., gt=0, description="Transaction ID to verify")
    notes: Optional[str] = Field(None, max_length=500, description="Admin verification notes")
    
    @field_validator('transaction_id')
    @classmethod
    def validate_transaction_id(cls, v: int) -> int:
        """Validate transaction ID"""
        if v <= 0:
            raise ValueError('Transaction ID must be positive')
        return v
