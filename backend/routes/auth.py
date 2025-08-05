from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.starlette_client import OAuthError
import jwt
from datetime import datetime, timedelta
import httpx

from db.session import get_db
from models.user import User
from config import config

# Create FastAPI router
router = APIRouter()

# Configure OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def create_jwt_token(user_id: int, email: str) -> str:
    """Create JWT token for authenticated user"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
        "iss": "nft-marketplace"
    }
    
    token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    return token

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """FastAPI dependency to get current authenticated user from JWT token"""
    
    # Get token from Authorization header
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token from "Bearer <token>"
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Verify token
    payload = verify_jwt_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.get("/login-google")
async def login_google(request: Request):
    """Initiate Google OAuth 2.0 login flow"""
    
    try:
        # Generate OAuth authorization URL
        redirect_uri = config.GOOGLE_REDIRECT_URI
        return await oauth.google.authorize_redirect(request, redirect_uri)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth initialization failed: {str(e)}")

@router.get("/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth 2.0 callback and create/update user"""
    
    try:
        # Get authorization token from Google
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            # Fallback: fetch user info manually
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={
                        'Authorization': f"Bearer {token['access_token']}"
                    }
                )
                user_info = response.json()
        
        # Extract user data
        google_id = user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name')
        profile_pic = user_info.get('picture')
        
        if not google_id or not email or not name:
            raise HTTPException(status_code=400, detail="Incomplete user information from Google")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.google_id == google_id).first()
        
        if existing_user:
            # Update existing user's information
            existing_user.name = name
            existing_user.email = email
            existing_user.profile_pic = profile_pic
            db.commit()
            db.refresh(existing_user)
            user = existing_user
        else:
            # Create new user
            user = User(
                name=name,
                email=email,
                google_id=google_id,
                profile_pic=profile_pic
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate JWT token
        jwt_token = create_jwt_token(user.id, user.email)
        
        # Redirect to frontend with token
        frontend_url = f"{config.FRONTEND_URL}/auth/success?token={jwt_token}"
        return RedirectResponse(url=frontend_url)
        
    except OAuthError as e:
        print(f"OAuth Error: {e}")
        error_url = f"{config.FRONTEND_URL}/auth/error?error=oauth_failed"
        return RedirectResponse(url=error_url)
        
    except Exception as e:
        print(f"Authentication Error: {e}")
        error_url = f"{config.FRONTEND_URL}/auth/error?error=unknown"
        return RedirectResponse(url=error_url)

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's information"""
    return {
        "success": True,
        "user": current_user.to_dict()
    }

@router.post("/logout")
async def logout():
    """Logout endpoint (client should delete the JWT token)"""
    return {
        "success": True,
        "message": "Logged out successfully. Please delete your JWT token."
    }

@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    """Verify if the current JWT token is valid"""
    return {
        "success": True,
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }
