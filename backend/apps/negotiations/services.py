"""
Negotiation Service Layer for CarNegotiate.
Encapsulates all negotiation business logic in a testable service class.
"""
from decimal import Decimal
from datetime import timedelta
from typing import Optional

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.vehicles.models import Vehicle
from .models import Negotiation, Offer
from .state_machine import NegotiationStateMachine
from .exceptions import (
    VehicleNotAvailable,
    ActiveNegotiationExists,
    InvalidOfferAmount,
    NotYourTurn,
    CannotAcceptOwnOffer,
    NegotiationNotActive,
    NegotiationExpired,
)
from core.exceptions import ConcurrencyError

User = get_user_model()

# Default expiration period (72 hours)
DEFAULT_EXPIRATION_HOURS = 72


class NegotiationService:
    """
    Service class for negotiation business logic.
    All negotiation operations should go through this service.
    """
    
    @classmethod
    @transaction.atomic
    def start_negotiation(
        cls,
        buyer: User,
        vehicle: 'Vehicle',
        amount: Decimal,
        message: str = ""
    ) -> Negotiation:
        """
        Start a new negotiation (buyer initiates).
        
        Args:
            buyer: User starting the negotiation
            vehicle: Vehicle to negotiate on
            amount: Initial offer amount
            message: Optional message to dealer
            
        Returns:
            Created Negotiation instance
            
        Raises:
            VehicleNotAvailable: If vehicle is not active
            ActiveNegotiationExists: If buyer has active negotiation on vehicle
            InvalidOfferAmount: If offer is below minimum
        """
        # 1. Validate vehicle is available
        # 1. Validate vehicle is available
        from apps.vehicles.models import Vehicle
        if vehicle.status != 'active':
            raise VehicleNotAvailable(
                f"Vehicle {vehicle.id} is not available (status: {vehicle.status})"
            )
        
        # 2. Check for existing active negotiation
        existing = Negotiation.objects.filter(
            buyer=buyer,
            vehicle=vehicle,
            status=Negotiation.Status.ACTIVE
        ).exists()
        
        if existing:
            raise ActiveNegotiationExists()
        
        # 3. Validate offer amount (minimum 50% of asking price)
        min_offer = NegotiationStateMachine.get_min_offer_amount(vehicle)
        if amount < min_offer:
            raise InvalidOfferAmount(min_allowed=float(min_offer))
        
        # 4. Create negotiation
        negotiation = Negotiation.objects.create(
            buyer=buyer,
            vehicle=vehicle,
            status=Negotiation.Status.ACTIVE,
            expires_at=timezone.now() + timedelta(hours=DEFAULT_EXPIRATION_HOURS)
        )
        
        # 5. Create initial offer
        Offer.objects.create(
            negotiation=negotiation,
            amount=amount,
            offered_by=Offer.OfferedBy.BUYER,
            message=message,
            status=Offer.Status.PENDING
        )
        
        # 6. Send notification to dealer (async)
        cls._notify_new_offer(negotiation)
        
        return negotiation
    
    @classmethod
    @transaction.atomic
    def submit_offer(
        cls,
        negotiation: Negotiation,
        user: User,
        amount: Decimal,
        message: str = ""
    ) -> Offer:
        """
        Submit a counter-offer in an existing negotiation.
        
        Args:
            negotiation: Negotiation to submit offer to
            user: User making the offer
            amount: Offer amount
            message: Optional message
            
        Returns:
            Created Offer instance
            
        Raises:
            NegotiationNotActive: If negotiation is not active
            NegotiationExpired: If negotiation has expired
            NotYourTurn: If it's not the user's turn
            InvalidOfferAmount: If offer is below minimum
        """
        # Lock the negotiation row
        negotiation = Negotiation.objects.select_for_update().get(
            pk=negotiation.pk
        )
        
        # 1. Validate negotiation is active
        if negotiation.status != Negotiation.Status.ACTIVE:
            raise NegotiationNotActive()
        
        # 2. Check expiration
        if negotiation.expires_at < timezone.now():
            # Auto-expire the negotiation
            negotiation.status = Negotiation.Status.EXPIRED
            negotiation.save()
            raise NegotiationExpired()
        
        # 3. Validate it's user's turn
        if not NegotiationStateMachine.is_turn_based_valid(negotiation, user):
            # Determine who we're waiting for
            pending_offer = negotiation.offers.filter(
                status=Offer.Status.PENDING
            ).first()
            if pending_offer:
                waiting_for = "dealer" if pending_offer.offered_by == 'buyer' else "buyer"
                raise NotYourTurn(f"Waiting for {waiting_for} response")
            raise NotYourTurn()
        
        # 4. Validate offer amount
        min_offer = NegotiationStateMachine.get_min_offer_amount(negotiation.vehicle)
        if amount < min_offer:
            raise InvalidOfferAmount(min_allowed=float(min_offer))
        
        # 5. Mark previous pending offer as countered
        previous_offer = negotiation.offers.filter(
            status=Offer.Status.PENDING
        ).first()
        if previous_offer:
            previous_offer.status = Offer.Status.COUNTERED
            previous_offer.responded_at = timezone.now()
            previous_offer.save()
        
        # 6. Determine offered_by
        is_dealer = (
            hasattr(negotiation.vehicle, 'dealer') and
            user == negotiation.vehicle.dealer.user
        )
        offered_by = Offer.OfferedBy.DEALER if is_dealer else Offer.OfferedBy.BUYER
        
        # 7. Create new offer
        offer = Offer.objects.create(
            negotiation=negotiation,
            amount=amount,
            offered_by=offered_by,
            message=message,
            status=Offer.Status.PENDING
        )
        
        # 8. Reset expiration timer
        negotiation.expires_at = timezone.now() + timedelta(hours=DEFAULT_EXPIRATION_HOURS)
        negotiation.save()
        
        # 9. Notify other party
        cls._notify_counter_offer(negotiation, offer)
        
        return offer
    
    @classmethod
    @transaction.atomic
    def accept_offer(cls, negotiation: Negotiation, user: User) -> Negotiation:
        """
        Accept the current pending offer.
        
        Args:
            negotiation: Negotiation to accept
            user: User accepting the offer
            
        Returns:
            Updated Negotiation
            
        Raises:
            NegotiationNotActive: If negotiation is not active
            CannotAcceptOwnOffer: If user made the pending offer
            ConcurrencyError: If negotiation was modified concurrently
        """
        # Get current version for optimistic locking
        current_version = negotiation.version
        
        # 1. Validate negotiation is active
        if negotiation.status != Negotiation.Status.ACTIVE:
            raise NegotiationNotActive()
        
        # 2. Get pending offer
        pending_offer = negotiation.offers.filter(
            status=Offer.Status.PENDING
        ).order_by('-created_at').first()
        
        if not pending_offer:
            raise NegotiationNotActive("No pending offer to accept")
        
        # 3. Validate user is not accepting their own offer
        is_buyer = user == negotiation.buyer
        is_dealer = (
            hasattr(negotiation.vehicle, 'dealer') and
            user == negotiation.vehicle.dealer.user
        )
        
        if pending_offer.offered_by == 'buyer' and is_buyer:
            raise CannotAcceptOwnOffer()
        if pending_offer.offered_by == 'dealer' and is_dealer:
            raise CannotAcceptOwnOffer()
        
        # 4. Update negotiation with optimistic locking
        updated = Negotiation.objects.filter(
            pk=negotiation.pk,
            version=current_version,
            status=Negotiation.Status.ACTIVE
        ).update(
            status=Negotiation.Status.ACCEPTED,
            accepted_price=pending_offer.amount,
            version=F('version') + 1
        )
        
        if not updated:
            raise ConcurrencyError(
                "Negotiation was modified by another process. Please refresh."
            )
        
        # 5. Update the offer status
        pending_offer.status = Offer.Status.ACCEPTED
        pending_offer.responded_at = timezone.now()
        pending_offer.save()
        
        # 6. Update vehicle status
        print(f"Updating vehicle {negotiation.vehicle_id} status to pending_sale")
        from apps.vehicles.models import Vehicle
        v = Vehicle.objects.get(pk=negotiation.vehicle_id)
        v.status = Vehicle.Status.PENDING_SALE
        v.save()
        print(f"Vehicle {v.id} status saved as {v.status}")
        
        # 7. Cancel other active negotiations on this vehicle
        other_negotiations = Negotiation.objects.filter(
            vehicle_id=negotiation.vehicle_id,
            status=Negotiation.Status.ACTIVE
        ).exclude(pk=negotiation.pk)
        
        other_negotiations.update(status=Negotiation.Status.CANCELLED)
        
        # 8. Expire pending offers on cancelled negotiations
        Offer.objects.filter(
            negotiation__in=other_negotiations,
            status=Offer.Status.PENDING
        ).update(status=Offer.Status.EXPIRED)
        
        # 9. Notify both parties
        negotiation.refresh_from_db()
        cls._notify_offer_accepted(negotiation)
        
        return negotiation
    
    @classmethod
    @transaction.atomic
    def reject_negotiation(
        cls,
        negotiation: Negotiation,
        user: User,
        reason: str = ""
    ) -> Negotiation:
        """
        Reject a negotiation (dealer action).
        
        Args:
            negotiation: Negotiation to reject
            user: User rejecting (must be dealer)
            reason: Optional rejection reason
            
        Returns:
            Updated Negotiation
        """
        # Validate negotiation is active
        if negotiation.status != Negotiation.Status.ACTIVE:
            raise NegotiationNotActive()
        
        # Validate user is dealer
        is_dealer = (
            hasattr(negotiation.vehicle, 'dealer') and
            user == negotiation.vehicle.dealer.user
        )
        if not is_dealer:
            raise CannotAcceptOwnOffer("Only dealers can reject negotiations")
        
        # Update negotiation
        negotiation.status = Negotiation.Status.REJECTED
        negotiation.save()
        
        # Mark pending offer as rejected
        pending_offer = negotiation.offers.filter(
            status=Offer.Status.PENDING
        ).first()
        if pending_offer:
            pending_offer.status = Offer.Status.REJECTED
            pending_offer.responded_at = timezone.now()
            pending_offer.save()
        
        # Notify buyer
        cls._notify_offer_rejected(negotiation, reason)
        
        return negotiation
    
    @classmethod
    @transaction.atomic
    def cancel_negotiation(
        cls,
        negotiation: Negotiation,
        buyer: User
    ) -> Negotiation:
        """
        Cancel a negotiation (buyer action).
        
        Args:
            negotiation: Negotiation to cancel
            buyer: User cancelling (must be the buyer)
            
        Returns:
            Updated Negotiation
        """
        # Validate negotiation is active
        if negotiation.status != Negotiation.Status.ACTIVE:
            raise NegotiationNotActive()
        
        # Validate user is buyer
        if buyer != negotiation.buyer:
            raise CannotAcceptOwnOffer("Only the buyer can cancel their negotiation")
        
        # Update negotiation
        negotiation.status = Negotiation.Status.CANCELLED
        negotiation.save()
        
        # Expire pending offer
        negotiation.offers.filter(
            status=Offer.Status.PENDING
        ).update(
            status=Offer.Status.EXPIRED,
            responded_at=timezone.now()
        )
        
        # Notify dealer
        cls._notify_negotiation_cancelled(negotiation)
        
        return negotiation
    
    @classmethod
    def expire_negotiations(cls) -> int:
        """
        Expire all negotiations past their expiration date.
        Called periodically by Celery beat.
        
        Returns:
            Count of expired negotiations
        """
        # Find and expire active negotiations past expiration
        expired_count = Negotiation.objects.filter(
            status=Negotiation.Status.ACTIVE,
            expires_at__lt=timezone.now()
        ).update(status=Negotiation.Status.EXPIRED)
        
        # Expire pending offers on those negotiations
        Offer.objects.filter(
            negotiation__status=Negotiation.Status.EXPIRED,
            status=Offer.Status.PENDING
        ).update(
            status=Offer.Status.EXPIRED,
            responded_at=timezone.now()
        )
        
        return expired_count
    
    @classmethod
    def get_user_negotiations(
        cls,
        user: User,
        status_filter: Optional[str] = None
    ):
        """
        Get all negotiations for a user (as buyer or dealer).
        
        Args:
            user: User to get negotiations for
            status_filter: Optional status to filter by
            
        Returns:
            QuerySet of Negotiation
        """
        from django.db.models import Q
        
        # Get negotiations where user is buyer or dealer
        queryset = Negotiation.objects.filter(
            Q(buyer=user) | Q(vehicle__dealer__user=user)
        ).select_related(
            'vehicle', 'vehicle__dealer', 'buyer'
        ).prefetch_related('offers').defer(
            'vehicle__specifications', 'vehicle__features'
        ).order_by('-created_at')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    # -------------------------------------------------------------------------
    # Notification Helpers (delegate to NotificationService)
    # -------------------------------------------------------------------------
    
    @classmethod
    def _notify_new_offer(cls, negotiation: Negotiation):
        """Notify dealer of new negotiation."""
        try:
            from apps.notifications.services import NotificationService
            # Get the initial offer
            initial_offer = negotiation.offers.first()
            if initial_offer:
                NotificationService.notify_new_offer(negotiation, initial_offer)
        except Exception as e:
            # Log error but don't fail the negotiation
            import logging
            logging.getLogger(__name__).error(f"Failed to send new offer notification: {e}")
    
    @classmethod
    def _notify_counter_offer(cls, negotiation: Negotiation, offer: Offer):
        """Notify other party of counter-offer."""
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_counter_offer(negotiation, offer)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send counter-offer notification: {e}")
    
    @classmethod
    def _notify_offer_accepted(cls, negotiation: Negotiation):
        """Notify both parties of acceptance."""
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_offer_accepted(negotiation)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send offer accepted notification: {e}")
    
    @classmethod
    def _notify_offer_rejected(cls, negotiation: Negotiation, reason: str):
        """Notify buyer of rejection."""
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_offer_rejected(negotiation, reason)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send offer rejected notification: {e}")
    
    @classmethod
    def _notify_negotiation_cancelled(cls, negotiation: Negotiation):
        """Notify dealer of cancellation."""
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_negotiation_cancelled(negotiation)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send cancellation notification: {e}")

