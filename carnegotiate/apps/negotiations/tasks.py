"""
Celery tasks for negotiations app.
"""
from celery import shared_task
from django.utils import timezone


@shared_task
def expire_negotiations():
    """
    Periodic task to expire negotiations past their expiration date.
    Should be run every 5 minutes via Celery Beat.
    
    Returns:
        Count of expired negotiations
    """
    from .services import NegotiationService
    
    count = NegotiationService.expire_negotiations()
    
    if count > 0:
        # Log the expiration
        print(f"Expired {count} negotiations at {timezone.now()}")
    
    return count


@shared_task
def send_expiration_warning(negotiation_id: str):
    """
    Send warning notification when negotiation is about to expire.
    Triggered 24 hours before expiration.
    """
    from .models import Negotiation
    from apps.notifications.services import NotificationService
    
    try:
        negotiation = Negotiation.objects.get(pk=negotiation_id)
        
        # Only send if still active
        if negotiation.status == Negotiation.Status.ACTIVE:
            # Notify both parties
            NotificationService.notify_negotiation_expiring(negotiation)
            
    except Negotiation.DoesNotExist:
        pass


@shared_task
def check_expiring_negotiations():
    """
    Check for negotiations expiring in the next 24 hours
    and send warning notifications.
    Run hourly via Celery Beat.
    """
    from datetime import timedelta
    from .models import Negotiation
    from apps.notifications.models import Notification
    
    # Find negotiations expiring in 24-25 hours (to avoid duplicates)
    now = timezone.now()
    expiring_window_start = now + timedelta(hours=23)
    expiring_window_end = now + timedelta(hours=25)
    
    expiring = Negotiation.objects.filter(
        status=Negotiation.Status.ACTIVE,
        expires_at__gte=expiring_window_start,
        expires_at__lt=expiring_window_end
    )
    
    for negotiation in expiring:
        # Check if we already sent a warning
        warning_exists = Notification.objects.filter(
            user=negotiation.buyer,
            notification_type='negotiation_expiring',
            data__negotiation_id=str(negotiation.id),
            created_at__gte=now - timedelta(hours=24)
        ).exists()
        
        if not warning_exists:
            send_expiration_warning.delay(str(negotiation.id))
