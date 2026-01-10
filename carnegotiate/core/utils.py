"""
Utility functions for CarNegotiate project.
"""
from decimal import Decimal
from typing import Any, Dict

from django.conf import settings
from django.utils import timezone


def calculate_expiration_time(hours: int = None) -> timezone.datetime:
    """Calculate expiration datetime from now."""
    if hours is None:
        hours = getattr(settings, 'NEGOTIATION_EXPIRY_HOURS', 72)
    return timezone.now() + timezone.timedelta(hours=hours)


def is_valid_offer_amount(asking_price: Decimal, offer_amount: Decimal) -> bool:
    """
    Check if an offer amount is valid (at least MIN_OFFER_PERCENTAGE of asking price).
    """
    min_percentage = getattr(settings, 'MIN_OFFER_PERCENTAGE', 50)
    min_amount = asking_price * Decimal(min_percentage) / Decimal(100)
    return offer_amount >= min_amount


def format_price(amount: Decimal) -> str:
    """Format a price for display."""
    return f"${amount:,.2f}"


def get_client_ip(request) -> str:
    """Extract client IP from request, handling proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def sanitize_dict(data: Dict[str, Any], sensitive_keys: list = None) -> Dict[str, Any]:
    """
    Remove or mask sensitive data from a dictionary for logging.
    """
    if sensitive_keys is None:
        sensitive_keys = ['password', 'token', 'secret', 'key', 'authorization']
    
    result = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            result[key] = '***REDACTED***'
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value, sensitive_keys)
        else:
            result[key] = value
    return result
