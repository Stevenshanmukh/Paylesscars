"""
Custom exceptions and exception handler for CarNegotiate API.
"""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class ConcurrencyError(APIException):
    """Raised when optimistic locking detects concurrent modification."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This resource was modified by another process. Please refresh and try again.'
    default_code = 'concurrent_modification'


class InvalidStateError(APIException):
    """Raised when an operation is invalid for the current state."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'This operation is not valid for the current state.'
    default_code = 'invalid_state'


class BusinessRuleViolation(APIException):
    """Raised when a business rule is violated."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'This operation violates business rules.'
    default_code = 'business_rule_violation'


class DealerNotVerifiedError(APIException):
    """Raised when a dealer attempts an action requiring verification."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Your dealer account must be verified to perform this action.'
    default_code = 'dealer_not_verified'


class NegotiationExpiredError(APIException):
    """Raised when trying to act on an expired negotiation."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'This negotiation has expired.'
    default_code = 'negotiation_expired'


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats errors consistently.
    
    Response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-readable message",
            "details": [...] (optional, for validation errors)
        },
        "request_id": "req_xxx" (if available)
    }
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # Get the error code
        error_code = getattr(exc, 'default_code', 'error')
        if hasattr(exc, 'get_codes'):
            codes = exc.get_codes()
            if isinstance(codes, str):
                error_code = codes
            elif isinstance(codes, dict):
                error_code = 'validation_error'
        
        # Format the response
        error_data = {
            'error': {
                'code': error_code.upper(),
                'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            }
        }
        
        # Add details for validation errors
        if hasattr(exc, 'detail') and isinstance(exc.detail, dict):
            error_data['error']['details'] = [
                {'field': field, 'message': str(messages[0]) if isinstance(messages, list) else str(messages)}
                for field, messages in exc.detail.items()
            ]
            error_data['error']['message'] = 'Validation error'
        
        # Add request ID if available
        request = context.get('request')
        if request and hasattr(request, 'META'):
            request_id = request.META.get('HTTP_X_REQUEST_ID')
            if request_id:
                error_data['request_id'] = request_id
        
        response.data = error_data
    
    return response
