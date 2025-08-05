import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import tempfile
import os
import json
import logging

# Import the FastAPI app and dependencies
from main import app
from db.session import get_db, Base
from models.user import User
from models.nft import NFT
from models.transaction import Transaction
from utils.auth import get_current_user

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user():
    return User(
        id=1,
        name="Test User",
        email="test@example.com",
        google_id="test_google_id",
        is_admin=False
    )

def override_get_admin_user():
    return User(
        id=2,
        name="Admin User",
        email="admin@example.com",
        google_id="admin_google_id",
        is_admin=True
    )

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        os.remove("test.db")

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def test_db():
    """Create test database session"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def sample_nft(test_db):
    """Create a sample NFT for testing"""
    nft = NFT(
        id=1,
        title="Test NFT",
        image_url="https://example.com/image.png",
        description="Test NFT description",
        price_inr=1000.0,
        price_usd=12.0,
        is_sold=False,
        is_reserved=False
    )
    test_db.add(nft)
    test_db.commit()
    test_db.refresh(nft)
    return nft

@pytest.fixture
def sample_user(test_db):
    """Create a sample user for testing"""
    user = User(
        name="Test User",
        email="test@example.com",
        google_id="test_google_id",
        is_admin=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    @patch('routes.auth.OAuth')
    def test_login_google_redirect(self, mock_oauth, test_client):
        """Test Google OAuth login redirect"""
        logger.info("Testing Google OAuth login redirect")
        
        # Mock OAuth client
        mock_client = Mock()
        mock_client.authorize_redirect.return_value = Mock(
            status_code=302,
            headers={'Location': 'https://accounts.google.com/oauth/authorize'}
        )
        mock_oauth.return_value = mock_client
        
        response = test_client.get("/auth/login-google")
        
        assert response.status_code == 302
        assert "google" in str(response.headers.get('Location', '')).lower()
        logger.info("✓ Google OAuth redirect test passed")

    @patch('routes.auth.OAuth')
    @patch('routes.auth.create_jwt_token')
    def test_auth_callback_success(self, mock_jwt, mock_oauth, test_client, test_db):
        """Test successful OAuth callback"""
        logger.info("Testing OAuth callback success")
        
        # Mock OAuth token and user info
        mock_client = Mock()
        mock_token = {'access_token': 'test_token'}
        mock_user_info = {
            'id': 'google_123',
            'name': 'Test User',
            'email': 'test@example.com'
        }
        
        mock_client.authorize_access_token.return_value = mock_token
        mock_client.get.return_value.json.return_value = mock_user_info
        mock_oauth.return_value = mock_client
        mock_jwt.return_value = "test_jwt_token"
        
        response = test_client.get("/auth/callback?code=test_code")
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        
        # Verify user was created in database
        user = test_db.query(User).filter(User.email == "test@example.com").first()
        assert user is not None
        assert user.google_id == "google_123"
        
        logger.info("✓ OAuth callback success test passed")


class TestNFTEndpoints:
    """Test NFT-related endpoints"""
    
    def test_get_nfts_list(self, test_client, sample_nft):
        """Test fetching NFT list"""
        logger.info("Testing NFT list retrieval")
        
        response = test_client.get("/api/nfts")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 1
        nft = data["data"][0]
        assert "title" in nft
        assert "price_inr" in nft
        assert "is_sold" in nft
        assert "created_at" in nft
        assert "pagination" in data or "pagination" in response.json()
        logger.info("✓ NFT list retrieval test passed")

    def test_get_single_nft(self, test_client, sample_nft):
        """Test fetching single NFT"""
        logger.info("Testing single NFT retrieval")
        
        response = test_client.get(f"/api/nfts/{sample_nft.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        nft = data["data"]
        assert nft["id"] == sample_nft.id
        assert nft["title"] == sample_nft.title
        assert nft["price_inr"] == sample_nft.price_inr
        logger.info("✓ Single NFT retrieval test passed")

    def test_get_nonexistent_nft(self, test_client):
        """Test fetching nonexistent NFT returns 404"""
        logger.info("Testing nonexistent NFT retrieval")
        
        response = test_client.get("/api/nfts/99999")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
        logger.info("✓ Nonexistent NFT test passed")


class TestPurchaseEndpoints:
    """Test purchase-related endpoints"""
    
    @patch('utils.email.send_email_async')
    @patch('utils.qr.generate_upi_qr')
    def test_purchase_inr_success(self, mock_qr, mock_email, test_client, sample_nft, test_db):
        """Test successful INR purchase with QR code generation and email"""
        logger.info("Testing INR purchase success")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Mock QR code generation
        mock_qr.return_value = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Mock email sending
        mock_email.return_value = AsyncMock()
        
        response = test_client.post(
            f"/api/purchase/inr/{sample_nft.id}",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transaction_id" in data
        assert "qr_code" in data
        assert data["amount"] == sample_nft.price_inr
        assert data["currency"] == "INR"
        
        # Verify transaction was created
        transaction = test_db.query(Transaction).filter(
            Transaction.id == data["transaction_id"]
        ).first()
        assert transaction is not None
        assert transaction.payment_method == "INR"
        assert transaction.status == "pending"
        assert transaction.buyer_currency == "INR"
        
        # Verify NFT is reserved
        test_db.refresh(sample_nft)
        assert sample_nft.is_reserved is True
        
        # Verify email was called
        mock_email.assert_called_once()
        
        logger.info("✓ INR purchase success test passed")

    @patch('utils.paypal.create_paypal_payment')
    def test_purchase_usd_success(self, mock_paypal, test_client, sample_nft, test_db):
        """Test successful USD purchase with PayPal"""
        logger.info("Testing USD purchase success")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Mock PayPal payment creation
        mock_payment = Mock()
        mock_payment.links = [
            Mock(rel='approval_url', href='https://paypal.com/pay/test123')
        ]
        mock_paypal.return_value = mock_payment
        
        response = test_client.post(
            f"/api/purchase/usd/{sample_nft.id}",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transaction_id" in data
        assert "payment_url" in data
        assert data["amount"] == sample_nft.price_usd
        assert data["currency"] == "USD"
        assert "paypal.com" in data["payment_url"]
        
        # Verify transaction was created
        transaction = test_db.query(Transaction).filter(
            Transaction.id == data["transaction_id"]
        ).first()
        assert transaction is not None
        assert transaction.payment_method == "USD"
        assert transaction.status == "pending"
        assert transaction.buyer_currency == "USD"
        
        logger.info("✓ USD purchase success test passed")

    def test_purchase_sold_nft_fails(self, test_client, test_db):
        """Test purchasing already sold NFT fails"""
        logger.info("Testing purchase of sold NFT")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Create sold NFT
        sold_nft = NFT(
            title="Sold NFT",
            image_url="https://example.com/sold.png",
            price_inr=1000.0,
            price_usd=12.0,
            is_sold=True,
            is_reserved=False
        )
        test_db.add(sold_nft)
        test_db.commit()
        
        response = test_client.post(
            f"/api/purchase/inr/{sold_nft.id}",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already sold" in data["detail"].lower()
        
        logger.info("✓ Sold NFT purchase test passed")

    def test_purchase_invalid_nft_id(self, test_client):
        """Test purchasing with invalid NFT ID"""
        logger.info("Testing purchase with invalid NFT ID")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Test with negative NFT ID (should be caught by input validation)
        response = test_client.post(
            "/api/purchase/inr/-1",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 422  # Validation error
        
        # Test with non-existent NFT ID
        response = test_client.post(
            "/api/purchase/inr/99999",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 404
        
        logger.info("✓ Invalid NFT ID purchase test passed")


class TestAdminEndpoints:
    """Test admin-related endpoints"""
    
    def test_verify_transaction_success(self, test_client, test_db, sample_nft):
        """Test successful transaction verification by admin"""
        logger.info("Testing admin transaction verification")
        
        app.dependency_overrides[get_current_user] = override_get_admin_user
        
        # Create pending transaction
        transaction = Transaction(
            user_id=1,
            nft_id=sample_nft.id,
            payment_method="INR",
            status="pending",
            txn_ref="test_ref_123",
            buyer_currency="INR"
        )
        test_db.add(transaction)
        test_db.commit()
        test_db.refresh(transaction)
        
        response = test_client.post(
            f"/api/admin/verify-transaction/{transaction.id}",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "verified"
        
        # Verify transaction status updated
        test_db.refresh(transaction)
        assert transaction.status == "verified"
        
        # Verify NFT is sold
        test_db.refresh(sample_nft)
        assert sample_nft.is_sold is True
        assert sample_nft.is_reserved is False
        
        logger.info("✓ Admin transaction verification test passed")

    def test_verify_transaction_non_admin_fails(self, test_client, test_db, sample_nft):
        """Test non-admin cannot verify transactions"""
        logger.info("Testing non-admin transaction verification failure")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Create pending transaction
        transaction = Transaction(
            user_id=1,
            nft_id=sample_nft.id,
            payment_method="INR",
            status="pending",
            txn_ref="test_ref_456",
            buyer_currency="INR"
        )
        test_db.add(transaction)
        test_db.commit()
        
        response = test_client.post(
            f"/api/admin/verify-transaction/{transaction.id}",
            headers={"Authorization": "Bearer user_token"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "admin" in data["detail"].lower()
        
        logger.info("✓ Non-admin verification failure test passed")

    def test_verify_nonexistent_transaction(self, test_client):
        """Test verifying nonexistent transaction"""
        logger.info("Testing verification of nonexistent transaction")
        
        app.dependency_overrides[get_current_user] = override_get_admin_user
        
        response = test_client.post(
            "/api/admin/verify-transaction/99999",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
        
        logger.info("✓ Nonexistent transaction verification test passed")


class TestInputValidation:
    """Test input validation and security"""
    
    @patch('utils.thirdweb.get_nft_metadata')
    def test_sql_injection_protection(self, mock_thirdweb, test_client):
        """Test SQL injection protection"""
        logger.info("Testing SQL injection protection")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        mock_thirdweb.return_value = {}
        
        # Try SQL injection in NFT ID
        malicious_id = "1; DROP TABLE nfts; --"
        response = test_client.post(
            f"/api/purchase/inr/{malicious_id}",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Should get validation error, not SQL error
        assert response.status_code == 422
        
        logger.info("✓ SQL injection protection test passed")

    def test_large_nft_id_validation(self, test_client):
        """Test large NFT ID validation"""
        logger.info("Testing large NFT ID validation")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Try very large NFT ID
        large_id = 99999999999
        response = test_client.post(
            f"/api/purchase/inr/{large_id}",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Should get validation error or 404, not server error
        assert response.status_code in [404, 422]
        
        logger.info("✓ Large NFT ID validation test passed")


@pytest.fixture
def sample_nft(test_db):
    """Create a sample NFT for testing"""
    nft = NFT(
        id=1,
        title="Test NFT",
        image_url="https://example.com/image.png",
        description="Test NFT description",
        price_inr=1000.0,
        price_usd=12.0,
        is_sold=False,
        is_reserved=False
    )
    test_db.add(nft)
    test_db.commit()
    test_db.refresh(nft)
    return nft

@pytest.fixture
def sample_user(test_db):
    """Create a sample user for testing"""
    user = User(
        name="Test User",
        email="test@example.com",
        google_id="test_google_id",
        is_admin=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user
    user = User(
        id=1,
        name="Test User",
        email="test@example.com",
        google_id="test_google_id",
        is_admin=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_google_login_redirect(self, test_client):
        """Test Google OAuth login redirect"""
        response = test_client.get("/auth/login-google")
        assert response.status_code == 302
        assert "accounts.google.com" in response.headers["location"]
    
    @patch('routes.auth.oauth')
    def test_google_callback_success(self, mock_oauth, test_client, test_db):
        """Test successful Google OAuth callback"""
        # Mock OAuth token and user info
        mock_token = {"access_token": "test_token"}
        mock_user_info = {
            "id": "test_google_id",
            "name": "Test User",
            "email": "test@example.com",
            "picture": "https://example.com/pic.jpg"
        }
        
        mock_oauth.google.authorize_access_token.return_value = mock_token
        mock_oauth.google.parse_id_token.return_value = mock_user_info
        
        response = test_client.get("/auth/callback?code=test_code")
        assert response.status_code == 302
        
        # Check if user was created in database
        user = test_db.query(User).filter(User.email == "test@example.com").first()
        assert user is not None
        assert user.name == "Test User"

class TestNFTEndpoints:
    """Test NFT endpoints"""
    
    def test_get_nfts_empty(self, test_client):
        """Test getting NFTs when none exist"""
        response = test_client.get("/api/nfts")
        assert response.status_code == 200
        data = response.json()
        assert "nfts" in data
        assert isinstance(data["nfts"], list)
    
    def test_get_nfts_with_data(self, test_client, sample_nft):
        """Test getting NFTs with sample data"""
        response = test_client.get("/api/nfts")
        assert response.status_code == 200
        data = response.json()
        assert len(data["nfts"]) >= 1
        
        nft = data["nfts"][0]
        assert nft["title"] == "Test NFT"
        assert nft["price_inr"] == 1000.0
        assert nft["is_sold"] is False
    
    def test_get_nft_by_id(self, test_client, sample_nft):
        """Test getting single NFT by ID"""
        response = test_client.get(f"/api/nfts/{sample_nft.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["nft"]["id"] == sample_nft.id
        assert data["nft"]["title"] == "Test NFT"

class TestPurchaseEndpoints:
    """Test purchase endpoints"""
    
    @patch('utils.qr.generate_upi_qr')
    @patch('utils.email.send_upi_qr_email')
    def test_purchase_inr_success(self, mock_email, mock_qr, test_client, sample_nft, sample_user):
        """Test successful INR purchase"""
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        mock_qr.return_value = "base64_qr_code"
        mock_email.return_value = True
        
        response = test_client.post(f"/api/purchase/inr/{sample_nft.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "transaction_id" in data
        assert data["currency"] == "INR"
        assert data["status"] == "pending"
        
        mock_qr.assert_called_once()
        mock_email.assert_called_once()
    
    def test_purchase_inr_nft_not_found(self, test_client):
        """Test INR purchase with non-existent NFT"""
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        response = test_client.post("/api/purchase/inr/999")
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
    
    @patch('utils.paypal.initiate_paypal_payment')
    def test_purchase_usd_success(self, mock_paypal, test_client, sample_nft):
        """Test successful USD purchase"""
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        mock_paypal.return_value = "https://paypal.com/approve/123"
        
        response = test_client.post(f"/api/purchase/usd/{sample_nft.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "approval_url" in data
        assert data["currency"] == "USD"
        assert "paypal.com" in data["approval_url"]
    
    def test_purchase_usd_unauthorized(self, test_client, sample_nft):
        """Test USD purchase without authentication"""
        response = test_client.post(f"/api/purchase/usd/{sample_nft.id}")
        assert response.status_code == 403  # Should require authentication

class TestAdminEndpoints:
    """Test admin endpoints"""
    
    def test_get_pending_transactions_admin(self, test_client, test_db):
        """Test admin getting pending transactions"""
        app.dependency_overrides[get_current_user] = override_get_admin_user
        
        # Create a pending transaction
        user = User(
            name="Test User",
            email="test@example.com",
            google_id="test_id",
            is_admin=False
        )
        test_db.add(user)
        test_db.flush()
        
        nft = NFT(
            title="Test NFT",
            image_url="test.jpg",
            price_inr=1000.0,
            price_usd=12.0
        )
        test_db.add(nft)
        test_db.flush()
        
        transaction = Transaction(
            user_id=user.id,
            nft_id=nft.id,
            payment_method="INR",
            status="pending",
            txn_ref="test_ref",
            buyer_currency="INR"
        )
        test_db.add(transaction)
        test_db.commit()
        
        response = test_client.get("/api/admin/transactions")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        assert len(data["transactions"]) >= 1
    
    def test_get_pending_transactions_non_admin(self, test_client):
        """Test non-admin trying to access admin endpoint"""
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        response = test_client.get("/api/admin/transactions")
        assert response.status_code == 403
    
    def test_verify_transaction_success(self, test_client, test_db):
        """Test successful transaction verification"""
        app.dependency_overrides[get_current_user] = override_get_admin_user
        
        # Create test data
        user = User(
            name="Test User",
            email="test@example.com",
            google_id="test_id"
        )
        test_db.add(user)
        test_db.flush()
        
        nft = NFT(
            title="Test NFT",
            image_url="test.jpg",
            price_inr=1000.0,
            price_usd=12.0
        )
        test_db.add(nft)
        test_db.flush()
        
        transaction = Transaction(
            user_id=user.id,
            nft_id=nft.id,
            payment_method="INR",
            status="pending",
            txn_ref="test_ref",
            buyer_currency="INR"
        )
        test_db.add(transaction)
        test_db.commit()
        
        response = test_client.post(f"/api/admin/verify-transaction/{transaction.id}")
        assert response.status_code == 200
        
        # Verify transaction status updated
        test_db.refresh(transaction)
        assert transaction.status == "paid"
        
        # Verify NFT marked as sold
        test_db.refresh(nft)
        assert nft.is_sold is True

class TestPayPalWebhook:
    """Test PayPal webhook endpoint"""
    
    def test_paypal_webhook_payment_completed(self, test_client, test_db):
        """Test PayPal webhook for completed payment"""
        # Create test transaction
        user = User(
            name="Test User",
            email="test@example.com",
            google_id="test_id"
        )
        test_db.add(user)
        test_db.flush()
        
        nft = NFT(
            title="Test NFT",
            image_url="test.jpg",
            price_inr=1000.0,
            price_usd=12.0
        )
        test_db.add(nft)
        test_db.flush()
        
        transaction = Transaction(
            user_id=user.id,
            nft_id=nft.id,
            payment_method="USD",
            status="pending",
            txn_ref="test_ref_123",
            buyer_currency="USD"
        )
        test_db.add(transaction)
        test_db.commit()
        
        # Mock PayPal webhook payload
        webhook_payload = {
            "event_type": "PAYMENT.SALE.COMPLETED",
            "resource": {
                "custom": "test_ref_123",
                "amount": {
                    "currency": "USD"
                }
            }
        }
        
        response = test_client.post("/api/payment/paypal-webhook", json=webhook_payload)
        assert response.status_code == 200
        
        # Verify transaction updated
        test_db.refresh(transaction)
        assert transaction.status == "paid"
        
        # Verify NFT marked as sold
        test_db.refresh(nft)
        assert nft.is_sold is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
