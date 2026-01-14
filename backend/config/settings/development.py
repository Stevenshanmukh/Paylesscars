"""
Django development settings for CarNegotiate project.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# CORS - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - Use console backend in development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Use local file storage in development
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Debug Toolbar (optional)
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1']
except ImportError:
    pass

# Shorter token lifetime for testing
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(hours=1)  # noqa: F405
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=1)  # noqa: F405

# Logging - More verbose in development
LOGGING['root']['level'] = 'DEBUG'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'DEBUG'  # noqa: F405

# Cache - Use local memory in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Celery - Use synchronous execution in development
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache'
