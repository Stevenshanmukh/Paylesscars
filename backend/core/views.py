from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify backend is running.
    GET /api/v1/health/
    """
    # Check database connection
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception as e:
        db_ok = False

    return Response({
        'status': 'ok' if db_ok else 'degraded',
        'service': 'carnegotiate-api',
        'database': 'connected' if db_ok else 'error',
        'version': '1.0.0',
    })
