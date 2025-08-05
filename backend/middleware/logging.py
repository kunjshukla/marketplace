import logging
import time
import json
from datetime import datetime
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from logging.handlers import RotatingFileHandler
import os
import traceback
from utils.auth import verify_jwt_token

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure rotating file handler
file_handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
)

# Configure logger
logger = logging.getLogger('app_middleware')
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and errors"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Extract user ID from JWT if present
        user_id = None
        try:
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_jwt_token(token)
                user_id = payload.get("user_id")
        except Exception:
            pass  # Token invalid or not present
        
        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} | "
            f"User: {user_id or 'Anonymous'} | "
            f"IP: {request.client.host if request.client else 'Unknown'}"
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Log response
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                log_level,
                f"Response: {request.method} {request.url.path} | "
                f"Status: {response.status_code} | "
                f"Time: {process_time:.3f}s | "
                f"User: {user_id or 'Anonymous'}"
            )
            
            # Log error details for 4xx and 5xx responses
            if response.status_code >= 400:
                logger.error(
                    f"Error Response: {request.method} {request.url.path} | "
                    f"Status: {response.status_code} | "
                    f"User: {user_id or 'Anonymous'} | "
                    f"IP: {request.client.host if request.client else 'Unknown'}"
                )
            
            return response
            
        except Exception as e:
            # Calculate response time for errors
            process_time = time.time() - start_time
            
            # Log exception with full stack trace
            logger.error(
                f"Exception: {request.method} {request.url.path} | "
                f"User: {user_id or 'Anonymous'} | "
                f"Time: {process_time:.3f}s | "
                f"Error: {str(e)} | "
                f"Traceback: {traceback.format_exc()}"
            )
            
            # Return JSON error response
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error_id": f"{int(time.time())}-{hash(str(e)) % 10000}"
                }
            )

class SecurityLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log security-related events"""
    
    async def dispatch(self, request: Request, call_next):
        # Check for potential security threats
        suspicious_patterns = [
            "script",
            "javascript:",
            "onload=",
            "onerror=",
            "union select",
            "drop table",
            "../",
            "etc/passwd",
            "admin'--",
            "1=1",
            "<script",
            "eval(",
            "document.cookie"
        ]
        
        # Check URL and query parameters
        url_str = str(request.url).lower()
        for pattern in suspicious_patterns:
            if pattern in url_str:
                logger.warning(
                    f"Suspicious request detected: {request.method} {request.url} | "
                    f"Pattern: {pattern} | "
                    f"IP: {request.client.host if request.client else 'Unknown'}"
                )
                break
        
        # Check for high-frequency requests (basic rate limiting check)
        client_ip = request.client.host if request.client else 'Unknown'
        current_time = time.time()
        
        # This is a simple example - in production, use Redis or similar
        if not hasattr(self, 'request_counts'):
            self.request_counts = {}
        
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = []
        
        # Clean old requests (older than 1 minute)
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if current_time - req_time < 60
        ]
        
        # Add current request
        self.request_counts[client_ip].append(current_time)
        
        # Check if too many requests
        if len(self.request_counts[client_ip]) > 100:  # 100 requests per minute
            # Log rate limit violation to security log
            security_logger.warning(
                f"Rate limit exceeded: IP {client_ip} | "
                f"Requests in last minute: {len(self.request_counts[client_ip])} | "
                f"Endpoint: {request.url.path} | "
                f"User-Agent: {request.headers.get('user-agent', 'Unknown')}"
            )
            
            # Also log to main security log file
            with open('logs/security.log', 'a') as f:
                f.write(
                    f"{datetime.utcnow().isoformat()} - RATE_LIMIT_VIOLATION - "
                    f"IP: {client_ip}, Path: {request.url.path}, "
                    f"Requests: {len(self.request_counts[client_ip])}\n"
                )
        
        return await call_next(request)

def setup_logging():
    """Setup additional logging configuration"""
    
    # Create security logger
    security_handler = RotatingFileHandler(
        'logs/security.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    security_handler.setFormatter(
        logging.Formatter('%(asctime)s - SECURITY - %(levelname)s - %(message)s')
    )
    
    security_logger = logging.getLogger('security')
    security_logger.setLevel(logging.WARNING)
    security_logger.addHandler(security_handler)
    
    # Create performance logger
    perf_handler = RotatingFileHandler(
        'logs/performance.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    perf_handler.setFormatter(
        logging.Formatter('%(asctime)s - PERFORMANCE - %(message)s')
    )
    
    perf_logger = logging.getLogger('performance')
    perf_logger.setLevel(logging.INFO)
    perf_logger.addHandler(perf_handler)
    
    return security_logger, perf_logger

# Initialize loggers
security_logger, perf_logger = setup_logging()
