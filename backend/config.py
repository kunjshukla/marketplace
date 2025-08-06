import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for environment variables"""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///marketplace.db")
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
    
    # Gmail Configuration
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    GMAIL_EMAIL: str = os.getenv("GMAIL_EMAIL", "")
    
    # UPI Configuration for Indian payments
    UPI_ID: str = os.getenv("UPI_ID", "marketplace@upi")
    
    # PayPal Configuration
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_MODE: str = os.getenv("PAYPAL_MODE", "sandbox")  # sandbox or live
    PAYPAL_WEBHOOK_ID: str = os.getenv("PAYPAL_WEBHOOK_ID", "")  # From PayPal Developer Dashboard
    PAYPAL_ACCESS_TOKEN: str = os.getenv("PAYPAL_ACCESS_TOKEN", "")  # Generate via OAuth2
    
    # Thirdweb Configuration
    THIRDWEB_CLIENT_ID: str = os.getenv("THIRDWEB_CLIENT_ID", "")
    THIRDWEB_SECRET_KEY: str = os.getenv("THIRDWEB_SECRET_KEY", "")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_SECRET: str = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production"))
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 1
    
    # Redis Configuration for rate limiting
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Server Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Frontend Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @classmethod
    def validate_required_vars(cls) -> list[str]:
        """Validate that required environment variables are set"""
        missing_vars = []
        
        required_vars = [
            ("GOOGLE_CLIENT_ID", cls.GOOGLE_CLIENT_ID),
            ("GOOGLE_CLIENT_SECRET", cls.GOOGLE_CLIENT_SECRET),
            ("THIRDWEB_CLIENT_ID", cls.THIRDWEB_CLIENT_ID),
            ("SECRET_KEY", cls.SECRET_KEY),
        ]
        
        for var_name, var_value in required_vars:
            if not var_value or var_value == "":
                missing_vars.append(var_name)
        
        return missing_vars
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development mode"""
        return cls.ENVIRONMENT.lower() == "development"
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get formatted database URL"""
        return cls.DATABASE_URL

# Create a singleton instance
config = Config()

# Validate environment variables on import
missing_vars = config.validate_required_vars()
if missing_vars and not config.is_development():
    print(f"Warning: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please set these variables in your .env file")
