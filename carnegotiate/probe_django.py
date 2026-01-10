
import os
import django
import sys
from copy import deepcopy

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from django.contrib.auth import get_user_model

def try_connect(alias='default', overrides=None):
    print(f"\n--- Testing connection: {alias} ---")
    
    # Apply overrides if any
    original_config = deepcopy(settings.DATABASES[alias])
    if overrides:
        print(f"Applying overrides: {overrides}")
        settings.DATABASES[alias].update(overrides)
    
    config = settings.DATABASES[alias]
    # Redact password for print
    safe_config = config.copy()
    if 'PASSWORD' in safe_config:
        safe_config['PASSWORD'] = '******'
    print(f"Config: {safe_config}")
    
    try:
        # Close old connection if open to force new connection params
        connections[alias].close()
        conn = connections[alias]
        conn.ensure_connection()
        print("SUCCESS: Connected!")
        return True
    except OperationalError as e:
        print(f"FAIL: OperationalError: {e}")
        return False
    except Exception as e:
        print(f"FAIL: Error: {e}")
        return False
    finally:
        # Restore config
        if overrides:
            settings.DATABASES[alias] = original_config

def reset_passwords():
    print("\nAttempting password reset...")
    User = get_user_model()
    users = {
        'buyer1@email.com': 'buyer123456',
        'dealer1@premierauto.com': 'dealer123456',
        'admin@carnegotiate.com': 'admin123456'
    }
    for email, password in users.items():
        try:
            u = User.objects.get(email=email)
            u.set_password(password)
            u.save()
            print(f"RESET: {email} -> {password}")
        except User.DoesNotExist:
            print(f"MISSING: {email}")

# 1. Try default settings
if try_connect():
    reset_passwords()
    sys.exit(0)

# 2. Try forcing 127.0.0.1 and port 5433
if try_connect(overrides={'HOST': '127.0.0.1', 'PORT': '5433'}):
    reset_passwords()
    sys.exit(0)

# 3. Try forcing 127.0.0.1 and port 5432
if try_connect(overrides={'HOST': '127.0.0.1', 'PORT': '5432'}):
    reset_passwords()
    sys.exit(0)

# 4. Try forcing localhost and 5432
if try_connect(overrides={'HOST': 'localhost', 'PORT': '5432'}):
    reset_passwords()
    sys.exit(0)

print("\nAll attempts failed.")
