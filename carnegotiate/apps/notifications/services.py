"""
Notification Service Layer for CarNegotiate.
Centralized notification management for all platform events.
"""
from typing import Optional
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


class NotificationService:
    """
    Service class for notification business logic.
    Handles creation, delivery, and management of notifications.
    """
    
    @classmethod
    def create_notification(
        cls,
        user: User,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> Notification:
        """
        Create a notification and trigger async delivery.
        
        Args:
            user: User to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            data: Optional metadata dictionary
            
        Returns:
            Created Notification instance
        """
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {}
        )
        
        # Trigger async email delivery
        from .tasks import send_notification_email
        send_notification_email.delay(str(notification.id))
        
        return notification
    
    # -------------------------------------------------------------------------
    # Negotiation Notifications
    # -------------------------------------------------------------------------
    
    @classmethod
    def notify_new_offer(cls, negotiation, offer):
        """Notify dealer of new offer from buyer."""
        dealer_user = negotiation.vehicle.dealer.user
        vehicle = negotiation.vehicle
        
        cls.create_notification(
            user=dealer_user,
            notification_type=Notification.NotificationType.OFFER_RECEIVED,
            title=f"New offer on {vehicle.year} {vehicle.make} {vehicle.model}",
            message=f"A buyer has offered ${offer.amount:,.2f}",
            data={
                'negotiation_id': str(negotiation.id),
                'vehicle_id': str(vehicle.id),
                'offer_amount': str(offer.amount),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}"
            }
        )
    
    @classmethod
    def notify_counter_offer(cls, negotiation, offer):
        """Notify other party of counter-offer."""
        from apps.negotiations.models import Offer
        
        vehicle = negotiation.vehicle
        
        if offer.offered_by == Offer.OfferedBy.DEALER:
            recipient = negotiation.buyer
            sender_name = vehicle.dealer.business_name
        else:
            recipient = vehicle.dealer.user
            sender_name = negotiation.buyer.get_full_name() or "Buyer"
        
        cls.create_notification(
            user=recipient,
            notification_type=Notification.NotificationType.COUNTER_OFFER,
            title=f"Counter offer on {vehicle.year} {vehicle.make} {vehicle.model}",
            message=f"{sender_name} countered with ${offer.amount:,.2f}",
            data={
                'negotiation_id': str(negotiation.id),
                'offer_amount': str(offer.amount),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}"
            }
        )
    
    @classmethod
    def notify_offer_accepted(cls, negotiation):
        """Notify both parties of acceptance."""
        vehicle = negotiation.vehicle
        
        # Notify buyer
        cls.create_notification(
            user=negotiation.buyer,
            notification_type=Notification.NotificationType.OFFER_ACCEPTED,
            title="🎉 Your offer was accepted!",
            message=f"Congratulations! Your offer of ${negotiation.accepted_price:,.2f} for the {vehicle.year} {vehicle.make} {vehicle.model} was accepted.",
            data={
                'negotiation_id': str(negotiation.id),
                'accepted_price': str(negotiation.accepted_price),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}"
            }
        )
        
        # Notify dealer
        cls.create_notification(
            user=vehicle.dealer.user,
            notification_type=Notification.NotificationType.OFFER_ACCEPTED,
            title="Deal accepted!",
            message=f"You accepted an offer of ${negotiation.accepted_price:,.2f} for the {vehicle.year} {vehicle.make} {vehicle.model}.",
            data={
                'negotiation_id': str(negotiation.id),
                'accepted_price': str(negotiation.accepted_price),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}"
            }
        )
    
    @classmethod
    def notify_offer_rejected(cls, negotiation, reason: str = ""):
        """Notify buyer of rejection."""
        vehicle = negotiation.vehicle
        
        message = f"Your offer on the {vehicle.year} {vehicle.make} {vehicle.model} was not accepted."
        if reason:
            message += f" Reason: {reason}"
        
        cls.create_notification(
            user=negotiation.buyer,
            notification_type=Notification.NotificationType.OFFER_REJECTED,
            title="Offer not accepted",
            message=message,
            data={
                'negotiation_id': str(negotiation.id),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}",
                'reason': reason
            }
        )
    
    @classmethod
    def notify_negotiation_cancelled(cls, negotiation):
        """Notify dealer of buyer cancellation."""
        vehicle = negotiation.vehicle
        buyer_name = negotiation.buyer.get_full_name() or "A buyer"
        
        cls.create_notification(
            user=vehicle.dealer.user,
            notification_type=Notification.NotificationType.NEGOTIATION_CANCELLED,
            title="Negotiation cancelled",
            message=f"{buyer_name} cancelled their negotiation on the {vehicle.year} {vehicle.make} {vehicle.model}.",
            data={
                'negotiation_id': str(negotiation.id),
                'vehicle_title': f"{vehicle.year} {vehicle.make} {vehicle.model}"
            }
        )
    
    @classmethod
    def notify_negotiation_expiring(cls, negotiation):
        """Notify both parties of upcoming expiration."""
        vehicle = negotiation.vehicle
        hours_remaining = int((negotiation.expires_at - timezone.now()).total_seconds() / 3600)
        
        # Get pending offer
        pending_offer = negotiation.offers.filter(status='pending').first()
        
        # Determine who needs to respond
        if pending_offer:
            if pending_offer.offered_by == 'buyer':
                # Dealer needs to respond
                cls.create_notification(
                    user=vehicle.dealer.user,
                    notification_type=Notification.NotificationType.NEGOTIATION_EXPIRING,
                    title="Action needed: Negotiation expiring soon",
                    message=f"You have {hours_remaining} hours to respond to an offer on the {vehicle.year} {vehicle.make} {vehicle.model}.",
                    data={
                        'negotiation_id': str(negotiation.id),
                        'hours_remaining': hours_remaining
                    }
                )
            else:
                # Buyer needs to respond
                cls.create_notification(
                    user=negotiation.buyer,
                    notification_type=Notification.NotificationType.NEGOTIATION_EXPIRING,
                    title="Action needed: Negotiation expiring soon",
                    message=f"You have {hours_remaining} hours to respond to an offer on the {vehicle.year} {vehicle.make} {vehicle.model}.",
                    data={
                        'negotiation_id': str(negotiation.id),
                        'hours_remaining': hours_remaining
                    }
                )
    
    @classmethod
    def notify_negotiation_expired(cls, negotiation):
        """Notify both parties of expiration."""
        vehicle = negotiation.vehicle
        
        # Notify buyer
        cls.create_notification(
            user=negotiation.buyer,
            notification_type=Notification.NotificationType.NEGOTIATION_EXPIRED,
            title="Negotiation expired",
            message=f"Your negotiation on the {vehicle.year} {vehicle.make} {vehicle.model} has expired.",
            data={'negotiation_id': str(negotiation.id)}
        )
        
        # Notify dealer
        cls.create_notification(
            user=vehicle.dealer.user,
            notification_type=Notification.NotificationType.NEGOTIATION_EXPIRED,
            title="Negotiation expired",
            message=f"A negotiation on the {vehicle.year} {vehicle.make} {vehicle.model} has expired.",
            data={'negotiation_id': str(negotiation.id)}
        )
    
    # -------------------------------------------------------------------------
    # Dealer Notifications
    # -------------------------------------------------------------------------
    
    @classmethod
    def notify_dealer_verified(cls, dealer):
        """Notify dealer their verification was approved."""
        cls.create_notification(
            user=dealer.user,
            notification_type=Notification.NotificationType.DEALER_VERIFIED,
            title="🎉 Your dealership has been verified!",
            message=f"Congratulations! {dealer.business_name} is now a verified dealer on CarNegotiate. You can now start listing vehicles.",
            data={'dealer_id': str(dealer.id)}
        )
    
    @classmethod
    def notify_dealer_rejected(cls, dealer, reason: str = ""):
        """Notify dealer their verification was rejected."""
        message = f"Unfortunately, we couldn't verify {dealer.business_name} at this time."
        if reason:
            message += f" Reason: {reason}"
        
        cls.create_notification(
            user=dealer.user,
            notification_type=Notification.NotificationType.DEALER_REJECTED,
            title="Verification not approved",
            message=message,
            data={'dealer_id': str(dealer.id), 'reason': reason}
        )
    
    # -------------------------------------------------------------------------
    # Notification Management
    # -------------------------------------------------------------------------
    
    @classmethod
    def mark_as_read(cls, notification: Notification) -> Notification:
        """Mark single notification as read."""
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return notification
    
    @classmethod
    def mark_all_read(cls, user: User) -> int:
        """Mark all user notifications as read."""
        return Notification.objects.filter(
            user=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
    
    @classmethod
    def get_unread_count(cls, user: User) -> int:
        """Get count of unread notifications."""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @classmethod
    def get_recent_notifications(cls, user: User, limit: int = 10):
        """Get recent notifications for a user."""
        return Notification.objects.filter(user=user).order_by('-created_at')[:limit]
