"""URL configuration for negotiations app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'', views.NegotiationViewSet, basename='negotiation')

urlpatterns = [
    path('', include(router.urls)),
]
