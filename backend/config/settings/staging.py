"""
Django staging settings for CarNegotiate project.
"""
from .production import *  # noqa: F401, F403

# Staging-specific overrides
# Use same security settings as production but may have different hosts
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['staging.carnegotiate.com'])  # noqa: F405

# Can enable debug for staging troubleshooting
DEBUG = env.bool('DEBUG', default=False)  # noqa: F405

# Less strict HSTS for staging
SECURE_HSTS_SECONDS = 3600  # 1 hour
