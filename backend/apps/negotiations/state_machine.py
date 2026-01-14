"""
Negotiation State Machine for CarNegotiate.
Enforces valid state transitions and business rules.
"""
from enum import Enum
from typing import List
from django.utils import timezone
from core.exceptions import InvalidStateError, BusinessRuleViolation


class NegotiationState(Enum):
    """Valid negotiation states."""
    ACTIVE = "active"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class OfferParty(Enum):
    """Who made the offer."""
    BUYER = "buyer"
    DEALER = "dealer"


# Valid state transitions
VALID_TRANSITIONS = {
    NegotiationState.ACTIVE: [
        NegotiationState.ACCEPTED,
        NegotiationState.REJECTED,
        NegotiationState.EXPIRED,
        NegotiationState.CANCELLED,
    ],
    NegotiationState.ACCEPTED: [NegotiationState.COMPLETED],
    NegotiationState.REJECTED: [],  # Terminal state
    NegotiationState.EXPIRED: [],   # Terminal state
    NegotiationState.CANCELLED: [], # Terminal state
    NegotiationState.COMPLETED: [], # Terminal state
}

# Actions available for each party
BUYER_ACTIONS = ['counter_offer', 'accept', 'cancel']
DEALER_ACTIONS = ['counter_offer', 'accept', 'reject']


class NegotiationStateMachine:
    """
    State machine for negotiation lifecycle.
    Enforces business rules and valid transitions.
    """
    
    @classmethod
    def can_transition(cls, from_state: str, to_state: str) -> bool:
        """Check if state transition is valid."""
        try:
            from_enum = NegotiationState(from_state)
            to_enum = NegotiationState(to_state)
            return to_enum in VALID_TRANSITIONS.get(from_enum, [])
        except ValueError:
            return False
    
    @classmethod
    def transition(
        cls,
        negotiation,
        to_state: str,
        actor,
        reason: str = ""
    ):
        """
        Execute state transition with validation.
        
        Args:
            negotiation: Negotiation instance
            to_state: Target state string
            actor: User performing the action
            reason: Optional reason for the transition
            
        Returns:
            Updated negotiation
            
        Raises:
            InvalidStateError: If transition is not valid
            BusinessRuleViolation: If business rules are violated
        """
        from_state = negotiation.status
        
        if not cls.can_transition(from_state, to_state):
            raise InvalidStateError(
                f"Cannot transition from {from_state} to {to_state}"
            )
        
        # Validate actor permissions
        if not cls.validate_actor(negotiation, actor, to_state):
            raise BusinessRuleViolation(
                "You are not authorized to perform this action"
            )
        
        # Execute transition
        negotiation.status = to_state
        
        # Handle state-specific logic
        if to_state == NegotiationState.ACCEPTED.value:
            negotiation.accepted_at = timezone.now()
        elif to_state == NegotiationState.COMPLETED.value:
            negotiation.completed_at = timezone.now()
        
        negotiation.save()
        return negotiation
    
    @classmethod
    def get_available_actions(cls, negotiation, user) -> List[str]:
        """
        Get list of actions available to user for this negotiation.
        
        Args:
            negotiation: Negotiation instance
            user: User requesting actions
            
        Returns:
            List of action strings the user can take
        """
        if negotiation.status != NegotiationState.ACTIVE.value:
            return []
        
        # Check if negotiation is expired
        if negotiation.expires_at and negotiation.expires_at < timezone.now():
            return []
        
        actions = []
        is_buyer = user == negotiation.buyer
        is_dealer = hasattr(negotiation.vehicle, 'dealer') and \
                   user == negotiation.vehicle.dealer.user
        
        if not is_buyer and not is_dealer:
            return []
        
        # Get pending offer
        pending_offer = negotiation.offers.filter(
            status='pending'
        ).order_by('-created_at').first()
        
        if pending_offer:
            # Determine whose turn it is
            if pending_offer.offered_by == 'buyer':
                # Dealer's turn to respond
                if is_dealer:
                    actions = ['accept', 'counter_offer', 'reject']
            else:
                # Buyer's turn to respond
                if is_buyer:
                    actions = ['accept', 'counter_offer', 'cancel']
        else:
            # No pending offer - buyer can make initial offer
            if is_buyer:
                actions = ['make_offer']
        
        return actions
    
    @classmethod
    def validate_actor(cls, negotiation, user, action: str) -> bool:
        """
        Validate if user can perform action on negotiation.
        
        Args:
            negotiation: Negotiation instance
            user: User attempting action
            action: Action string
            
        Returns:
            True if user can perform action
        """
        is_buyer = user == negotiation.buyer
        is_dealer = hasattr(negotiation.vehicle, 'dealer') and \
                   user == negotiation.vehicle.dealer.user
        
        if not is_buyer and not is_dealer:
            return False
        
        # State transition validations
        if action in [NegotiationState.CANCELLED.value]:
            # Only buyer can cancel
            return is_buyer
        
        if action in [NegotiationState.REJECTED.value]:
            # Only dealer can reject
            return is_dealer
        
        if action in [NegotiationState.ACCEPTED.value]:
            # Either party can accept, but not their own offer
            pending_offer = negotiation.offers.filter(
                status='pending'
            ).order_by('-created_at').first()
            
            if not pending_offer:
                return False
            
            # Can't accept your own offer
            if pending_offer.offered_by == 'buyer' and is_buyer:
                return False
            if pending_offer.offered_by == 'dealer' and is_dealer:
                return False
            
            return True
        
        return True
    
    @classmethod
    def validate_offer_amount(
        cls,
        vehicle,
        amount,
        min_percentage: float = 0.5
    ) -> bool:
        """
        Validate offer amount meets business rules.
        
        Args:
            vehicle: Vehicle being negotiated
            amount: Offer amount
            min_percentage: Minimum percentage of asking price (default 50%)
            
        Returns:
            True if amount is valid
        """
        from decimal import Decimal
        min_amount = vehicle.asking_price * Decimal(str(min_percentage))
        return amount >= min_amount
    
    @classmethod
    def get_min_offer_amount(cls, vehicle, min_percentage: float = 0.5):
        """Get minimum allowed offer amount for a vehicle."""
        from decimal import Decimal
        return vehicle.asking_price * Decimal(str(min_percentage))
    
    @classmethod
    def is_turn_based_valid(cls, negotiation, user) -> bool:
        """
        Check if it's the user's turn to make an offer.
        Enforces alternating offer pattern: buyer → dealer → buyer...
        """
        pending_offer = negotiation.offers.filter(
            status='pending'
        ).order_by('-created_at').first()
        
        if not pending_offer:
            # No pending offer - buyer starts
            return user == negotiation.buyer
        
        is_buyer = user == negotiation.buyer
        is_dealer = hasattr(negotiation.vehicle, 'dealer') and \
                   user == negotiation.vehicle.dealer.user
        
        # If last offer was from buyer, dealer responds
        if pending_offer.offered_by == 'buyer':
            return is_dealer
        # If last offer was from dealer, buyer responds
        else:
            return is_buyer
