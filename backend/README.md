# NFT Marketplace FastAPI Backend

A production-ready FastAPI backend for an NFT marketplace with Google OAuth, database management, thirdweb integration, comprehensive payment processing, and enterprise security features.

## 🚀 Features

### Core Features
- ✅ **FastAPI** with production-ready configuration and OpenAPI docs
- ✅ **SQLAlchemy ORM** with database migrations and connection pooling
- ✅ **Google OAuth 2.0** authentication with secure JWT tokens
- ✅ **NFT marketplace** endpoints with pagination and filtering
- ✅ **Thirdweb integration** for blockchain NFT metadata sync
- ✅ **Standardized API responses** with consistent error handling

### Payment Processing
- ✅ **Multi-currency support**: INR (UPI) and USD (PayPal)
- ✅ **UPI QR code generation** with secure payment tracking
- ✅ **PayPal integration** with webhook signature verification
- ✅ **Email notifications** with embedded QR codes (Gmail SMTP)
- ✅ **Admin verification system** for manual payment confirmation
- ✅ **Transaction audit trail** with comprehensive logging

### Security & Performance
- ✅ **Rate limiting** with Redis backend (10 requests/minute for purchases)
- ✅ **Input sanitization** and SQL injection protection
- ✅ **Security headers** (HSTS, XSS protection, CSRF)
- ✅ **Webhook signature verification** for PayPal events
- ✅ **Comprehensive logging** (application, security, performance)
- ✅ **Environment-based configuration** with validation

### Operations & DevOps
- ✅ **Reservation system** with automatic expiry (30 minutes)
- ✅ **Background task scheduling** for cleanup operations
- ✅ **Health check endpoints** for monitoring
- ✅ **Heroku deployment ready** with Procfile and runtime
- ✅ **Docker support** for containerized deployment
- ✅ **CI/CD pipeline** with GitHub Actions

## 📋 Requirements

- Python 3.11+
- Redis (for rate limiting)
- PostgreSQL (production) or SQLite (development)
- Gmail account with app password
- Google OAuth 2.0 credentials
- PayPal developer account
- Thirdweb API key

## 🔧 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration values
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=sqlite:///marketplace.db  # or PostgreSQL URL for production

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_super_secret_jwt_key_change_in_production
JWT_SECRET=your_jwt_secret_key

# Thirdweb
THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

# Email Service
GMAIL_EMAIL=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=sandbox  # or 'live' for production

# UPI (India)
UPI_ID=your_upi_id@provider

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Application
ENVIRONMENT=development  # or 'production'
FRONTEND_URL=http://localhost:3000
PORT=8000
```

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

## 🔒 Security Features

### Authentication & Authorization
- **JWT tokens** with expiration and secure signing
- **Google OAuth 2.0** with proper scope validation
- **Role-based access control** for admin endpoints
- **CORS protection** with allowed origins configuration

### API Security
- **Rate limiting** (10 requests/minute for purchase endpoints)
- **Input validation** with Pydantic v2 models
- **SQL injection protection** with parameterized queries
- **XSS protection** with security headers
- **CSRF protection** with state validation

### Payment Security
- **PayPal webhook signature verification** for production
- **UPI payment validation** with transaction references
- **Admin verification workflow** for manual payments
- **Encrypted sensitive data** storage
- **Audit logging** for all financial transactions

### Infrastructure Security
- **Environment-based secrets** management
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Request/response logging** without sensitive data
- **Error handling** without information disclosure

## 📊 Monitoring & Logging

### Logging Structure
```
logs/
├── app.log          # Application events and errors
├── security.log     # Authentication and security events
└── performance.log  # Performance metrics and slow queries
```

### Health Monitoring
- **Health check endpoint**: `/health`
- **Database connectivity** validation
- **Redis connection** status
- **External service** health checks

### Performance Monitoring
- **Response time tracking**
- **Database query performance**
- **Rate limiting metrics**
- **Error rate monitoring**

## 🚀 Deployment

### Heroku Deployment

1. **Set up Heroku app:**
```bash
heroku create your-nft-marketplace-api
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
```

2. **Configure environment variables:**
```bash
heroku config:set GOOGLE_CLIENT_ID=your_value
heroku config:set GOOGLE_CLIENT_SECRET=your_value
heroku config:set SECRET_KEY=your_production_secret
# ... add all required environment variables
```

3. **Deploy:**
```bash
git push heroku main
```

### Docker Deployment

1. **Build and run:**
```bash
docker build -t nft-marketplace-api .
docker run -p 8000:8000 --env-file .env nft-marketplace-api
```

2. **Docker Compose (with Redis and PostgreSQL):**
```bash
docker-compose up -d
```

### Environment-Specific Configurations

#### Development
- SQLite database for quick setup
- Debug logging enabled
- CORS allows localhost origins
- Rate limiting disabled

#### Production
- PostgreSQL database with connection pooling
- Redis for rate limiting and caching
- Security headers enforced
- Comprehensive logging to files
- Environment variable validation

## 📡 API Endpoints

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
