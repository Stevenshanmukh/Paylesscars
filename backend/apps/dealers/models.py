"""
Dealer models for CarNegotiate.
"""

from django.db import models

from apps.accounts.models import CustomUser
from core.models import TimeStampedModel


class Dealer(TimeStampedModel):
    """
    Dealership entity with verification status.
    """
    
    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='dealer_profile'
    )
    
    # Business information
    business_name = models.CharField(max_length=200, db_index=True)
    license_number = models.CharField(max_length=50, unique=True)
    tax_id = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)
    
    # Address fields
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=50, db_index=True)
    zip_code = models.CharField(max_length=10)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    
    # Verification
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'dealer'
        verbose_name_plural = 'dealers'
        indexes = [
            models.Index(fields=['verification_status']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return self.business_name
    
    @property
    def is_verified(self):
        return self.verification_status == self.VerificationStatus.VERIFIED
    
    @property
    def full_address(self):
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}"
    
    @property
    def location_display(self):
        return f"{self.city}, {self.state}"


class DealerDocument(TimeStampedModel):
    """
    Documents uploaded by dealers for verification.
    """
    
    class DocumentType(models.TextChoices):
        LICENSE = 'license', 'Dealer License'
        INSURANCE = 'insurance', 'Insurance Certificate'
        W9 = 'w9', 'W-9 Form'
        BANK_VERIFICATION = 'bank_verification', 'Bank Account Verification'
        OTHER = 'other', 'Other'
    
    dealer = models.ForeignKey(
        Dealer,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )
    file = models.FileField(upload_to='dealer_documents/')
    filename = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'dealer document'
        verbose_name_plural = 'dealer documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.get_document_type_display()}"
