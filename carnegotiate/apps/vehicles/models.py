"""
Vehicle models for CarNegotiate.
"""
from django.db import models

from apps.dealers.models import Dealer
from core.models import TimeStampedModel


class Vehicle(TimeStampedModel):
    """
    New vehicle listing with pricing tiers.
    """
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        PENDING_SALE = 'pending_sale', 'Pending Sale'
        SOLD = 'sold', 'Sold'
        INACTIVE = 'inactive', 'Inactive'
    
    class BodyType(models.TextChoices):
        SEDAN = 'sedan', 'Sedan'
        SUV = 'suv', 'SUV'
        TRUCK = 'truck', 'Truck'
        COUPE = 'coupe', 'Coupe'
        HATCHBACK = 'hatchback', 'Hatchback'
        CONVERTIBLE = 'convertible', 'Convertible'
        VAN = 'van', 'Van'
        WAGON = 'wagon', 'Wagon'
    
    dealer = models.ForeignKey(
        Dealer,
        on_delete=models.CASCADE,
        related_name='vehicles'
    )
    
    # Vehicle identification
    vin = models.CharField(max_length=17, unique=True, db_index=True)
    stock_number = models.CharField(max_length=50)
    
    # Vehicle details
    make = models.CharField(max_length=50, db_index=True)
    model = models.CharField(max_length=100, db_index=True)
    year = models.PositiveSmallIntegerField(db_index=True)
    trim = models.CharField(max_length=100, blank=True)
    body_type = models.CharField(max_length=20, choices=BodyType.choices)
    exterior_color = models.CharField(max_length=50)
    interior_color = models.CharField(max_length=50)
    
    # Pricing - Critical business fields
    msrp = models.DecimalField(max_digits=12, decimal_places=2)
    floor_price = models.DecimalField(max_digits=12, decimal_places=2)  # Minimum acceptable
    asking_price = models.DecimalField(max_digits=12, decimal_places=2)  # Listed price
    
    # Specifications stored as JSON for flexibility
    specifications = models.JSONField(default=dict, blank=True)
    features = models.JSONField(default=list, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    views_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = 'vehicle'
        verbose_name_plural = 'vehicles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'dealer']),
            models.Index(fields=['make', 'model', 'year']),
            models.Index(fields=['asking_price']),
            models.Index(fields=['body_type']),
            models.Index(fields=['-created_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(floor_price__lte=models.F('msrp')),
                name='floor_price_lte_msrp'
            ),
            models.CheckConstraint(
                check=models.Q(asking_price__gte=models.F('floor_price')),
                name='asking_price_gte_floor'
            ),
        ]
    
    def __str__(self):
        return f"{self.year} {self.make} {self.model} {self.trim}".strip()
    
    @property
    def title(self):
        return str(self)
    
    @property
    def primary_image(self):
        """Get the primary image for this vehicle."""
        return self.images.filter(is_primary=True).first() or self.images.first()
    
    @property
    def discount_from_msrp(self):
        """Calculate the discount from MSRP."""
        if self.msrp > 0:
            return self.msrp - self.asking_price
        return 0
    
    @property
    def discount_percentage(self):
        """Calculate the discount percentage from MSRP."""
        if self.msrp > 0:
            return ((self.msrp - self.asking_price) / self.msrp) * 100
        return 0


class VehicleImage(TimeStampedModel):
    """
    Images for vehicle listings.
    Supports multiple size variants for performance.
    """
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='images'
    )
    # Original uploaded image
    image = models.ImageField(upload_to='vehicles/')
    
    # Generated variants (created by Celery task)
    thumbnail = models.ImageField(upload_to='vehicles/thumbs/', blank=True)
    medium = models.ImageField(upload_to='vehicles/medium/', blank=True)
    large = models.ImageField(upload_to='vehicles/large/', blank=True)
    
    # URL fields for CDN/external storage (future use)
    thumbnail_url = models.URLField(blank=True)
    medium_url = models.URLField(blank=True)
    large_url = models.URLField(blank=True)
    
    # Metadata
    is_primary = models.BooleanField(default=False)
    is_processed = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)
    alt_text = models.CharField(max_length=255, blank=True)
    
    class Meta:
        verbose_name = 'vehicle image'
        verbose_name_plural = 'vehicle images'
        ordering = ['display_order', 'created_at']
    
    def __str__(self):
        return f"Image for {self.vehicle}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary image per vehicle
        if self.is_primary:
            VehicleImage.objects.filter(
                vehicle=self.vehicle,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class SavedVehicle(TimeStampedModel):
    """
    Tracks vehicles saved/favorited by users.
    """
    user = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='saved_vehicles'
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    
    class Meta:
        verbose_name = 'saved vehicle'
        verbose_name_plural = 'saved vehicles'
        ordering = ['-created_at']
        unique_together = ['user', 'vehicle']  # Prevent duplicate saves
    
    def __str__(self):
        return f"{self.user.email} saved {self.vehicle}"
