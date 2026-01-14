"""
Analytics models for CarNegotiate.
"""
from django.db import models

from apps.dealers.models import Dealer
from apps.vehicles.models import Vehicle
from core.models import TimeStampedModel


class DealerMetrics(TimeStampedModel):
    """
    Aggregated metrics for dealer analytics.
    """
    dealer = models.ForeignKey(
        Dealer,
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    date = models.DateField()
    
    # Counts
    total_vehicles = models.PositiveIntegerField(default=0)
    active_vehicles = models.PositiveIntegerField(default=0)
    vehicles_sold = models.PositiveIntegerField(default=0)
    
    # Offer metrics
    offers_received = models.PositiveIntegerField(default=0)
    offers_accepted = models.PositiveIntegerField(default=0)
    offers_rejected = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    avg_response_time_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    avg_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    conversion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Revenue (potential, based on accepted offers)
    total_revenue = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0
    )
    
    class Meta:
        verbose_name = 'dealer metrics'
        verbose_name_plural = 'dealer metrics'
        unique_together = ['dealer', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.date}"


class VehicleView(TimeStampedModel):
    """
    Track vehicle page views for analytics.
    """
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='view_logs'
    )
    user_id = models.UUIDField(null=True, blank=True)  # Anonymous or authenticated
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    class Meta:
        verbose_name = 'vehicle view'
        verbose_name_plural = 'vehicle views'
        indexes = [
            models.Index(fields=['vehicle', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"View of {self.vehicle} at {self.created_at}"
