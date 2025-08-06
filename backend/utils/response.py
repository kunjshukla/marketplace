"""
Standardized API response utilities for consistent response format
"""
from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse


def api_response(
    success: bool,
    data: Any = None,
    error: Optional[str] = None,
    pagination: Optional[Dict[str, Any]] = None,
    status_code: int = 200
) -> JSONResponse:
    """
    Create a standardized API response
    
    Args:
        success: Whether the operation was successful
        data: The response data (can be dict, list, or any serializable type)
        error: Error message if success is False
        pagination: Pagination information for list responses
        status_code: HTTP status code
        
    Returns:
        JSONResponse with consistent format: {success, data, error, pagination}
    """
    response_body = {
        "success": success,
        "data": data,
        "error": error
    }
    
    # Only include pagination if provided
    if pagination:
        response_body["pagination"] = pagination
    
    return JSONResponse(
        content=response_body,
        status_code=status_code
    )


def success_response(
    data: Any = None,
    pagination: Optional[Dict[str, Any]] = None,
    status_code: int = 200
) -> JSONResponse:
    """
    Create a successful API response
    
    Args:
        data: The response data
        pagination: Optional pagination information
        status_code: HTTP status code (default 200)
        
    Returns:
        JSONResponse with success=True
    """
    return api_response(
        success=True,
        data=data,
        pagination=pagination,
        status_code=status_code
    )


def error_response(
    error: str,
    status_code: int = 400,
    data: Any = None
) -> JSONResponse:
    """
    Create an error API response
    
    Args:
        error: Error message
        status_code: HTTP status code (default 400)
        data: Optional data to include with error
        
    Returns:
        JSONResponse with success=False
    """
    return api_response(
        success=False,
        data=data,
        error=error,
        status_code=status_code
    )


def not_found_response(message: str = "Resource not found") -> JSONResponse:
    """Create a 404 not found response"""
    return error_response(error=message, status_code=404)


def validation_error_response(message: str = "Invalid input data") -> JSONResponse:
    """Create a 400 validation error response"""
    return error_response(error=message, status_code=400)


def unauthorized_response(message: str = "Unauthorized access") -> JSONResponse:
    """Create a 401 unauthorized response"""
    return error_response(error=message, status_code=401)


def forbidden_response(message: str = "Access forbidden") -> JSONResponse:
    """Create a 403 forbidden response"""
    return error_response(error=message, status_code=403)


def server_error_response(message: str = "Internal server error") -> JSONResponse:
    """Create a 500 server error response"""
    return error_response(error=message, status_code=500)
