"""
Django admin configuration for dealers app.
"""
from django.contrib import admin

from .models import Dealer, DealerDocument


class DealerDocumentInline(admin.TabularInline):
    model = DealerDocument
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'user', 'city', 'state',
        'verification_status', 'created_at'
    ]
    list_filter = ['verification_status', 'state']
    search_fields = ['business_name', 'user__email', 'license_number']
    readonly_fields = ['created_at', 'updated_at', 'verified_at']
    inlines = [DealerDocumentInline]
    
    fieldsets = (
        ('Business Info', {
            'fields': ('user', 'business_name', 'license_number', 'tax_id', 'phone', 'website')
        }),
        ('Address', {
            'fields': ('street_address', 'city', 'state', 'zip_code', 'latitude', 'longitude')
        }),
        ('Verification', {
            'fields': ('verification_status', 'verified_at', 'verification_notes')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DealerDocument)
class DealerDocumentAdmin(admin.ModelAdmin):
    list_display = ['dealer', 'document_type', 'is_verified', 'created_at']
    list_filter = ['document_type', 'is_verified']
    search_fields = ['dealer__business_name']
