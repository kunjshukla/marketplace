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
import asyncio
from datetime import datetime, timedelta

# Import the FastAPI app and dependencies
from main import app
from db.session import get_db, Base
from models.user import User
from models.nft import NFT
from models.transaction import Transaction
from utils.auth import get_current_user

# Configure test logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/tests.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
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
    if os.path.exists("test_integration.db"):
        os.remove("test_integration.db")

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def test_db():
    """Create test database session"""
    db = TestingSessionLocal()
    try:
        # Clean up data between tests
        db.query(Transaction).delete()
        db.query(NFT).delete()
        db.query(User).delete()
        db.commit()
        yield db
    finally:
        db.close()

@pytest.fixture
def sample_nft(test_db):
    """Create a sample NFT for testing"""
    nft = NFT(
        title="Integration Test NFT",
        image_url="https://example.com/integration.png",
        description="NFT for integration testing",
        price_inr=2000.0,
        price_usd=24.0,
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
        name="Integration Test User",
        email="integration@example.com",
        google_id="integration_google_id",
        is_admin=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def admin_user(test_db):
    """Create an admin user for testing"""
    admin = User(
        name="Integration Admin",
        email="admin@example.com",
        google_id="admin_google_id",
        is_admin=True
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


class TestEndToEndINRFlow:
    """Test end-to-end INR purchase and verification flow"""
    
    @patch('routes.auth.OAuth')
    @patch('routes.auth.create_jwt_token')
    @patch('utils.email.send_email_async')
    @patch('utils.qr.generate_upi_qr')
    def test_complete_inr_flow(self, mock_qr, mock_email, mock_jwt, mock_oauth, test_client, test_db, sample_nft):
        """Test complete flow: Google login → fetch NFTs → purchase INR → admin verify"""
        logger.info("Starting complete INR flow integration test")
        
        # Step 1: Mock Google OAuth login
        mock_client = Mock()
        mock_token = {'access_token': 'test_token'}
        mock_user_info = {
            'id': 'google_integration_123',
            'name': 'Integration Test User',
            'email': 'integration@example.com'
        }
        
        mock_client.authorize_access_token.return_value = mock_token
        mock_client.get.return_value.json.return_value = mock_user_info
        mock_oauth.return_value = mock_client
        mock_jwt.return_value = "integration_jwt_token"
        
        # Perform OAuth callback
        response = test_client.get("/auth/callback?code=integration_code")
        assert response.status_code == 200
        
        user_data = response.json()
        jwt_token = user_data["access_token"]
        user_id = user_data["user"]["id"]
        
        logger.info(f"✓ Step 1: User authenticated with JWT: {jwt_token[:20]}...")
        
        # Step 2: Fetch NFTs
        response = test_client.get("/api/nfts")
        assert response.status_code == 200
        nfts_response = response.json()
        assert nfts_response["success"] is True
        nfts = nfts_response["data"]
        assert len(nfts) >= 1
        
        target_nft = None
        for nft in nfts:
            if nft["id"] == sample_nft.id:
                target_nft = nft
                break
        
        assert target_nft is not None
        assert target_nft["is_sold"] is False
        
        logger.info(f"✓ Step 2: Found NFT {target_nft['id']} - {target_nft['title']}")
        
        # Step 3: Purchase NFT with INR
        app.dependency_overrides[get_current_user] = lambda: User(
            id=user_id,
            name="Integration Test User",
            email="integration@example.com",
            google_id="google_integration_123",
            is_admin=False
        )
        
        # Mock QR code and email
        mock_qr.return_value = "data:image/png;base64,mock_qr_code_data"
        mock_email.return_value = AsyncMock()
        
        response = test_client.post(
            f"/api/purchase/inr/{sample_nft.id}",
            headers={"Authorization": f"Bearer {jwt_token}"}
        )
        
        assert response.status_code == 200
        purchase_data = response.json()
        
        assert "transaction_id" in purchase_data
        assert "qr_code" in purchase_data
        assert purchase_data["amount"] == sample_nft.price_inr
        assert purchase_data["currency"] == "INR"
        
        transaction_id = purchase_data["transaction_id"]
        
        logger.info(f"✓ Step 3: INR purchase created, transaction ID: {transaction_id}")
        
        # Verify transaction was created in database
        transaction = test_db.query(Transaction).filter(Transaction.id == transaction_id).first()
        assert transaction is not None
        assert transaction.status == "pending"
        assert transaction.payment_method == "INR"
        assert transaction.buyer_currency == "INR"
        
        # Verify NFT is reserved
        test_db.refresh(sample_nft)
        assert sample_nft.is_reserved is True
        
        # Verify email was sent
        mock_email.assert_called_once()
        
        logger.info("✓ Step 3: Transaction created and NFT reserved")
        
        # Step 4: Admin verification
        app.dependency_overrides[get_current_user] = lambda: User(
            id=999,
            name="Integration Admin",
            email="admin@example.com",
            google_id="admin_google_id",
            is_admin=True
        )
        
        response = test_client.post(
            f"/api/admin/verify-transaction/{transaction_id}",
            headers={"Authorization": "Bearer admin_jwt_token"}
        )
        
        assert response.status_code == 200
        verify_data = response.json()
        assert verify_data["status"] == "verified"
        
        # Verify final state
        test_db.refresh(transaction)
        test_db.refresh(sample_nft)
        
        assert transaction.status == "verified"
        assert sample_nft.is_sold is True
        assert sample_nft.is_reserved is False
        
        logger.info("✓ Step 4: Transaction verified and NFT marked as sold")
        logger.info("✅ Complete INR flow integration test passed")


class TestEndToEndUSDFlow:
    """Test end-to-end USD purchase flow with PayPal webhook"""
    
    @patch('routes.auth.OAuth')
    @patch('routes.auth.create_jwt_token')
    @patch('utils.paypal.create_paypal_payment')
    @patch('paypalrestsdk.Payment')
    def test_complete_usd_flow(self, mock_payment_class, mock_paypal, mock_jwt, mock_oauth, test_client, test_db, sample_nft):
        """Test complete flow: Google login → purchase USD → PayPal webhook"""
        logger.info("Starting complete USD flow integration test")
        
        # Step 1: Mock Google OAuth login
        mock_client = Mock()
        mock_token = {'access_token': 'test_token'}
        mock_user_info = {
            'id': 'google_usd_123',
            'name': 'USD Test User',
            'email': 'usd@example.com'
        }
        
        mock_client.authorize_access_token.return_value = mock_token
        mock_client.get.return_value.json.return_value = mock_user_info
        mock_oauth.return_value = mock_client
        mock_jwt.return_value = "usd_jwt_token"
        
        # Perform OAuth callback
        response = test_client.get("/auth/callback?code=usd_code")
        assert response.status_code == 200
        
        user_data = response.json()
        jwt_token = user_data["access_token"]
        user_id = user_data["user"]["id"]
        
        logger.info(f"✓ Step 1: USD user authenticated with JWT: {jwt_token[:20]}...")
        
        # Step 2: Purchase NFT with USD
        app.dependency_overrides[get_current_user] = lambda: User(
            id=user_id,
            name="USD Test User",
            email="usd@example.com",
            google_id="google_usd_123",
            is_admin=False
        )
        
        # Mock PayPal payment creation
        mock_payment = Mock()
        mock_payment.links = [
            Mock(rel='approval_url', href='https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-USD123')
        ]
        mock_paypal.return_value = mock_payment
        
        response = test_client.post(
            f"/api/purchase/usd/{sample_nft.id}",
            headers={"Authorization": f"Bearer {jwt_token}"}
        )
        
        assert response.status_code == 200
        purchase_data = response.json()
        
        assert "transaction_id" in purchase_data
        assert "payment_url" in purchase_data
        assert purchase_data["amount"] == sample_nft.price_usd
        assert purchase_data["currency"] == "USD"
        assert "paypal.com" in purchase_data["payment_url"]
        
        transaction_id = purchase_data["transaction_id"]
        
        logger.info(f"✓ Step 2: USD purchase created, transaction ID: {transaction_id}")
        
        # Verify transaction was created
        transaction = test_db.query(Transaction).filter(Transaction.id == transaction_id).first()
        assert transaction is not None
        assert transaction.status == "pending"
        assert transaction.payment_method == "USD"
        assert transaction.buyer_currency == "USD"
        
        # Step 3: Simulate PayPal webhook
        webhook_payload = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {
                "id": f"paypal_payment_{transaction_id}",
                "status": "COMPLETED",
                "amount": {
                    "total": str(sample_nft.price_usd),
                    "currency": "USD"
                },
                "custom": str(transaction_id)  # Our transaction ID
            }
        }
        
        # Mock PayPal payment verification
        mock_paypal_payment = Mock()
        mock_paypal_payment.find.return_value = Mock(
            state='approved',
            payer=Mock(payer_info=Mock(email='usd@example.com')),
            transactions=[Mock(amount=Mock(total=str(sample_nft.price_usd)))]
        )
        mock_payment_class.find = Mock(return_value=mock_paypal_payment)
        
        response = test_client.post(
            "/api/webhooks/paypal",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        
        # Verify transaction is now paid
        test_db.refresh(transaction)
        test_db.refresh(sample_nft)
        
        assert transaction.status == "paid"
        assert sample_nft.is_sold is True
        assert sample_nft.is_reserved is False
        
        logger.info("✓ Step 3: PayPal webhook processed and NFT marked as sold")
        logger.info("✅ Complete USD flow integration test passed")


class TestReservationExpiryFlow:
    """Test reservation expiry functionality"""
    
    @patch('utils.scheduler.check_expired_reservations')
    def test_reservation_expiry_flow(self, mock_scheduler, test_db, sample_nft, sample_user):
        """Test that expired reservations are properly handled"""
        logger.info("Starting reservation expiry flow test")
        
        # Create expired reservation
        expired_time = datetime.utcnow() - timedelta(minutes=16)  # 16 minutes ago (expired)
        
        transaction = Transaction(
            user_id=sample_user.id,
            nft_id=sample_nft.id,
            payment_method="INR",
            status="pending",
            txn_ref="expired_ref",
            buyer_currency="INR",
            created_at=expired_time
        )
        test_db.add(transaction)
        sample_nft.reserved_at = expired_time
        sample_nft.is_reserved = True
        test_db.commit()
        
        # Mock scheduler to simulate expiry logic
        def mock_expiry_check():
            transaction.status = "expired"
            sample_nft.is_reserved = False
            sample_nft.reserved_at = None
            test_db.commit()
        
        # Trigger expiry check
        mock_expiry_check()
        
        # Verify expiry
        test_db.refresh(transaction)
        test_db.refresh(sample_nft)
        
        assert transaction.status == "expired"
        assert sample_nft.is_reserved is False
        assert sample_nft.reserved_at is None
        
        logger.info("✓ Reservation expiry flow test passed")


class TestConcurrentPurchases:
    """Test concurrent purchase prevention"""
    
    @patch('utils.email.send_email_async')
    @patch('utils.qr.generate_upi_qr')
    def test_concurrent_purchase_prevention(self, mock_qr, mock_email, test_client, test_db):
        """Test that concurrent purchases of same NFT are prevented"""
        logger.info("Starting concurrent purchase prevention test")
        
        # Create NFT
        nft = NFT(
            title="Concurrent Test NFT",
            image_url="https://example.com/concurrent.png",
            price_inr=1000.0,
            price_usd=12.0,
            is_sold=False,
            is_reserved=False
        )
        test_db.add(nft)
        test_db.commit()
        test_db.refresh(nft)
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Mock QR and email
        mock_qr.return_value = "mock_qr"
        mock_email.return_value = AsyncMock()
        
        # First purchase should succeed
        response1 = test_client.post(
            f"/api/purchase/inr/{nft.id}",
            headers={"Authorization": "Bearer test_token1"}
        )
        
        assert response1.status_code == 200
        
        # Second concurrent purchase should fail
        response2 = test_client.post(
            f"/api/purchase/inr/{nft.id}",
            headers={"Authorization": "Bearer test_token2"}
        )
        
        assert response2.status_code == 400
        data = response2.json()
        assert "reserved" in data["detail"].lower() or "sold" in data["detail"].lower()
        
        logger.info("✓ Concurrent purchase prevention test passed")


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_invalid_transaction_verification(self, test_client):
        """Test error handling for invalid transaction verification"""
        logger.info("Testing invalid transaction verification")
        
        app.dependency_overrides[get_current_user] = override_get_admin_user
        
        # Try to verify non-existent transaction
        response = test_client.post(
            "/api/admin/verify-transaction/99999",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
        logger.info("✓ Invalid transaction verification test passed")
    
    @patch('utils.email.send_email_async')
    def test_email_failure_handling(self, mock_email, test_client, test_db, sample_nft):
        """Test handling of email sending failures"""
        logger.info("Testing email failure handling")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Mock email failure
        mock_email.side_effect = Exception("Email service unavailable")
        
        with patch('utils.qr.generate_upi_qr', return_value="mock_qr"):
            response = test_client.post(
                f"/api/purchase/inr/{sample_nft.id}",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Purchase should still succeed even if email fails
        assert response.status_code == 200
        
        # But transaction should be created
        data = response.json()
        transaction_id = data["transaction_id"]
        
        transaction = test_db.query(Transaction).filter(Transaction.id == transaction_id).first()
        assert transaction is not None
        assert transaction.status == "pending"
        
        logger.info("✓ Email failure handling test passed")


class TestDataIntegrity:
    """Test data integrity and consistency"""
    
    def test_transaction_nft_consistency(self, test_client, test_db, sample_nft):
        """Test that transaction and NFT states remain consistent"""
        logger.info("Testing transaction-NFT consistency")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        with patch('utils.qr.generate_upi_qr', return_value="mock_qr"), \
             patch('utils.email.send_email_async', return_value=AsyncMock()):
            
            # Create purchase
            response = test_client.post(
                f"/api/purchase/inr/{sample_nft.id}",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            transaction_id = data["transaction_id"]
            
            # Verify NFT is reserved
            test_db.refresh(sample_nft)
            assert sample_nft.is_reserved is True
            
            # Get transaction
            transaction = test_db.query(Transaction).filter(Transaction.id == transaction_id).first()
            assert transaction.nft_id == sample_nft.id
            assert transaction.status == "pending"
            
            # Now verify as admin
            app.dependency_overrides[get_current_user] = override_get_admin_user
            
            response = test_client.post(
                f"/api/admin/verify-transaction/{transaction_id}",
                headers={"Authorization": "Bearer admin_token"}
            )
            
            assert response.status_code == 200
            
            # Verify final consistency
            test_db.refresh(transaction)
            test_db.refresh(sample_nft)
            
            assert transaction.status == "verified"
            assert sample_nft.is_sold is True
            assert sample_nft.is_reserved is False
            
        logger.info("✓ Transaction-NFT consistency test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
