"""
Notification Serializers for CarNegotiate API.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    time_ago = serializers.SerializerMethodField()
    action_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'type_display', 'title',
            'message', 'data', 'is_read', 'read_at',
            'created_at', 'time_ago', 'action_url'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time ago string."""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        else:
            return obj.created_at.strftime("%b %d")
    
    def get_action_url(self, obj):
        """Get URL for notification action."""
        data = obj.data or {}
        
        if 'negotiation_id' in data:
            return f"/negotiations/{data['negotiation_id']}"
        elif 'vehicle_id' in data:
            return f"/vehicles/{data['vehicle_id']}"
        elif 'dealer_id' in data:
            return f"/dealer"
        
        return None


class NotificationPreferencesSerializer(serializers.Serializer):
    """Serializer for notification preferences."""
    email_offers = serializers.BooleanField(default=True)
    email_counter_offers = serializers.BooleanField(default=True)
    email_accepted = serializers.BooleanField(default=True)
    email_expiring = serializers.BooleanField(default=True)
    email_daily_digest = serializers.BooleanField(default=False)
    push_enabled = serializers.BooleanField(default=True)
