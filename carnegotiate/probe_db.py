
import psycopg2
import sys
import os

def probe(port):
    print(f"--- Probing port {port} ---")
    try:
        conn = psycopg2.connect(
            dbname='carnegotiate',
            user='postgres',
            password='postgres',
            host='127.0.0.1',
            port=port
        )
        print(f"SUCCESS: Connected to port {port}")
        conn.close()
        return True
    except Exception as e:
        print(f"FAIL: Port {port} error: {e}")
        return False

success_5433 = probe(5433)
success_5432 = probe(5432)

if success_5433 or success_5432:
    print("At least one connection succeeded.")
    # Attempt password reset if success
    port = 5433 if success_5433 else 5432
    print(f"Attempting password reset using port {port}...")
    
    os.environ['DATABASE_URL'] = f'postgres://postgres:postgres@127.0.0.1:{port}/carnegotiate'
    
    import django
    from django.conf import settings
    
    # Configure settings manually if needed, or rely on manage.py environment
    # We are running this via manage.py shell usually, so settings are loaded.
    # But wait, if we run via python direct, we need setup.
    # Let's run this script via `manage.py shell < probe_db.py` or similar? 
    # Or just standalone if we setup django.
    
    # We will assume this is triggering via `shell` or we can try to setup.
    # Setup:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        django.setup()
        from django.contrib.auth import get_user_model
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
                print(f"Reset password for {email}")
            except User.DoesNotExist:
                print(f"User {email} not found")
        print("Password reset complete.")
    except Exception as e:
        print(f"Django setup/reset failed: {e}")

else:
    print("All connection attempts failed.")

