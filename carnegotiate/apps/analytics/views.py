"""
Analytics ViewSet for CarNegotiate API.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from apps.accounts.permissions import IsDealer
from .services import AnalyticsService


class DealerAnalyticsViewSet(viewsets.ViewSet):
    """
    API endpoints for dealer analytics.
    
    Endpoints:
    - GET /analytics/dealer/overview/ - Dealer performance overview
    - GET /analytics/dealer/trends/ - Trends over time
    - GET /analytics/dealer/vehicles/ - Top performing vehicles
    """
    permission_classes = [IsAuthenticated, IsDealer]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        GET /analytics/dealer/overview/
        
        Get dealer performance overview.
        Query params:
        - days: Number of days to analyze (default: 30)
        """
        dealer = request.user.dealer
        days = int(request.query_params.get('days', 30))
        
        overview = AnalyticsService.get_dealer_overview(dealer, days)
        return Response(overview)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """
        GET /analytics/dealer/trends/
        
        Get dealer trends over time.
        Query params:
        - days: Number of days (default: 30)
        - granularity: 'day', 'week', or 'month' (default: 'day')
        """
        dealer = request.user.dealer
        days = int(request.query_params.get('days', 30))
        granularity = request.query_params.get('granularity', 'day')
        
        trends = AnalyticsService.get_dealer_trends(dealer, days, granularity)
        return Response(trends)
    
    @action(detail=False, methods=['get'])
    def vehicles(self, request):
        """
        GET /analytics/dealer/vehicles/
        
        Get top performing vehicles.
        Query params:
        - limit: Number of vehicles (default: 10)
        """
        dealer = request.user.dealer
        limit = int(request.query_params.get('limit', 10))
        
        vehicles = AnalyticsService.get_vehicle_performance(dealer, limit)
        return Response(vehicles)


class PlatformAnalyticsViewSet(viewsets.ViewSet):
    """
    API endpoints for platform-wide analytics (admin only).
    
    Endpoints:
    - GET /analytics/platform/overview/ - Platform overview
    - GET /analytics/platform/dealers/ - Top dealers
    - GET /analytics/platform/search/ - Search analytics
    """
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """GET /analytics/platform/overview/"""
        days = int(request.query_params.get('days', 30))
        overview = AnalyticsService.get_platform_overview(days)
        return Response(overview)
    
    @action(detail=False, methods=['get'])
    def dealers(self, request):
        """GET /analytics/platform/dealers/"""
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        dealers = AnalyticsService.get_top_dealers(days, limit)
        return Response(dealers)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """GET /analytics/platform/search/"""
        days = int(request.query_params.get('days', 7))
        searches = AnalyticsService.get_popular_searches(days)
        makes = AnalyticsService.get_popular_makes(days)
        return Response({
            'popular_searches': searches,
            'popular_makes': makes
        })
