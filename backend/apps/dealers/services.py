"""
Dealer Service Layer for CarNegotiate.
Handles dealer registration, verification, and management.
"""
from typing import Optional
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Dealer, DealerDocument

User = get_user_model()


class DealerService:
    """
    Service class for dealer business logic.
    Handles registration, verification, and profile management.
    """
    
    # -------------------------------------------------------------------------
    # Registration & Onboarding
    # -------------------------------------------------------------------------
    
    @classmethod
    @transaction.atomic
    def register_dealer(
        cls,
        user: User,
        business_name: str,
        license_number: str,
        phone: str,
        street_address: str,
        city: str,
        state: str,
        zip_code: str,
        tax_id: str = '',
        website: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dealer:
        """
        Register a new dealer.
        
        Args:
            user: User account to associate with dealer
            business_name: Dealership name
            license_number: Dealer license number
            phone: Contact phone
            street_address, city, state, zip_code: Business address
            tax_id: Tax ID (optional)
            website: Optional website
            description: Optional description
            
        Returns:
            Created Dealer instance
        """
        # Update user type
        user.user_type = 'dealer'
        user.save()
        
        # Create dealer profile
        dealer = Dealer.objects.create(
            user=user,
            business_name=business_name,
            license_number=license_number,
            phone=phone,
            street_address=street_address,
            city=city,
            state=state,
            zip_code=zip_code,
            tax_id=tax_id or 'PENDING',
            website=website or '',
            verification_status=Dealer.VerificationStatus.PENDING
        )
        
        return dealer
    
    @classmethod
    def upload_document(
        cls,
        dealer: Dealer,
        document_type: str,
        document_file
    ) -> DealerDocument:
        """
        Upload verification document.
        
        Args:
            dealer: Dealer uploading the document
            document_type: Type of document
            document_file: File object
            
        Returns:
            Created DealerDocument instance
        """
        # Delete existing document of same type
        DealerDocument.objects.filter(
            dealer=dealer,
            document_type=document_type
        ).delete()
        
        # Create new document
        document = DealerDocument.objects.create(
            dealer=dealer,
            document_type=document_type,
            document=document_file
        )
        
        return document
    
    @classmethod
    def submit_for_verification(cls, dealer: Dealer) -> Dealer:
        """
        Submit dealer for verification.
        Validates required documents are present.
        """
        required_docs = [
            DealerDocument.DocumentType.DEALER_LICENSE,
            DealerDocument.DocumentType.BUSINESS_LICENSE
        ]
        
        existing_docs = set(
            dealer.documents.values_list('document_type', flat=True)
        )
        
        missing = [doc for doc in required_docs if doc not in existing_docs]
        if missing:
            from apps.negotiations.exceptions import ValidationError
            raise ValidationError(f"Missing required documents: {', '.join(missing)}")
        
        dealer.verification_status = Dealer.VerificationStatus.PENDING
        dealer.submitted_at = timezone.now()
        dealer.save()
        
        return dealer
    
    # -------------------------------------------------------------------------
    # Verification (Admin)
    # -------------------------------------------------------------------------
    
    @classmethod
    def approve_dealer(cls, dealer: Dealer, admin_user: User) -> Dealer:
        """
        Approve a dealer's verification.
        Triggers notification.
        """
        dealer.verification_status = Dealer.VerificationStatus.VERIFIED
        dealer.verified_at = timezone.now()
        dealer.verified_by = admin_user
        dealer.save()
        
        # Send notification
        from apps.notifications.services import NotificationService
        NotificationService.notify_dealer_verified(dealer)
        
        return dealer
    
    @classmethod
    def reject_dealer(
        cls,
        dealer: Dealer,
        admin_user: User,
        reason: str = ""
    ) -> Dealer:
        """
        Reject a dealer's verification.
        Triggers notification.
        """
        dealer.verification_status = Dealer.VerificationStatus.REJECTED
        dealer.rejection_reason = reason
        dealer.save()
        
        # Send notification
        from apps.notifications.services import NotificationService
        NotificationService.notify_dealer_rejected(dealer, reason)
        
        return dealer
    
    @classmethod
    def request_additional_info(cls, dealer: Dealer, message: str) -> Dealer:
        """
        Request additional information from dealer.
        """
        dealer.verification_status = Dealer.VerificationStatus.PENDING
        dealer.save()
        
        # Create notification
        from apps.notifications.services import NotificationService
        NotificationService.create_notification(
            user=dealer.user,
            notification_type='dealer_info_request',
            title='Additional Information Required',
            message=message,
            data={'dealer_id': str(dealer.id)}
        )
        
        return dealer
    
    # -------------------------------------------------------------------------
    # Profile Management
    # -------------------------------------------------------------------------
    
    @classmethod
    def update_profile(cls, dealer: Dealer, **kwargs) -> Dealer:
        """
        Update dealer profile.
        Only allows specific fields to be updated.
        """
        allowed_fields = [
            'business_name', 'business_phone', 'website', 'description',
            'address', 'city', 'state', 'zip_code', 'logo'
        ]
        
        for field, value in kwargs.items():
            if field in allowed_fields and value is not None:
                setattr(dealer, field, value)
        
        dealer.save()
        return dealer
    
    @classmethod
    def update_operating_hours(cls, dealer: Dealer, hours: dict) -> Dealer:
        """
        Update dealer operating hours.
        
        Args:
            hours: Dict like {'monday': '9:00-18:00', 'sunday': 'closed'}
        """
        dealer.operating_hours = hours
        dealer.save()
        return dealer
    
    # -------------------------------------------------------------------------
    # Statistics & Analytics
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_dealer_stats(cls, dealer: Dealer) -> dict:
        """
        Get comprehensive dealer statistics.
        """
        from apps.vehicles.models import Vehicle
        from apps.negotiations.models import Negotiation
        from datetime import timedelta
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        vehicles = dealer.vehicles.all()
        negotiations = Negotiation.objects.filter(vehicle__dealer=dealer)
        
        # Calculate stats
        stats = {
            # Inventory
            'total_vehicles': vehicles.count(),
            'active_vehicles': vehicles.filter(status=Vehicle.Status.ACTIVE).count(),
            'pending_sale': vehicles.filter(status=Vehicle.Status.PENDING_SALE).count(),
            'sold_vehicles': vehicles.filter(status=Vehicle.Status.SOLD).count(),
            
            # Negotiations
            'total_negotiations': negotiations.count(),
            'active_negotiations': negotiations.filter(
                status=Negotiation.Status.ACTIVE
            ).count(),
            'pending_offers': negotiations.filter(
                status=Negotiation.Status.ACTIVE,
                offers__status='pending',
                offers__offered_by='buyer'
            ).distinct().count(),
            
            # Performance (30 days)
            'deals_closed_30d': negotiations.filter(
                status=Negotiation.Status.ACCEPTED,
                updated_at__gte=thirty_days_ago
            ).count(),
            'total_revenue_30d': sum(
                n.accepted_price or 0 for n in negotiations.filter(
                    status=Negotiation.Status.ACCEPTED,
                    vehicle__status=Vehicle.Status.SOLD,
                    updated_at__gte=thirty_days_ago
                )
            ),
            
            # Response metrics
            'avg_response_time_hours': cls._calculate_avg_response_time(dealer),
            'conversion_rate': cls._calculate_conversion_rate(dealer),
        }
        
        return stats
    
    @classmethod
    def _calculate_avg_response_time(cls, dealer: Dealer) -> float:
        """Calculate average response time in hours."""
        from apps.negotiations.models import Offer
        from django.db.models import F
        
        # Get dealer responses (counter-offers from dealer)
        responses = Offer.objects.filter(
            negotiation__vehicle__dealer=dealer,
            offered_by='dealer',
            responded_at__isnull=False
        ).annotate(
            response_time=F('responded_at') - F('created_at')
        )
        
        if not responses.exists():
            return 0.0
        
        total_seconds = sum(
            (r.responded_at - r.created_at).total_seconds()
            for r in responses[:100]  # Limit to recent 100
        )
        
        avg_seconds = total_seconds / responses.count()
        return round(avg_seconds / 3600, 1)  # Convert to hours
    
    @classmethod
    def _calculate_conversion_rate(cls, dealer: Dealer) -> float:
        """Calculate negotiation to sale conversion rate."""
        from apps.negotiations.models import Negotiation
        
        total = Negotiation.objects.filter(vehicle__dealer=dealer).count()
        if total == 0:
            return 0.0
        
        accepted = Negotiation.objects.filter(
            vehicle__dealer=dealer,
            status=Negotiation.Status.ACCEPTED
        ).count()
        
        return round((accepted / total) * 100, 1)
    
    # -------------------------------------------------------------------------
    # Inventory Management
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_inventory_summary(cls, dealer: Dealer) -> dict:
        """
        Get inventory summary grouped by status.
        """
        from django.db.models import Count, Avg, Sum
        
        summary = dealer.vehicles.values('status').annotate(
            count=Count('id'),
            avg_price=Avg('asking_price'),
            total_value=Sum('asking_price')
        )
        
        return {
            item['status']: {
                'count': item['count'],
                'avg_price': float(item['avg_price'] or 0),
                'total_value': float(item['total_value'] or 0)
            }
            for item in summary
        }
    
    @classmethod
    def get_pending_offers(cls, dealer: Dealer, limit: int = 10):
        """
        Get negotiations with pending offers for dealer.
        """
        from apps.negotiations.models import Negotiation
        
        return Negotiation.objects.filter(
            vehicle__dealer=dealer,
            status=Negotiation.Status.ACTIVE,
            offers__status='pending',
            offers__offered_by='buyer'
        ).distinct().select_related(
            'vehicle', 'buyer'
        ).prefetch_related('offers').order_by('-updated_at')[:limit]
