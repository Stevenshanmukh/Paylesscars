"""
Vehicle Serializers for CarNegotiate API.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import Vehicle, VehicleImage, SavedVehicle


class VehicleImageSerializer(serializers.ModelSerializer):
    """Serializer for vehicle images."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VehicleImage
        fields = [
            'id', 'image_url', 'is_primary', 'alt_text', 'display_order'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class DealerMiniSerializer(serializers.Serializer):
    """Minimal dealer info for vehicle listings."""
    id = serializers.CharField()
    business_name = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    is_verified = serializers.SerializerMethodField()
    phone = serializers.CharField()
    
    def get_is_verified(self, obj):
        return obj.verification_status == 'verified'


class VehicleListSerializer(serializers.ModelSerializer):
    """Serializer for vehicle listings."""
    title = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    dealer = DealerMiniSerializer(read_only=True)
    savings_from_msrp = serializers.SerializerMethodField()
    mileage = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'title', 'make', 'model', 'year', 'trim',
            'body_type', 'mileage', 'exterior_color', 'interior_color',
            'msrp', 'asking_price', 'primary_image', 'dealer',
            'savings_from_msrp', 'specifications', 'features', 
            'status', 'views_count', 'created_at'
        ]
    
    def get_title(self, obj):
        return f"{obj.year} {obj.make} {obj.model}"
    
    def get_mileage(self, obj):
        """Get mileage from specifications JSON."""
        if obj.specifications:
            return obj.specifications.get('mileage', 0)
        return 0
    
    def get_primary_image(self, obj):
        # Use .all() to leverage prefetch_related cache
        images = list(obj.images.all())
        if not images:
            return None
            
        # Find primary image in list
        primary = next((img for img in images if img.is_primary), None)
        
        # Fallback to first image
        if primary and primary.image:
            return primary.image.url
        elif images[0].image:
            return images[0].image.url
        return None
    
    def get_savings_from_msrp(self, obj):
        """Calculate savings from MSRP."""
        if obj.msrp and obj.asking_price:
            return str(obj.msrp - obj.asking_price)
        return None


class VehicleDetailSerializer(serializers.ModelSerializer):
    """Full serializer for vehicle detail view."""
    title = serializers.SerializerMethodField()
    images = VehicleImageSerializer(many=True, read_only=True)
    dealer = DealerMiniSerializer(read_only=True)
    can_negotiate = serializers.SerializerMethodField()
    mileage = serializers.SerializerMethodField()
    transmission = serializers.SerializerMethodField()
    drivetrain = serializers.SerializerMethodField()
    fuel_type = serializers.SerializerMethodField()
    engine = serializers.SerializerMethodField()
    mpg_city = serializers.SerializerMethodField()
    mpg_highway = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'title', 'vin', 'stock_number',
            'make', 'model', 'year', 'trim', 'body_type',
            'exterior_color', 'interior_color', 'mileage',
            'engine', 'transmission', 'drivetrain', 'fuel_type',
            'mpg_city', 'mpg_highway', 'features', 'specifications',
            'msrp', 'asking_price', 'floor_price', 'images', 'dealer',
            'status', 'can_negotiate', 'views_count', 'created_at'
        ]
    
    def get_title(self, obj):
        return f"{obj.year} {obj.make} {obj.model}"
    
    def get_mileage(self, obj):
        return obj.specifications.get('mileage', 0) if obj.specifications else 0
    
    def get_transmission(self, obj):
        return obj.specifications.get('transmission', '') if obj.specifications else ''
    
    def get_drivetrain(self, obj):
        return obj.specifications.get('drivetrain', '') if obj.specifications else ''
    
    def get_fuel_type(self, obj):
        return obj.specifications.get('fuel_type', '') if obj.specifications else ''
    
    def get_engine(self, obj):
        return obj.specifications.get('engine', '') if obj.specifications else ''
    
    def get_mpg_city(self, obj):
        return obj.specifications.get('mpg_city', 0) if obj.specifications else 0
    
    def get_mpg_highway(self, obj):
        return obj.specifications.get('mpg_highway', 0) if obj.specifications else 0
    
    def get_can_negotiate(self, obj):
        """Check if user can start negotiation."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Can't negotiate own vehicle
        if hasattr(request.user, 'dealer_profile') and request.user.dealer_profile == obj.dealer:
            return False
        
        # Check if active negotiation exists
        from apps.negotiations.models import Negotiation
        existing = Negotiation.objects.filter(
            buyer=request.user,
            vehicle=obj,
            status=Negotiation.Status.ACTIVE
        ).exists()
        
        return not existing and obj.status == Vehicle.Status.ACTIVE


class VehicleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vehicles."""
    
    class Meta:
        model = Vehicle
        fields = [
            'vin', 'stock_number', 'make', 'model', 'year', 'trim',
            'body_type', 'exterior_color', 'interior_color',
            'specifications', 'features',
            'msrp', 'asking_price', 'floor_price', 'status'
        ]
    
    def validate_vin(self, value):
        """Validate VIN format and uniqueness."""
        value = value.upper()
        if len(value) != 17:
            raise serializers.ValidationError("VIN must be 17 characters")
        
        if Vehicle.objects.filter(vin=value).exists():
            raise serializers.ValidationError("Vehicle with this VIN already exists")
        
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        asking = data.get('asking_price')
        floor = data.get('floor_price')
        msrp = data.get('msrp')
        
        if floor and asking and floor > asking:
            raise serializers.ValidationError({
                'floor_price': "Floor price cannot exceed asking price"
            })
        
        if msrp and asking and asking > msrp * Decimal('1.2'):
            raise serializers.ValidationError({
                'asking_price': "Asking price seems too high compared to MSRP"
            })
        
        return data


class VehicleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating vehicles."""
    
    class Meta:
        model = Vehicle
        fields = [
            'stock_number', 'make', 'model', 'year', 'trim',
            'body_type', 'exterior_color', 'interior_color',
            'specifications', 'features',
            'msrp', 'asking_price', 'floor_price', 'status'
        ]
        
    def validate(self, data):
        """Cross-field validation."""
        asking = data.get('asking_price', self.instance.asking_price)
        floor = data.get('floor_price', self.instance.floor_price)
        
        if floor and asking and floor > asking:
            raise serializers.ValidationError({
                'floor_price': "Floor price cannot exceed asking price"
            })
        
        return data


class VehicleSearchSerializer(serializers.Serializer):
    """Serializer for search parameters."""
    query = serializers.CharField(required=False, allow_blank=True)
    make = serializers.CharField(required=False)
    model = serializers.CharField(required=False)
    year_min = serializers.IntegerField(required=False)
    year_max = serializers.IntegerField(required=False)
    price_min = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    price_max = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    body_type = serializers.CharField(required=False)
    limit = serializers.IntegerField(default=20, min_value=1, max_value=100)
    offset = serializers.IntegerField(default=0, min_value=0)


class SavedVehicleSerializer(serializers.ModelSerializer):
    """Serializer for saved vehicles."""
    vehicle = VehicleListSerializer(read_only=True)
    vehicle_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = SavedVehicle
        fields = ['id', 'vehicle', 'vehicle_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        vehicle_id = validated_data.pop('vehicle_id')
        vehicle = Vehicle.objects.get(id=vehicle_id)
        user = self.context['request'].user
        
        # Use get_or_create to handle duplicates gracefully
        saved, created = SavedVehicle.objects.get_or_create(
            user=user,
            vehicle=vehicle
        )
        return saved

