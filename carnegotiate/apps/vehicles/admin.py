"""
Django admin configuration for vehicles app.
"""
from django.contrib import admin

from .models import Vehicle, VehicleImage


class VehicleImageInline(admin.TabularInline):
    model = VehicleImage
    extra = 1
    readonly_fields = ['created_at']


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = [
        'vin', 'make', 'model', 'year', 'asking_price',
        'status', 'dealer', 'created_at'
    ]
    list_filter = ['status', 'body_type', 'make', 'year']
    search_fields = ['vin', 'make', 'model', 'dealer__business_name']
    readonly_fields = ['created_at', 'updated_at', 'views_count']
    inlines = [VehicleImageInline]
    
    fieldsets = (
        ('Identification', {
            'fields': ('dealer', 'vin', 'stock_number')
        }),
        ('Vehicle Details', {
            'fields': ('make', 'model', 'year', 'trim', 'body_type', 'exterior_color', 'interior_color')
        }),
        ('Pricing', {
            'fields': ('msrp', 'floor_price', 'asking_price')
        }),
        ('Specifications', {
            'fields': ('specifications', 'features'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'views_count')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(VehicleImage)
class VehicleImageAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'is_primary', 'display_order', 'created_at']
    list_filter = ['is_primary']
    search_fields = ['vehicle__vin', 'vehicle__make', 'vehicle__model']
