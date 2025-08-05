import os
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
import uvicorn
import logging
from contextlib import asynccontextmanager
from pydantic import BaseModel, validator
from typing import Optional
import redis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# Import scheduler and middleware
from utils.scheduler import start_scheduler, stop_scheduler
from middleware.logging import LoggingMiddleware, SecurityLoggingMiddleware, setup_logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Initialize additional loggers
security_logger, perf_logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown events"""
    # Startup
    try:
        # Initialize Redis for rate limiting
        from config import Config
        redis_url = getattr(Config, 'REDIS_URL', 'redis://localhost:6379')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await FastAPILimiter.init(redis_client)
        logging.info("Redis rate limiter initialized")
    except Exception as e:
        logging.warning(f"Redis not available, rate limiting disabled: {e}")
    
    start_scheduler()
    logging.info("Application startup complete")
    yield
    # Shutdown
    stop_scheduler()
    await FastAPILimiter.close()
    logging.info("Application shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title="NFT Marketplace API",
    description="Production-ready FastAPI backend for NFT marketplace with thirdweb integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityLoggingMiddleware)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Input validation models
class PurchaseRequest(BaseModel):
    nft_id: int
    
    @validator('nft_id')
    def validate_nft_id(cls, v):
        if v <= 0:
            raise ValueError('NFT ID must be a positive integer')
        if v > 999999:  # Reasonable upper limit
            raise ValueError('NFT ID too large')
        return v

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Import and include routers
from routes.auth import router as auth_router
from routes.nft import router as nft_router
from routes.purchase import router as purchase_router

# Apply rate limiting to purchase endpoints
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(nft_router, prefix="/api", tags=["NFTs"])
app.include_router(
    purchase_router, 
    prefix="/api", 
    tags=["Purchases"],
    dependencies=[Depends(RateLimiter(times=10, seconds=60))]  # 10 requests per minute for purchases
)

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "message": "NFT Marketplace API is running",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to NFT Marketplace API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    # Production-ready Uvicorn server configuration
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT", "production") == "development",
        log_level="info"
    )
