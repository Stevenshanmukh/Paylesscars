"""
Vehicle ViewSet for CarNegotiate API.
"""
from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Vehicle, SavedVehicle
from .serializers import (
    VehicleListSerializer, 
    VehicleDetailSerializer, 
    VehicleCreateSerializer, 
    VehicleUpdateSerializer,
    SavedVehicleSerializer
)
from .filters import VehicleFilterSet


from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class VehicleViewSet(viewsets.ModelViewSet):
    """
    Vehicle CRUD operations.
    
    Endpoints:
    - GET /vehicles/ - List all active vehicles
    - GET /vehicles/{id}/ - Get vehicle details
    - POST /vehicles/ - Create a new vehicle (dealer only)
    - PATCH /vehicles/{id}/ - Update a vehicle (dealer only)
    - DELETE /vehicles/{id}/ - Deactivate a vehicle (dealer only)
    - POST /vehicles/{id}/upload_images/ - Upload images (dealer only)
    - GET /vehicles/search/ - Search vehicles
    - GET /vehicles/featured/ - Get featured vehicles
    - GET /vehicles/makes/ - Get list of car makes
    - GET /vehicles/{id}/similar/ - Get similar vehicles
    - GET /vehicles/saved/ - Get user's saved vehicles
    - POST /vehicles/saved/ - Save a vehicle
    - DELETE /vehicles/saved/{vehicle_id}/ - Remove from saved
    """
    queryset = Vehicle.objects.select_related('dealer', 'dealer__user').prefetch_related('images')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilterSet
    search_fields = ['make', 'model', 'trim', 'vin']
    ordering_fields = ['asking_price', 'year', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search', 'featured', 'makes', 'similar']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        elif self.action == 'retrieve':
            return VehicleDetailSerializer
        elif self.action == 'create':
            return VehicleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return VehicleUpdateSerializer
        elif self.action in ['saved', 'add_saved']:
            return SavedVehicleSerializer
        return VehicleDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For list action, show active and pending_sale vehicles (pending_sale still visible as sale may not complete)
        if self.action == 'list':
            queryset = queryset.filter(status__in=[Vehicle.Status.ACTIVE, Vehicle.Status.PENDING_SALE])
        
        # For dealer-specific actions, filter by their own vehicles
        if self.action in ['update', 'partial_update', 'destroy', 'upload_images']:
            if hasattr(self.request.user, 'dealer_profile'):
                queryset = queryset.filter(dealer=self.request.user.dealer_profile)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Set the dealer when creating a vehicle."""
        if hasattr(self.request.user, 'dealer_profile'):
            serializer.save(dealer=self.request.user.dealer_profile)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only dealers can create vehicles")
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark vehicle as inactive instead of deleting."""
        vehicle = self.get_object()
        vehicle.status = Vehicle.Status.INACTIVE
        vehicle.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_inventory(self, request):
        """Get dealer's own vehicles with all statuses."""
        if not hasattr(request.user, 'dealer_profile'):
            return Response(
                {'detail': 'Only dealers can access inventory'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        vehicles = Vehicle.objects.filter(
            dealer=request.user.dealer_profile
        ).select_related('dealer', 'dealer__user').prefetch_related('images')
        
        # Optional status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            vehicles = vehicles.filter(status=status_filter)
        
        serializer = VehicleListSerializer(vehicles, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_images(self, request, pk=None):
        """Upload images for a vehicle."""
        from .models import VehicleImage
        
        vehicle = self.get_object()
        files = request.FILES.getlist('images')
        
        if not files:
            return Response(
                {'detail': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        images = []
        for i, file in enumerate(files):
            is_primary = i == 0 and not vehicle.images.exists()
            image = VehicleImage.objects.create(
                vehicle=vehicle,
                image=file,
                is_primary=is_primary,
                display_order=vehicle.images.count() + i,
                alt_text=f"{vehicle} - Image {vehicle.images.count() + i + 1}"
            )
            images.append({
                'id': str(image.id),
                'url': image.image.url if image.image else None,
                'is_primary': image.is_primary
            })
        
        return Response({'images': images}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Bulk upload vehicles from CSV file.
        
        POST /api/v1/vehicles/bulk_upload/
        Content-Type: multipart/form-data
        
        Body: csv_file (file)
        """
        import csv
        import io
        from rest_framework.parsers import MultiPartParser, FormParser
        
        if not hasattr(request.user, 'dealer_profile'):
            return Response(
                {'error': 'Only dealers can upload vehicles'},
                status=status.HTTP_403_FORBIDDEN
            )

        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response(
                {'error': 'No CSV file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be a CSV'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse CSV
        try:
            decoded_file = csv_file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded_file))
            rows = list(reader)
        except Exception as e:
            return Response(
                {'error': f'Failed to parse CSV: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = {
            'total': len(rows),
            'successful': 0,
            'failed': 0,
            'errors': [],
            'created_vehicles': []
        }

        dealer = request.user.dealer_profile

        for index, row in enumerate(rows, start=2):  # Start at 2 (header is row 1)
            try:
                # Validate and create vehicle
                vehicle_data = self._parse_csv_row(row, dealer)
                
                # Check for duplicate VIN
                if Vehicle.objects.filter(vin=vehicle_data['vin']).exists():
                    results['failed'] += 1
                    results['errors'].append({
                        'row': index,
                        'vin': vehicle_data['vin'],
                        'error': 'VIN already exists in database'
                    })
                    continue

                # Create vehicle
                vehicle = Vehicle.objects.create(**vehicle_data)
                results['successful'] += 1
                results['created_vehicles'].append({
                    'id': vehicle.id,
                    'vin': vehicle.vin,
                    'make': vehicle.make,
                    'model': vehicle.model,
                    'year': vehicle.year,
                    'price': str(vehicle.asking_price)
                })

            except ValueError as e:
                results['failed'] += 1
                results['errors'].append({
                    'row': index,
                    'vin': row.get('vin', 'N/A'),
                    'error': str(e)
                })
            except Exception as e:
                # Log the full error for debugging but return safe message
                print(f"Row {index} error: {str(e)}")
                results['failed'] += 1
                results['errors'].append({
                    'row': index,
                    'vin': row.get('vin', 'N/A'),
                    'error': f'Unexpected error: {str(e)}'
                })

        return Response(results, status=status.HTTP_201_CREATED)

    def _parse_csv_row(self, row, dealer):
        """Parse and validate a single CSV row."""
        
        # Required fields
        required = ['vin', 'make', 'model', 'year', 'price', 'mileage']
        for field in required:
            if not row.get(field):
                raise ValueError(f'Missing required field: {field}')

        # Validate VIN
        vin = row['vin'].strip().upper()
        if len(vin) != 17:
            raise ValueError(f'VIN must be 17 characters, got {len(vin)}')

        # Validate year
        try:
            year = int(row['year'])
            if year < 1900 or year > 2026:
                raise ValueError(f'Invalid year: {year}')
        except (ValueError, TypeError):
            raise ValueError(f'Invalid year format: {row["year"]}')

        # Validate price
        try:
            price_str = row['price'].replace(',', '').replace('$', '')
            price = float(price_str)
            if price <= 0:
                raise ValueError('Price must be positive')
        except (ValueError, TypeError):
            raise ValueError(f'Invalid price format: {row["price"]}')

        # Validate mileage
        try:
            mileage_str = row['mileage'].replace(',', '')
            mileage = int(mileage_str)
            if mileage < 0:
                raise ValueError('Mileage cannot be negative')
        except (ValueError, TypeError):
            raise ValueError(f'Invalid mileage format: {row["mileage"]}')

        # Parse optional fields
        msrp = 0
        if row.get('msrp'):
            try:
                msrp = float(row['msrp'].replace(',', '').replace('$', ''))
            except (ValueError, TypeError):
                pass
        
        # If MSRP is 0 or missing, default to asking price + 10% or just asking price
        # For data integrity, if not provided, we can leave as 0 or set equal to price
        if not msrp:
            msrp = price * 1.1 # Default buffer

        floor_price = price # Default to asking price if not set
        if row.get('floor_price'):
            try:
                floor_price = float(row['floor_price'].replace(',', '').replace('$', ''))
            except (ValueError, TypeError):
                pass

        # Normalize choice fields
        body_type = (row.get('body_type') or 'sedan').lower()
        valid_body_types = [c[0] for c in Vehicle.BodyType.choices]
        if body_type not in valid_body_types:
            body_type = 'sedan'

        vehicle_status = (row.get('status') or 'active').lower()
        if vehicle_status not in ['active', 'pending_sale', 'draft', 'sold', 'inactive']:
            vehicle_status = 'active'
            
        # Specifications extraction
        transmission = (row.get('transmission') or 'automatic').lower()
        fuel_type = (row.get('fuel_type') or 'gasoline').lower()
        
        specifications = {
            'mileage': mileage,
            'transmission': transmission,
            'fuel_type': fuel_type,
            'drivetrain': row.get('drivetrain', 'Unknown'),
            'engine': row.get('engine', 'Unknown'),
            'mpg_city': row.get('mpg_city', 0),
            'mpg_highway': row.get('mpg_highway', 0),
        }

        return {
            'dealer': dealer,
            'vin': vin,
            'stock_number': row.get('stock_number', vin[-8:]), # Default stock #
            'make': row['make'].strip(),
            'model': row['model'].strip(),
            'year': year,
            'trim': (row.get('trim') or '').strip(),
            'body_type': body_type,
            'asking_price': price,
            'msrp': msrp,
            'floor_price': floor_price,
            'specifications': specifications,
            'exterior_color': (row.get('exterior_color') or 'Unknown').strip(),
            'interior_color': (row.get('interior_color') or 'Unknown').strip(),
            # Description is not on model, maybe put in specifications or features?
            # Model has no description field. We'll skip or add to features.
            'status': vehicle_status,
        }

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def bulk_upload_template(self, request):
        """
        Download CSV template for bulk upload.
        
        GET /api/v1/vehicles/bulk_upload_template/
        """
        headers = [
            'vin', 'make', 'model', 'year', 'trim', 'body_type',
            'price', 'msrp', 'floor_price', 'mileage', 'transmission',
            'fuel_type', 'exterior_color', 'interior_color', 'description', 'status'
        ]
        
        sample_data = [
            '1HGCV1F34LA123456', 'Honda', 'Accord', '2025', 'EX-L', 'sedan',
            '35500.00', '37000.00', '33000.00', '15', 'automatic',
            'gasoline', 'White Pearl', 'Black Leather', 'One owner, clean title.', 'active'
        ]

        return Response({
            'headers': headers,
            'sample_row': dict(zip(headers, sample_data)),
            'field_descriptions': {
                'vin': 'Vehicle Identification Number (17 characters, required)',
                'make': 'Manufacturer name (required)',
                'model': 'Model name (required)',
                'year': 'Model year 1900-2026 (required)',
                'trim': 'Trim level (optional)',
                'body_type': 'sedan/suv/truck/coupe/van/wagon/convertible/hatchback (optional, default: sedan)',
                'price': 'Listing price in USD (required)',
                'msrp': 'MSRP in USD (optional)',
                'floor_price': 'Minimum acceptable price in USD (optional)',
                'mileage': 'Odometer reading (required)',
                'transmission': 'automatic/manual/cvt (optional, default: automatic)',
                'fuel_type': 'gasoline/diesel/hybrid/electric/plugin_hybrid (optional, default: gasoline)',
                'exterior_color': 'Exterior color (optional)',
                'interior_color': 'Interior color (optional)',
                'description': 'Vehicle description (optional - check system support)',
                'status': 'active/pending/draft (optional, default: active)',
            }
        })

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def search(self, request):
        """Full-text search for vehicles."""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'results': []})
        
        queryset = self.get_queryset().filter(
            status=Vehicle.Status.ACTIVE
        ).filter(
            models.Q(make__icontains=query) |
            models.Q(model__icontains=query) |
            models.Q(trim__icontains=query)
        )[:20]
        
        serializer = VehicleListSerializer(queryset, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_inventory(self, request):
        """Get dealer's own inventory."""
        if not hasattr(request.user, 'dealer_profile'):
            return Response({'results': []})
        
        queryset = self.queryset.filter(dealer=request.user.dealer_profile)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = VehicleListSerializer(queryset, many=True)
        return Response({'results': serializer.data})
    
    # ==================== NEW ENDPOINTS ====================
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def featured(self, request):
        """
        GET /vehicles/featured/
        
        Get featured/promoted vehicles for homepage carousel.
        Returns 8 most recently listed active vehicles with good discounts.
        """
        queryset = Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE
        ).select_related('dealer').prefetch_related('images').order_by(
            '-created_at'
        )[:8]
        
        serializer = VehicleListSerializer(queryset, many=True)
        return Response({'results': serializer.data})
    
    @method_decorator(cache_page(60 * 60 * 24))  # Cache for 24 hours
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def makes(self, request):
        """
        GET /vehicles/makes/
        
        Get distinct list of car makes from active vehicles.
        """
        makes = Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE
        ).values_list('make', flat=True).distinct().order_by('make')
        
        return Response({'makes': list(makes)})
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def similar(self, request, pk=None):
        """
        GET /vehicles/{id}/similar/
        
        Get similar vehicles based on make and price range.
        Returns 4 similar active vehicles.
        """
        try:
            vehicle = Vehicle.objects.get(pk=pk)
        except Vehicle.DoesNotExist:
            return Response({'results': []})
        
        # Find similar vehicles: same make, similar price range (±20%)
        price_min = float(vehicle.asking_price) * 0.8
        price_max = float(vehicle.asking_price) * 1.2
        
        similar = Vehicle.objects.filter(
            status=Vehicle.Status.ACTIVE,
            make=vehicle.make,
            asking_price__gte=price_min,
            asking_price__lte=price_max
        ).exclude(pk=vehicle.pk).select_related('dealer').prefetch_related('images')[:4]
        
        # If not enough similar by make, fill with price-similar vehicles
        if similar.count() < 4:
            additional = Vehicle.objects.filter(
                status=Vehicle.Status.ACTIVE,
                asking_price__gte=price_min,
                asking_price__lte=price_max
            ).exclude(
                pk=vehicle.pk
            ).exclude(
                pk__in=similar.values_list('pk', flat=True)
            ).select_related('dealer').prefetch_related('images')[:4 - similar.count()]
            
            similar = list(similar) + list(additional)
        
        serializer = VehicleListSerializer(similar, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def saved(self, request):
        """
        GET /vehicles/saved/ - Get user's saved vehicles
        POST /vehicles/saved/ - Add a vehicle to saved (body: {vehicle_id: "uuid"})
        """
        if request.method == 'GET':
            saved = SavedVehicle.objects.filter(
                user=request.user
            ).select_related('vehicle__dealer').prefetch_related('vehicle__images')
            
            serializer = SavedVehicleSerializer(saved, many=True)
            return Response({'results': serializer.data})
        
        elif request.method == 'POST':
            serializer = SavedVehicleSerializer(
                data=request.data, 
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=False, 
        methods=['delete'], 
        url_path='saved/(?P<vehicle_id>[^/.]+)',
        permission_classes=[IsAuthenticated]
    )
    def remove_saved(self, request, vehicle_id=None):
        """
        DELETE /vehicles/saved/{vehicle_id}/
        
        Remove a vehicle from user's saved list.
        """
        try:
            saved = SavedVehicle.objects.get(
                user=request.user,
                vehicle_id=vehicle_id
            )
            saved.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedVehicle.DoesNotExist:
            return Response(
                {'detail': 'Vehicle not in saved list'},
                status=status.HTTP_404_NOT_FOUND
            )
