"""
Dealer Serializers for CarNegotiate API.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Dealer, DealerDocument

User = get_user_model()


class DealerDocumentSerializer(serializers.ModelSerializer):
    """Serializer for dealer documents."""
    document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DealerDocument
        fields = ['id', 'document_type', 'document_url', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']
    
    def get_document_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class DealerListSerializer(serializers.ModelSerializer):
    """Serializer for dealer listings."""
    vehicle_count = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = Dealer
        fields = [
            'id', 'business_name', 'city', 'state',
            'vehicle_count', 'is_verified'
        ]
    
    def get_vehicle_count(self, obj):
        return obj.vehicles.filter(status='active').count()
    
    def get_is_verified(self, obj):
        return obj.verification_status == Dealer.VerificationStatus.VERIFIED


class DealerDetailSerializer(serializers.ModelSerializer):
    """Full serializer for dealer detail view."""
    documents = DealerDocumentSerializer(many=True, read_only=True)
    vehicle_count = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Dealer
        fields = [
            'id', 'user_email', 'business_name', 'phone',
            'license_number', 'website', 'tax_id',
            'street_address', 'city', 'state', 'zip_code',
            'verification_status', 'is_verified',
            'vehicle_count', 'documents', 'created_at'
        ]
        read_only_fields = ['id', 'verification_status', 'created_at']
    
    def get_vehicle_count(self, obj):
        return obj.vehicles.count()
    
    def get_is_verified(self, obj):
        return obj.verification_status == Dealer.VerificationStatus.VERIFIED


class DealerPublicSerializer(serializers.ModelSerializer):
    """Public-facing serializer for dealers (no sensitive info)."""
    is_verified = serializers.SerializerMethodField()
    active_listings = serializers.SerializerMethodField()
    
    class Meta:
        model = Dealer
        fields = [
            'id', 'business_name', 'city', 'state',
            'website', 'description', 'operating_hours',
            'is_verified', 'active_listings'
        ]
    
    def get_is_verified(self, obj):
        return obj.verification_status == Dealer.VerificationStatus.VERIFIED
    
    def get_active_listings(self, obj):
        return obj.vehicles.filter(status='active').count()


class DealerRegistrationSerializer(serializers.Serializer):
    """Serializer for dealer registration."""
    business_name = serializers.CharField(max_length=255)
    license_number = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=20)
    street_address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=50)
    zip_code = serializers.CharField(max_length=20)
    tax_id = serializers.CharField(max_length=20, required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    
    def validate_license_number(self, value):
        """Validate license number is unique."""
        if Dealer.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(
                "A dealer with this license number already exists"
            )
        return value
    
    def validate_business_name(self, value):
        """Validate business name is unique."""
        if Dealer.objects.filter(business_name__iexact=value).exists():
            raise serializers.ValidationError(
                "A dealer with this business name already exists"
            )
        return value


class DealerProfileUpdateSerializer(serializers.Serializer):
    """Serializer for updating dealer profile."""
    business_name = serializers.CharField(max_length=255, required=False)
    business_phone = serializers.CharField(max_length=20, required=False)
    website = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    address = serializers.CharField(max_length=255, required=False)
    city = serializers.CharField(max_length=100, required=False)
    state = serializers.CharField(max_length=50, required=False)
    zip_code = serializers.CharField(max_length=20, required=False)


class DealerOperatingHoursSerializer(serializers.Serializer):
    """Serializer for operating hours."""
    monday = serializers.CharField(required=False, allow_blank=True)
    tuesday = serializers.CharField(required=False, allow_blank=True)
    wednesday = serializers.CharField(required=False, allow_blank=True)
    thursday = serializers.CharField(required=False, allow_blank=True)
    friday = serializers.CharField(required=False, allow_blank=True)
    saturday = serializers.CharField(required=False, allow_blank=True)
    sunday = serializers.CharField(required=False, allow_blank=True)


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for document upload."""
    document_type = serializers.ChoiceField(
        choices=DealerDocument.DocumentType.choices
    )
    document = serializers.FileField()
    
    def validate_document(self, value):
        """Validate document file."""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size must be less than 10MB"
            )
        
        # Check file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "File must be PDF, JPEG, or PNG"
            )
        
        return value


class DealerStatsSerializer(serializers.Serializer):
    """Serializer for dealer statistics."""
    # Inventory
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    pending_sale = serializers.IntegerField()
    sold_vehicles = serializers.IntegerField()
    
    # Negotiations
    total_negotiations = serializers.IntegerField()
    active_negotiations = serializers.IntegerField()
    pending_offers = serializers.IntegerField()
    
    # Performance
    deals_closed_30d = serializers.IntegerField()
    total_revenue_30d = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_response_time_hours = serializers.FloatField()
    conversion_rate = serializers.FloatField()
