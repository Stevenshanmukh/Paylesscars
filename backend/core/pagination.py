"""
Custom pagination classes for CarNegotiate API.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination with 20 items per page."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class LargeResultsSetPagination(PageNumberPagination):
    """Larger pagination for bulk operations."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class SmallResultsSetPagination(PageNumberPagination):
    """Smaller pagination for lightweight responses."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
