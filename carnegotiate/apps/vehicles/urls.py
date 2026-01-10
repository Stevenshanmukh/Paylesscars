"""URL configuration for vehicles app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'', views.VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('', include(router.urls)),
]
