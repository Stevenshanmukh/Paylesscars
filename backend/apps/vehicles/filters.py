"""
Vehicle FilterSet for CarNegotiate API.
"""
import django_filters

from .models import Vehicle


class VehicleFilterSet(django_filters.FilterSet):
    """
    FilterSet for vehicle search and filtering.
    """
    # Text filters
    make = django_filters.CharFilter(lookup_expr='iexact')
    model = django_filters.CharFilter(lookup_expr='icontains')
    
    # Range filters
    year_min = django_filters.NumberFilter(field_name='year', lookup_expr='gte')
    year_max = django_filters.NumberFilter(field_name='year', lookup_expr='lte')
    price_min = django_filters.NumberFilter(field_name='asking_price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='asking_price', lookup_expr='lte')
    mileage_max = django_filters.NumberFilter(field_name='mileage', lookup_expr='lte')
    
    # Choice filters
    body_type = django_filters.CharFilter(lookup_expr='iexact')
    fuel_type = django_filters.CharFilter(lookup_expr='iexact')
    transmission = django_filters.CharFilter(lookup_expr='iexact')
    drivetrain = django_filters.CharFilter(lookup_expr='iexact')
    exterior_color = django_filters.CharFilter(lookup_expr='iexact')
    
    # Boolean filters
    is_negotiable = django_filters.BooleanFilter(method='filter_negotiable')
    
    # Dealer filter
    dealer = django_filters.UUIDFilter(field_name='dealer__id')
    
    # Location filters (via dealer)
    city = django_filters.CharFilter(field_name='dealer__city', lookup_expr='iexact')
    state = django_filters.CharFilter(field_name='dealer__state', lookup_expr='iexact')
    
    # Sorting
    ordering = django_filters.OrderingFilter(
        fields=(
            ('asking_price', 'price'),
            ('year', 'year'),
            ('mileage', 'mileage'),
            ('created_at', 'date'),
        ),
        field_labels={
            'asking_price': 'Price',
            'year': 'Year',
            'mileage': 'Mileage',
            'created_at': 'Date Listed',
        }
    )
    
    class Meta:
        model = Vehicle
        fields = [
            'make', 'model', 'year_min', 'year_max',
            'price_min', 'price_max', 'mileage_max',
            'body_type', 'fuel_type', 'transmission', 'drivetrain',
            'exterior_color', 'dealer', 'city', 'state'
        ]
    
    def filter_negotiable(self, queryset, name, value):
        """
        Filter for negotiable vehicles.
        A vehicle is considered negotiable if floor_price < asking_price.
        """
        if value:
            return queryset.filter(floor_price__lt=models.F('asking_price'))
        return queryset


# Import models at end
from django.db import models
