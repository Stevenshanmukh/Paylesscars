"""
Custom exceptions for negotiations module.
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class VehicleNotAvailable(APIException):
    """Raised when vehicle is not available for negotiation."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This vehicle is not available for negotiation."
    default_code = "vehicle_not_available"


class ActiveNegotiationExists(APIException):
    """Raised when user already has active negotiation on vehicle."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You already have an active negotiation on this vehicle."
    default_code = "active_negotiation_exists"


class InvalidOfferAmount(APIException):
    """Raised when offer amount is invalid."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The offer amount is invalid."
    default_code = "invalid_offer_amount"
    
    def __init__(self, min_allowed=None, detail=None):
        if min_allowed and not detail:
            detail = f"Offer must be at least ${min_allowed:,.2f} (50% of asking price)."
        super().__init__(detail=detail)


class NotYourTurn(APIException):
    """Raised when user tries to make offer out of turn."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "It is not your turn to make an offer."
    default_code = "not_your_turn"


class CannotAcceptOwnOffer(APIException):
    """Raised when user tries to accept their own offer."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "You cannot accept your own offer."
    default_code = "cannot_accept_own_offer"


class NegotiationNotActive(APIException):
    """Raised when action attempted on non-active negotiation."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This negotiation is no longer active."
    default_code = "negotiation_not_active"


class NegotiationExpired(APIException):
    """Raised when negotiation has expired."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This negotiation has expired."
    default_code = "negotiation_expired"


class NotNegotiationParticipant(APIException):
    """Raised when user is not a participant in negotiation."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You are not a participant in this negotiation."
    default_code = "not_participant"
