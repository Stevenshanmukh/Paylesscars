"""
Celery tasks for notifications app.
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta


@shared_task
def send_notification_email(notification_id: str):
    """
    Send email for a notification.
    Called asynchronously after notification creation.
    """
    from .models import Notification
    
    try:
        notification = Notification.objects.select_related('user').get(pk=notification_id)
    except Notification.DoesNotExist:
        return
    
    # Skip if user has unsubscribed (future feature)
    # if not notification.user.email_notifications_enabled:
    #     return
    
    # Email template mapping
    email_config = get_email_config(notification.notification_type)
    if not email_config:
        return
    
    try:
        context = {
            'user': notification.user,
            'notification': notification,
            'site_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000',
            **notification.data
        }
        
        # Render email
        subject = email_config['subject'].format(**notification.data) if notification.data else email_config['subject']
        
        html_content = render_to_string(email_config['template'], context)
        plain_content = notification.message  # Fallback
        
        send_mail(
            subject=subject,
            message=plain_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            html_message=html_content,
            fail_silently=True
        )
    except Exception as e:
        # Log error but don't fail
        print(f"Failed to send email for notification {notification_id}: {e}")


def get_email_config(notification_type: str) -> dict:
    """Get email configuration for notification type."""
    configs = {
        'offer_received': {
            'subject': 'New offer on your {vehicle_title}',
            'template': 'emails/offer_received.html'
        },
        'counter_offer': {
            'subject': 'Counter offer on {vehicle_title}',
            'template': 'emails/counter_offer.html'
        },
        'offer_accepted': {
            'subject': '🎉 Offer accepted - {vehicle_title}',
            'template': 'emails/offer_accepted.html'
        },
        'offer_rejected': {
            'subject': 'Offer update - {vehicle_title}',
            'template': 'emails/offer_rejected.html'
        },
        'negotiation_expiring': {
            'subject': 'Action needed: Negotiation expiring soon',
            'template': 'emails/negotiation_expiring.html'
        },
        'negotiation_expired': {
            'subject': 'Negotiation expired',
            'template': 'emails/negotiation_expired.html'
        },
        'dealer_verified': {
            'subject': '🎉 Your dealership has been verified!',
            'template': 'emails/dealer_verified.html'
        },
        'dealer_rejected': {
            'subject': 'Verification update',
            'template': 'emails/dealer_rejected.html'
        }
    }
    return configs.get(notification_type)


@shared_task
def check_expiring_negotiations():
    """
    Check for negotiations expiring in the next 24 hours
    and send warning notifications.
    Run hourly via Celery Beat.
    """
    from apps.negotiations.models import Negotiation
    from .models import Notification
    from .services import NotificationService
    
    now = timezone.now()
    expiring_window_start = now + timedelta(hours=23)
    expiring_window_end = now + timedelta(hours=25)
    
    expiring = Negotiation.objects.filter(
        status='active',
        expires_at__gte=expiring_window_start,
        expires_at__lt=expiring_window_end
    ).select_related('buyer', 'vehicle__dealer__user')
    
    notified_count = 0
    for negotiation in expiring:
        # Check if we already sent a warning
        warning_exists = Notification.objects.filter(
            user=negotiation.buyer,
            notification_type='negotiation_expiring',
            data__negotiation_id=str(negotiation.id),
            created_at__gte=now - timedelta(hours=24)
        ).exists()
        
        if not warning_exists:
            NotificationService.notify_negotiation_expiring(negotiation)
            notified_count += 1
    
    return notified_count


@shared_task
def cleanup_old_notifications():
    """
    Periodic task to delete old read notifications.
    Run daily via Celery Beat.
    """
    from .models import Notification
    
    # Delete read notifications older than 90 days
    cutoff = timezone.now() - timedelta(days=90)
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        created_at__lt=cutoff
    ).delete()
    
    return deleted_count


@shared_task
def send_daily_digest():
    """
    Send daily digest email to users with pending notifications.
    Run daily at 9 AM via Celery Beat.
    """
    from django.contrib.auth import get_user_model
    from .models import Notification
    
    User = get_user_model()
    
    # Get users with unread notifications from the last 24 hours
    yesterday = timezone.now() - timedelta(days=1)
    
    users_with_notifications = User.objects.filter(
        notifications__is_read=False,
        notifications__created_at__gte=yesterday
    ).distinct()
    
    sent_count = 0
    for user in users_with_notifications:
        unread = Notification.objects.filter(
            user=user,
            is_read=False,
            created_at__gte=yesterday
        ).count()
        
        if unread > 0:
            # Send digest email
            try:
                context = {
                    'user': user,
                    'unread_count': unread,
                    'site_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
                }
                
                html_content = render_to_string('emails/daily_digest.html', context)
                
                send_mail(
                    subject=f"You have {unread} unread notification{'s' if unread > 1 else ''} on CarNegotiate",
                    message=f"You have {unread} unread notifications. Visit CarNegotiate to view them.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_content,
                    fail_silently=True
                )
                sent_count += 1
            except Exception:
                pass
    
    return sent_count
