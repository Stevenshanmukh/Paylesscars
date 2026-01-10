"""
Negotiation ViewSet for CarNegotiate API.
Complete implementation with all actions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.vehicles.models import Vehicle
from apps.accounts.permissions import IsBuyer, IsNegotiationParticipant
from .models import Negotiation
from .services import NegotiationService
from .serializers import (
    NegotiationListSerializer,
    NegotiationDetailSerializer,
    CreateNegotiationSerializer,
    SubmitOfferSerializer,
    AcceptOfferSerializer,
    RejectNegotiationSerializer,
)


class NegotiationViewSet(viewsets.ModelViewSet):
    """
    API endpoints for negotiation management.
    
    Endpoints:
    - GET /negotiations/ - List user's negotiations
    - POST /negotiations/ - Start new negotiation (buyers)
    - GET /negotiations/{id}/ - Get negotiation details
    - POST /negotiations/{id}/submit_offer/ - Submit counter-offer
    - POST /negotiations/{id}/accept/ - Accept current offer
    - POST /negotiations/{id}/reject/ - Reject negotiation (dealers)
    - POST /negotiations/{id}/cancel/ - Cancel negotiation (buyers)
    """
    queryset = Negotiation.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NegotiationListSerializer
        elif self.action == 'retrieve':
            return NegotiationDetailSerializer
        elif self.action == 'create':
            return CreateNegotiationSerializer
        elif self.action == 'submit_offer':
            return SubmitOfferSerializer
        elif self.action == 'accept':
            return AcceptOfferSerializer
        elif self.action == 'reject':
            return RejectNegotiationSerializer
        return NegotiationDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            return [IsAuthenticated(), IsBuyer()]
        elif self.action in ['retrieve', 'submit_offer', 'accept', 'reject', 'cancel']:
            return [IsAuthenticated(), IsNegotiationParticipant()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter negotiations to only those the user participates in."""
        user = self.request.user
        return NegotiationService.get_user_negotiations(user)
    
    def list(self, request):
        """
        GET /negotiations/
        
        List all negotiations for the authenticated user.
        Query params:
        - status: Filter by status (active, accepted, rejected, etc.)
        - role: Filter by role (buyer, dealer)
        """
        queryset = self.get_queryset()
        
        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Role filter
        role_filter = request.query_params.get('role')
        if role_filter == 'buyer':
            queryset = queryset.filter(buyer=request.user)
        elif role_filter == 'dealer':
            queryset = queryset.filter(vehicle__dealer__user=request.user)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """
        GET /negotiations/{id}/
        
        Get detailed negotiation info including all offers.
        """
        negotiation = self.get_object()
        serializer = NegotiationDetailSerializer(
            negotiation,
            context={'request': request}
        )
        return Response(serializer.data)
    
    def create(self, request):
        """
        POST /negotiations/
        
        Start a new negotiation (buyer only).
        
        Request body:
        {
            "vehicle_id": "uuid",
            "initial_amount": 35000.00,
            "message": "I'm interested in this vehicle"
        }
        """
        serializer = CreateNegotiationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vehicle = Vehicle.objects.get(pk=serializer.validated_data['vehicle_id'])
        
        negotiation = NegotiationService.start_negotiation(
            buyer=request.user,
            vehicle=vehicle,
            amount=serializer.validated_data['initial_amount'],
            message=serializer.validated_data.get('message', '')
        )
        
        return Response(
            NegotiationDetailSerializer(negotiation, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], url_path='submit-offer')
    def submit_offer(self, request, pk=None):
        """
        POST /negotiations/{id}/submit-offer/
        
        Submit a counter-offer in an existing negotiation.
        
        Request body:
        {
            "amount": 34000.00,
            "message": "This is my counter-offer"
        }
        """
        negotiation = self.get_object()
        serializer = SubmitOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        offer = NegotiationService.submit_offer(
            negotiation=negotiation,
            user=request.user,
            amount=serializer.validated_data['amount'],
            message=serializer.validated_data.get('message', '')
        )
        
        # Return updated negotiation
        negotiation.refresh_from_db()
        return Response(
            NegotiationDetailSerializer(negotiation, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        POST /negotiations/{id}/accept/
        
        Accept the current pending offer.
        
        Request body:
        {
            "confirm": true
        }
        """
        negotiation = self.get_object()
        serializer = AcceptOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        negotiation = NegotiationService.accept_offer(
            negotiation=negotiation,
            user=request.user
        )
        
        return Response(
            NegotiationDetailSerializer(negotiation, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        POST /negotiations/{id}/reject/
        
        Reject the negotiation (dealer only).
        
        Request body:
        {
            "reason": "Vehicle is no longer available"
        }
        """
        negotiation = self.get_object()
        serializer = RejectNegotiationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        negotiation = NegotiationService.reject_negotiation(
            negotiation=negotiation,
            user=request.user,
            reason=serializer.validated_data.get('reason', '')
        )
        
        return Response(
            NegotiationDetailSerializer(negotiation, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        POST /negotiations/{id}/cancel/
        
        Cancel the negotiation (buyer only).
        """
        negotiation = self.get_object()
        
        negotiation = NegotiationService.cancel_negotiation(
            negotiation=negotiation,
            buyer=request.user
        )
        
        return Response(
            NegotiationDetailSerializer(negotiation, context={'request': request}).data
        )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /negotiations/active/
        
        Get only active negotiations requiring attention.
        """
        queryset = self.get_queryset().filter(
            status=Negotiation.Status.ACTIVE
        )
        serializer = NegotiationListSerializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /negotiations/stats/
        
        Get negotiation statistics for the user.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'active': queryset.filter(status=Negotiation.Status.ACTIVE).count(),
            'accepted': queryset.filter(status=Negotiation.Status.ACCEPTED).count(),
            'rejected': queryset.filter(status=Negotiation.Status.REJECTED).count(),
            'cancelled': queryset.filter(status=Negotiation.Status.CANCELLED).count(),
            'expired': queryset.filter(status=Negotiation.Status.EXPIRED).count(),
            'completed': queryset.filter(status=Negotiation.Status.COMPLETED).count(),
        }
        
        return Response(stats)
