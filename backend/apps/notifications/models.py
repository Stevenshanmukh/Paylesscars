"""
Notification models for CarNegotiate.
"""
from django.db import models
from django.utils import timezone

from apps.accounts.models import CustomUser
from core.models import TimeStampedModel


class Notification(TimeStampedModel):
    """
    User notification for real-time updates.
    """
    
    class NotificationType(models.TextChoices):
        OFFER_RECEIVED = 'offer_received', 'New Offer Received'
        OFFER_ACCEPTED = 'offer_accepted', 'Offer Accepted'
        OFFER_REJECTED = 'offer_rejected', 'Offer Rejected'
        COUNTER_OFFER = 'counter_offer', 'Counter Offer Received'
        NEGOTIATION_EXPIRED = 'negotiation_expired', 'Negotiation Expired'
        DEAL_COMPLETED = 'deal_completed', 'Deal Completed'
        DEALER_VERIFIED = 'dealer_verified', 'Dealer Verified'
        PRICE_DROP = 'price_drop', 'Price Drop Alert'
        VEHICLE_SOLD = 'vehicle_sold', 'Vehicle Sold'
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # Flexible payload for frontend
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'notification'
        verbose_name_plural = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark the notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])
