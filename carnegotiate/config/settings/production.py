"""
Django production settings for CarNegotiate project.
"""
from .base import *  # noqa: F401, F403

DEBUG = False

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Use S3 for media storage in production
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Email - Use real email backend
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Logging - Production level
LOGGING['root']['level'] = 'WARNING'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'WARNING'  # noqa: F405

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 60  # noqa: F405
