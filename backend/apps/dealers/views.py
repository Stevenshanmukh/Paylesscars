"""
Dealer ViewSet for CarNegotiate API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from apps.accounts.permissions import IsDealer
from .models import Dealer
from .services import DealerService
from .serializers import (
    DealerListSerializer,
    DealerDetailSerializer,
    DealerPublicSerializer,
    DealerRegistrationSerializer,
    DealerProfileUpdateSerializer,
    DealerOperatingHoursSerializer,
    DocumentUploadSerializer,
    DealerStatsSerializer,
)


class DealerViewSet(viewsets.ModelViewSet):
    """
    API endpoints for dealer management.
    
    Endpoints:
    - GET /dealers/ - List all verified dealers (public)
    - GET /dealers/{id}/ - Get dealer details (public)
    - POST /dealers/register/ - Register as dealer
    - GET /dealers/me/ - Get current dealer profile
    - PATCH /dealers/me/ - Update current dealer profile
    - POST /dealers/me/upload-document/ - Upload verification document
    - POST /dealers/me/submit-verification/ - Submit for verification
    - GET /dealers/me/stats/ - Get dealer statistics
    """
    queryset = Dealer.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DealerListSerializer
        elif self.action == 'retrieve':
            return DealerPublicSerializer
        elif self.action == 'register':
            return DealerRegistrationSerializer
        elif self.action in ['me', 'update_profile']:
            return DealerDetailSerializer
        elif self.action == 'upload_document':
            return DocumentUploadSerializer
        elif self.action == 'stats':
            return DealerStatsSerializer
        return DealerDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'register':
            return [IsAuthenticated()]
        elif self.action in ['me', 'update_profile', 'upload_document',
                             'submit_verification', 'stats', 'operating_hours']:
            return [IsAuthenticated(), IsDealer()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Only show verified dealers in public listings."""
        if self.action in ['list', 'retrieve']:
            return Dealer.objects.filter(
                verification_status=Dealer.VerificationStatus.VERIFIED
            )
        return Dealer.objects.all()
    
    def list(self, request):
        """
        GET /dealers/
        
        List all verified dealers.
        Query params:
        - city: Filter by city
        - state: Filter by state
        - search: Search by name
        """
        queryset = self.get_queryset()
        
        # Filters
        city = request.query_params.get('city')
        state = request.query_params.get('state')
        search = request.query_params.get('search')
        
        if city:
            queryset = queryset.filter(city__iexact=city)
        if state:
            queryset = queryset.filter(state__iexact=state)
        if search:
            queryset = queryset.filter(business_name__icontains=search)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """
        GET /dealers/{id}/
        
        Get public dealer information.
        """
        dealer = self.get_object()
        serializer = DealerPublicSerializer(dealer)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        POST /dealers/register/
        
        Register the current user as a dealer.
        """
        # Check if already a dealer
        if hasattr(request.user, 'dealer_profile'):
            return Response(
                {'error': 'You are already registered as a dealer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DealerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        dealer = DealerService.register_dealer(
            user=request.user,
            **serializer.validated_data
        )
        
        return Response(
            DealerDetailSerializer(dealer).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """
        GET/PATCH /dealers/me/
        
        Get or update current dealer profile.
        """
        try:
            dealer = request.user.dealer_profile
        except Dealer.DoesNotExist:
            return Response(
                {'error': 'You are not registered as a dealer'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = DealerDetailSerializer(dealer)
            return Response(serializer.data)
        
        # PATCH
        serializer = DealerProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        dealer = DealerService.update_profile(dealer, **serializer.validated_data)
        return Response(DealerDetailSerializer(dealer).data)
    
    @action(
        detail=False,
        methods=['post'],
        url_path='me/upload-document',
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload_document(self, request):
        """
        POST /dealers/me/upload-document/
        
        Upload a verification document.
        """
        dealer = request.user.dealer_profile
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        document = DealerService.upload_document(
            dealer=dealer,
            document_type=serializer.validated_data['document_type'],
            document_file=serializer.validated_data['document']
        )
        
        return Response({
            'id': str(document.id),
            'document_type': document.document_type,
            'uploaded_at': document.uploaded_at.isoformat()
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='me/submit-verification')
    def submit_verification(self, request):
        """
        POST /dealers/me/submit-verification/
        
        Submit dealer for verification review.
        """
        dealer = request.user.dealer_profile
        
        try:
            dealer = DealerService.submit_for_verification(dealer)
            return Response({
                'status': 'submitted',
                'message': 'Your application has been submitted for review.'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /dealers/me/stats/
        
        Get dealer statistics and analytics.
        """
        dealer = request.user.dealer_profile
        stats = DealerService.get_dealer_stats(dealer)
        serializer = DealerStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put'], url_path='me/operating-hours')
    def operating_hours(self, request):
        """
        GET/PUT /dealers/me/operating-hours/
        
        Get or update operating hours.
        """
        dealer = request.user.dealer_profile
        
        if request.method == 'GET':
            return Response(dealer.operating_hours or {})
        
        serializer = DealerOperatingHoursSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        dealer = DealerService.update_operating_hours(
            dealer, serializer.validated_data
        )
        return Response(dealer.operating_hours)
    
    @action(detail=False, methods=['get'], url_path='me/pending-offers')
    def pending_offers(self, request):
        """
        GET /dealers/me/pending-offers/
        
        Get negotiations with pending offers.
        """
        dealer = request.user.dealer_profile
        from apps.negotiations.serializers import NegotiationListSerializer
        
        negotiations = DealerService.get_pending_offers(dealer)
        serializer = NegotiationListSerializer(
            negotiations,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='me/inventory-summary')
    def inventory_summary(self, request):
        """
        GET /dealers/me/inventory-summary/
        
        Get inventory summary by status.
        """
        dealer = request.user.dealer_profile
        summary = DealerService.get_inventory_summary(dealer)
        return Response(summary)
