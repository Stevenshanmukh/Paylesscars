"""
Notification ViewSet for CarNegotiate API.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for notifications.
    
    Endpoints:
    - GET /notifications/ - List user's notifications
    - GET /notifications/{id}/ - Get notification details
    - GET /notifications/unread_count/ - Get unread count
    - POST /notifications/{id}/mark_read/ - Mark as read
    - POST /notifications/mark_all_read/ - Mark all as read
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')
    
    def list(self, request):
        """
        GET /notifications/
        
        List notifications for the authenticated user.
        Query params:
        - unread_only: If true, only show unread notifications
        - type: Filter by notification type
        """
        queryset = self.get_queryset()
        
        # Filter by unread
        if request.query_params.get('unread_only') == 'true':
            queryset = queryset.filter(is_read=False)
        
        # Filter by type
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """GET /notifications/unread_count/"""
        count = NotificationService.get_unread_count(request.user)
        return Response({'unread_count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """POST /notifications/{id}/mark_read/"""
        notification = self.get_object()
        NotificationService.mark_as_read(notification)
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """POST /notifications/mark_all_read/"""
        count = NotificationService.mark_all_read(request.user)
        return Response({'marked_count': count})
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """GET /notifications/recent/ - Get 5 most recent notifications"""
        notifications = NotificationService.get_recent_notifications(
            request.user, limit=5
        )
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
