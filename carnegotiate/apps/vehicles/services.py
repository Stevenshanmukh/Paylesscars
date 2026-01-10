"""
Vehicle Service Layer for CarNegotiate.
Handles vehicle creation, updates, search, and image processing.
"""
from typing import List
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Vehicle, VehicleImage

User = get_user_model()


class VehicleService:
    """
    Service class for vehicle business logic.
    Handles CRUD, search, and image management.
    """
    
    # -------------------------------------------------------------------------
    # Vehicle CRUD
    # -------------------------------------------------------------------------
    
    @classmethod
    @transaction.atomic
    def create_vehicle(
        cls,
        dealer,
        vin: str,
        make: str,
        model: str,
        year: int,
        asking_price: Decimal,
        stock_number: str = "",
        trim: str = "",
        body_type: str = "",
        exterior_color: str = "",
        interior_color: str = "",
        mileage: int = 0,
        engine: str = "",
        transmission: str = "",
        drivetrain: str = "",
        fuel_type: str = "",
        mpg_city: int = None,
        mpg_highway: int = None,
        features: List[str] = None,
        description: str = "",
        msrp: Decimal = None,
        floor_price: Decimal = None,
        status: str = "draft"
    ) -> Vehicle:
        """
        Create a new vehicle listing.
        
        Args:
            dealer: Dealer creating the listing
            vin: Vehicle Identification Number
            make, model, year: Basic vehicle info
            asking_price: Listed price
            ... (additional optional fields)
            
        Returns:
            Created Vehicle instance
        """
        # Validate VIN uniqueness
        if Vehicle.objects.filter(vin=vin).exists():
            from apps.negotiations.exceptions import ValidationError
            raise ValidationError("A vehicle with this VIN already exists")
        
        # Validate pricing
        if floor_price and floor_price > asking_price:
            from apps.negotiations.exceptions import ValidationError
            raise ValidationError("Floor price cannot exceed asking price")
        
        vehicle = Vehicle.objects.create(
            dealer=dealer,
            vin=vin.upper(),
            make=make,
            model=model,
            year=year,
            trim=trim,
            body_type=body_type,
            exterior_color=exterior_color,
            interior_color=interior_color,
            mileage=mileage,
            engine=engine,
            transmission=transmission,
            drivetrain=drivetrain,
            fuel_type=fuel_type,
            mpg_city=mpg_city,
            mpg_highway=mpg_highway,
            features=features or [],
            description=description,
            msrp=msrp,
            asking_price=asking_price,
            floor_price=floor_price or asking_price * Decimal('0.85'),
            stock_number=stock_number or cls._generate_stock_number(dealer),
            status=status
        )
        
        return vehicle
    
    @classmethod
    def _generate_stock_number(cls, dealer) -> str:
        """Generate unique stock number for dealer."""
        prefix = dealer.business_name[:2].upper()
        count = dealer.vehicles.count() + 1
        return f"{prefix}-{count:04d}"
    
    @classmethod
    def update_vehicle(cls, vehicle: Vehicle, **kwargs) -> Vehicle:
        """
        Update vehicle details.
        Only allows specific fields to be updated.
        """
        allowed_fields = [
            'make', 'model', 'year', 'trim', 'body_type',
            'exterior_color', 'interior_color', 'mileage',
            'engine', 'transmission', 'drivetrain', 'fuel_type',
            'mpg_city', 'mpg_highway', 'features', 'description',
            'msrp', 'asking_price', 'floor_price', 'stock_number'
        ]
        
        for field, value in kwargs.items():
            if field in allowed_fields and value is not None:
                setattr(vehicle, field, value)
        
        vehicle.save()
        return vehicle
    
    @classmethod
    def publish_vehicle(cls, vehicle: Vehicle) -> Vehicle:
        """
        Publish a draft vehicle listing.
        Validates minimum requirements.
        """
        # Validate minimum images
        if vehicle.images.count() < 1:
            from apps.negotiations.exceptions import ValidationError
            raise ValidationError("At least 1 image is required to publish")
        
        # Validate required fields
        required = ['make', 'model', 'year', 'asking_price', 'vin']
        missing = [f for f in required if not getattr(vehicle, f, None)]
        if missing:
            from apps.negotiations.exceptions import ValidationError
            raise ValidationError(f"Missing required fields: {', '.join(missing)}")
        
        vehicle.status = Vehicle.Status.ACTIVE
        vehicle.published_at = timezone.now()
        vehicle.save()
        
        return vehicle
    
    @classmethod
    def deactivate_vehicle(cls, vehicle: Vehicle) -> Vehicle:
        """Temporarily deactivate a vehicle listing."""
        vehicle.status = Vehicle.Status.INACTIVE
        vehicle.save()
        return vehicle
    
    @classmethod
    def mark_as_sold(cls, vehicle: Vehicle, sale_price: Decimal = None) -> Vehicle:
        """Mark vehicle as sold."""
        vehicle.status = Vehicle.Status.SOLD
        vehicle.sold_at = timezone.now()
        if sale_price:
            vehicle.sale_price = sale_price
        vehicle.save()
        return vehicle
    
    # -------------------------------------------------------------------------
    # Image Management
    # -------------------------------------------------------------------------
    
    @classmethod
    def add_image(
        cls,
        vehicle: Vehicle,
        image_file,
        is_primary: bool = False,
        caption: str = ""
    ) -> VehicleImage:
        """
        Add image to vehicle.
        Triggers async image processing.
        """
        # If setting as primary, unset current primary
        if is_primary:
            vehicle.images.filter(is_primary=True).update(is_primary=False)
        
        # Get next display order
        max_order = vehicle.images.aggregate(
            max=models.Max('display_order')
        )['max'] or 0
        
        image = VehicleImage.objects.create(
            vehicle=vehicle,
            image=image_file,
            is_primary=is_primary,
            caption=caption,
            display_order=max_order + 1
        )
        
        # Trigger async processing
        from .tasks import process_vehicle_image
        process_vehicle_image.delay(str(image.id))
        
        return image
    
    @classmethod
    def set_primary_image(cls, image: VehicleImage) -> VehicleImage:
        """Set an image as the primary image."""
        # Unset current primary
        image.vehicle.images.filter(is_primary=True).update(is_primary=False)
        
        # Set new primary
        image.is_primary = True
        image.save()
        
        return image
    
    @classmethod
    def reorder_images(cls, vehicle: Vehicle, image_ids: List[str]) -> None:
        """Reorder vehicle images."""
        for order, image_id in enumerate(image_ids, start=1):
            VehicleImage.objects.filter(
                id=image_id,
                vehicle=vehicle
            ).update(display_order=order)
    
    @classmethod
    def delete_image(cls, image: VehicleImage) -> None:
        """Delete a vehicle image."""
        was_primary = image.is_primary
        vehicle = image.vehicle
        
        image.delete()
        
        # If was primary, set first remaining as primary
        if was_primary:
            first_image = vehicle.images.order_by('display_order').first()
            if first_image:
                first_image.is_primary = True
                first_image.save()
    
    # -------------------------------------------------------------------------
    # VIN Decoding
    # -------------------------------------------------------------------------
    
    @classmethod
    def decode_vin(cls, vin: str) -> dict:
        """
        Decode VIN to get vehicle information.
        Uses NHTSA vPIC API.
        """
        import requests
        
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = data.get('Results', [])
            decoded = {}
            
            field_mapping = {
                'Make': 'make',
                'Model': 'model',
                'Model Year': 'year',
                'Body Class': 'body_type',
                'Trim': 'trim',
                'Drive Type': 'drivetrain',
                'Fuel Type - Primary': 'fuel_type',
                'Transmission Style': 'transmission',
                'Engine Model': 'engine',
                'Displacement (L)': 'displacement',
            }
            
            for item in results:
                variable = item.get('Variable', '')
                value = item.get('Value', '')
                
                if variable in field_mapping and value:
                    decoded[field_mapping[variable]] = value
            
            return decoded
            
        except Exception as e:
            return {'error': str(e)}
    
    # -------------------------------------------------------------------------
    # Search & Discovery
    # -------------------------------------------------------------------------
    
    @classmethod
    def search_vehicles(
        cls,
        query: str = None,
        make: str = None,
        model: str = None,
        year_min: int = None,
        year_max: int = None,
        price_min: Decimal = None,
        price_max: Decimal = None,
        body_type: str = None,
        dealer_id: str = None,
        limit: int = 20,
        offset: int = 0
    ):
        """
        Search vehicles with filters.
        """
        queryset = Vehicle.objects.filter(status=Vehicle.Status.ACTIVE)
        
        # Text search
        if query:
            from django.contrib.postgres.search import SearchVector
            queryset = queryset.annotate(
                search=SearchVector('make', 'model', 'trim', 'description')
            ).filter(search=query)
        
        # Filters
        if make:
            queryset = queryset.filter(make__iexact=make)
        if model:
            queryset = queryset.filter(model__icontains=model)
        if year_min:
            queryset = queryset.filter(year__gte=year_min)
        if year_max:
            queryset = queryset.filter(year__lte=year_max)
        if price_min:
            queryset = queryset.filter(asking_price__gte=price_min)
        if price_max:
            queryset = queryset.filter(asking_price__lte=price_max)
        if body_type:
            queryset = queryset.filter(body_type__iexact=body_type)
        if dealer_id:
            queryset = queryset.filter(dealer_id=dealer_id)
        
        total = queryset.count()
        vehicles = queryset.select_related('dealer').prefetch_related(
            'images'
        ).order_by('-created_at')[offset:offset + limit]
        
        return vehicles, total
    
    @classmethod
    def get_search_suggestions(cls, query: str, limit: int = 5) -> List[str]:
        """
        Get search suggestions based on query.
        """
        if not query or len(query) < 2:
            return []
        
        # Get unique makes matching query
        makes = Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE,
            make__icontains=query
        ).values_list('make', flat=True).distinct()[:limit]
        
        # Get unique make+model combinations
        models = Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE
        ).filter(
            models.Q(make__icontains=query) | models.Q(model__icontains=query)
        ).values('make', 'model').distinct()[:limit]
        
        suggestions = list(makes)
        for m in models:
            suggestions.append(f"{m['make']} {m['model']}")
        
        return suggestions[:limit]
    
    # -------------------------------------------------------------------------
    # Analytics
    # -------------------------------------------------------------------------
    
    @classmethod
    def record_view(cls, vehicle: Vehicle, user=None) -> None:
        """Record a vehicle view."""
        vehicle.view_count = (vehicle.view_count or 0) + 1
        vehicle.save(update_fields=['view_count'])
        
        # TODO: Track detailed analytics
    
    @classmethod
    def get_similar_vehicles(cls, vehicle: Vehicle, limit: int = 4):
        """Get similar vehicles based on make/model/price."""
        price_range = Decimal('0.2')  # 20% range
        min_price = vehicle.asking_price * (1 - price_range)
        max_price = vehicle.asking_price * (1 + price_range)
        
        return Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE,
            make=vehicle.make,
            asking_price__gte=min_price,
            asking_price__lte=max_price
        ).exclude(
            id=vehicle.id
        ).select_related('dealer').prefetch_related('images')[:limit]


# Import models at the end to avoid circular import
from django.db import models
