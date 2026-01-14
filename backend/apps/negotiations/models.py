"""
Negotiation models for CarNegotiate.
"""
from django.conf import settings
from django.db import models
from django.db.models import F
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.vehicles.models import Vehicle
from core.models import TimeStampedModel


class Negotiation(TimeStampedModel):
    """
    Container for a negotiation thread between buyer and dealer.
    """
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'
    
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.PROTECT,
        related_name='negotiations'
    )
    buyer = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='negotiations'
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    expires_at = models.DateTimeField()
    accepted_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Optimistic locking
    version = models.PositiveIntegerField(default=1)
    
    class Meta:
        verbose_name = 'negotiation'
        verbose_name_plural = 'negotiations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'buyer']),
            models.Index(fields=['vehicle', 'status']),
            models.Index(fields=['expires_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['vehicle', 'buyer'],
                condition=models.Q(status='active'),
                name='one_active_negotiation_per_buyer_vehicle'
            ),
        ]
    
    def __str__(self):
        return f"Negotiation for {self.vehicle} by {self.buyer.email}"
    
    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE
    
    @property
    def is_expired(self):
        return self.expires_at < timezone.now()
    
    @property
    def current_offer(self):
        """Get the most recent offer."""
        return self.offers.first()
    
    @property
    def pending_offer(self):
        """Get the pending offer if any."""
        return self.offers.filter(status=Offer.Status.PENDING).first()
    
    @property
    def dealer(self):
        """Get the dealer for this negotiation."""
        return self.vehicle.dealer
    
    def reset_expiration(self, hours=None):
        """Reset the expiration time."""
        if hours is None:
            hours = getattr(settings, 'NEGOTIATION_EXPIRY_HOURS', 72)
        self.expires_at = timezone.now() + timezone.timedelta(hours=hours)
    
    def increment_version(self):
        """Increment version for optimistic locking."""
        self.version = F('version') + 1


class Offer(TimeStampedModel):
    """
    Individual offer within a negotiation.
    """
    
    class OfferedBy(models.TextChoices):
        BUYER = 'buyer', 'Buyer'
        DEALER = 'dealer', 'Dealer'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        COUNTERED = 'countered', 'Countered'
        EXPIRED = 'expired', 'Expired'
    
    negotiation = models.ForeignKey(
        Negotiation,
        on_delete=models.CASCADE,
        related_name='offers'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    offered_by = models.CharField(max_length=10, choices=OfferedBy.choices)
    message = models.TextField(blank=True, max_length=500)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'offer'
        verbose_name_plural = 'offers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['negotiation', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"${self.amount} offer by {self.offered_by} on {self.negotiation}"
    
    @property
    def is_pending(self):
        return self.status == self.Status.PENDING
    
    @property
    def is_from_buyer(self):
        return self.offered_by == self.OfferedBy.BUYER
    
    @property
    def is_from_dealer(self):
        return self.offered_by == self.OfferedBy.DEALER
