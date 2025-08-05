# NFT Marketplace FastAPI Backend

A production-ready FastAPI backend for an NFT marketplace with Google OAuth, SQLite database, thirdweb integration, and comprehensive payment processing.

## Features

- ✅ **FastAPI** with production-ready configuration
- ✅ **SQLite** database with SQLAlchemy ORM
- ✅ **Google OAuth 2.0** authentication with JWT tokens
- ✅ **NFT marketplace** endpoints (list, buy, transactions)
- ✅ **Thirdweb integration** for blockchain NFT metadata
- ✅ **Payment Processing**:
  - INR payments with UPI QR code generation
  - USD payments with PayPal integration
  - Email notifications with embedded QR codes
  - Admin verification for manual payments
- ✅ **Reservation System** with automatic expiry (30 minutes)
- ✅ **Task Scheduling** for reservation cleanup
- ✅ **Email Integration** with Gmail SMTP
- ✅ **CORS** support for Next.js frontend
- ✅ **Database seeding** with sample NFTs
- ✅ **Environment configuration** management

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual configuration values
```

Required environment variables:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (for OAuth)
- `THIRDWEB_CLIENT_ID` (for blockchain integration)
- `SECRET_KEY` and `JWT_SECRET` (for JWT tokens)
- `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` (for email notifications)
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (for USD payments)
- `UPI_ID` (for INR payments)

### 3. Initialize Database and Start Server

```bash
# Initialize database and seed with sample data
python startup.py

# Start the development server
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access the API

- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `GET /auth/login-google` - Initiate Google OAuth login
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user info
- `GET /auth/verify-token` - Verify JWT token
- `POST /auth/logout` - Logout

### NFTs
- `GET /api/nfts` - List available NFTs
- `GET /api/nfts/{nft_id}` - Get NFT details
- `POST /api/buy/{nft_id}` - Buy an NFT (requires authentication)
- `GET /api/my-purchases` - Get user's purchased NFTs
- `GET /api/my-transactions` - Get user's transactions

### Payment Processing
- `POST /api/purchase/inr/{nft_id}` - Initiate INR purchase with UPI QR code
- `POST /api/purchase/usd/{nft_id}` - Initiate USD purchase with PayPal
- `POST /api/payment/paypal-webhook` - Handle PayPal payment confirmation
- `POST /api/admin/verify-transaction/{transaction_id}` - Admin manual verification

### System
- `GET /health` - Health check endpoint

## Payment Flow

### INR Payment (UPI)
1. User initiates purchase via `POST /api/purchase/inr/{nft_id}`
2. System generates UPI QR code and reserves NFT for 30 minutes
3. User receives email with QR code and payment instructions
4. User pays via UPI app scanning QR code
5. Admin verifies payment via `POST /api/admin/verify-transaction/{id}`
6. NFT is marked as sold and transferred to user

### USD Payment (PayPal)
1. User initiates purchase via `POST /api/purchase/usd/{nft_id}`
2. System creates PayPal payment and reserves NFT for 30 minutes
3. User is redirected to PayPal for payment
4. PayPal webhook confirms payment completion
5. NFT is automatically marked as sold and transferred to user

## Database Models

### User
- `id` (Primary Key)
- `name`, `email`, `google_id`, `profile_pic`
- `is_admin` (Boolean for admin access)
- `created_at`, `updated_at`

### NFT
- `id` (Primary Key)
- `title`, `image_url`, `description`
- `price_inr`, `price_usd`
- `is_sold`, `is_reserved`, `sold_to_user_id`
- `contract_address`, `token_id`, `chain_id`
- `created_at`, `updated_at`, `sold_at`, `reserved_at`

### Transaction
- `id` (Primary Key)
- `user_id`, `nft_id` (Foreign Keys)
- `payment_method` (INR, USD), `status` (pending, paid, expired)
- `txn_ref`, `buyer_currency` (for analytics)
- `created_at`, `updated_at`

## Database Management

### Seed Sample Data
```bash
python db/seed.py
```

### Clear and Reseed
```bash
python db/seed.py --clear
```

### Reset Database
```bash
python -c "from db.session import reset_database; reset_database()"
```

## Reservation System

The backend implements an automatic reservation system:

- **Reservation Duration**: NFTs are reserved for 30 minutes when a purchase is initiated
- **Automatic Cleanup**: A scheduler runs every 5 minutes to clean up expired reservations
- **Status Management**: Expired transactions are marked as "expired" and NFTs become available again
- **Conflict Prevention**: Multiple users cannot purchase the same NFT simultaneously

## Background Tasks

The system uses APScheduler for background tasks:

- **Reservation Cleanup**: Runs every 5 minutes to release expired reservations
- **Email Processing**: Async email sending to avoid blocking API responses
- **Graceful Shutdown**: Scheduler is properly stopped during application shutdown

## Authentication Flow

1. **Frontend** redirects user to `/auth/login-google`
2. **User** completes Google OAuth flow
3. **Backend** receives callback, creates/updates user, generates JWT
4. **Frontend** receives JWT token and stores it
5. **API requests** include JWT in Authorization header: `Bearer <token>`

## Thirdweb Integration

The backend includes utilities to fetch NFT metadata from blockchain:

```python
from utils.thirdweb import fetch_nft_metadata

# Fetch NFT metadata from blockchain
metadata = await fetch_nft_metadata("polygon", "0x...", "1")
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `THIRDWEB_CLIENT_ID` | Thirdweb API client ID | Yes |
| `SECRET_KEY` | JWT signing secret | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `PORT` | Server port | No |
| `ENVIRONMENT` | dev/production | No |

## Production Deployment

### Using Gunicorn
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## Development

### Code Formatting
```bash
black .
isort .
flake8 .
```

### Running Tests
```bash
pytest
```

## Security Notes

- JWT tokens expire in 24 hours (configurable)
- Google OAuth provides secure user authentication
- Database uses foreign key constraints
- CORS is configured for your frontend domain
- Environment variables keep secrets secure

## Troubleshooting

### Database Issues
- Ensure SQLite file permissions are correct
- Check DATABASE_URL format: `sqlite:///marketplace.db`

### OAuth Issues
- Verify Google OAuth credentials in Google Cloud Console
- Check redirect URI matches exactly: `http://localhost:8000/auth/callback`
- Ensure OAuth consent screen is configured

### Thirdweb Issues
- Verify THIRDWEB_CLIENT_ID is valid
- Check contract addresses and chain IDs
- Test with known working contracts first

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the interactive API docs at `/docs`
3. Check logs for detailed error messages
4. Verify environment variable configuration
