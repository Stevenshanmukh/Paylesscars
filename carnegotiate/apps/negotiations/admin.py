"""
Django admin configuration for negotiations app.
"""
from django.contrib import admin

from .models import Negotiation, Offer


class OfferInline(admin.TabularInline):
    model = Offer
    extra = 0
    readonly_fields = ['created_at', 'responded_at']
    ordering = ['-created_at']


@admin.register(Negotiation)
class NegotiationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'vehicle', 'buyer', 'status',
        'accepted_price', 'expires_at', 'created_at'
    ]
    list_filter = ['status']
    search_fields = ['vehicle__vin', 'buyer__email', 'vehicle__make', 'vehicle__model']
    readonly_fields = ['created_at', 'updated_at', 'version']
    inlines = [OfferInline]
    
    fieldsets = (
        ('Parties', {
            'fields': ('vehicle', 'buyer')
        }),
        ('Status', {
            'fields': ('status', 'expires_at', 'accepted_price', 'completed_at')
        }),
        ('Metadata', {
            'fields': ('version', 'created_at', 'updated_at')
        }),
    )


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['negotiation', 'amount', 'offered_by', 'status', 'created_at']
    list_filter = ['status', 'offered_by']
    search_fields = ['negotiation__vehicle__vin', 'negotiation__buyer__email']
    readonly_fields = ['created_at', 'responded_at']
