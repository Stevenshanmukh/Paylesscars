"""URL configuration for analytics app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DealerAnalyticsViewSet, PlatformAnalyticsViewSet

router = DefaultRouter()
router.register(r'dealer', DealerAnalyticsViewSet, basename='dealer-analytics')
router.register(r'platform', PlatformAnalyticsViewSet, basename='platform-analytics')

urlpatterns = [
    path('', include(router.urls)),
]
