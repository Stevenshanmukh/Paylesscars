"""
Django admin configuration for analytics app.
"""
from django.contrib import admin

from .models import DealerMetrics, VehicleView


@admin.register(DealerMetrics)
class DealerMetricsAdmin(admin.ModelAdmin):
    list_display = [
        'dealer', 'date', 'total_vehicles', 'offers_received',
        'offers_accepted', 'conversion_rate'
    ]
    list_filter = ['date']
    search_fields = ['dealer__business_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(VehicleView)
class VehicleViewAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'user_id', 'ip_address', 'created_at']
    list_filter = ['created_at']
    search_fields = ['vehicle__vin']
    readonly_fields = ['created_at']
