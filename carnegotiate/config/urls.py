"""
URL configuration for CarNegotiate project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from core.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/v1/health/', health_check, name='health-check'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/dealers/', include('apps.dealers.urls')),
    path('api/v1/vehicles/', include('apps.vehicles.urls')),
    path('api/v1/negotiations/', include('apps.negotiations.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass
