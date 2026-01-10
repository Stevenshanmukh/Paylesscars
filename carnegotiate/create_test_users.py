import os
import django

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import CustomUser

User = get_user_model()

users_to_create = [
    {
        'email': 'buyer@test.com',
        'password': 'password123',
        'user_type': CustomUser.UserType.BUYER,
        'is_staff': False,
        'is_superuser': False
    },
    {
        'email': 'dealer@test.com',
        'password': 'password123',
        'user_type': CustomUser.UserType.DEALER,
        'is_staff': False,
        'is_superuser': False
    },
    {
        'email': 'admin@test.com',
        'password': 'password123',
        'user_type': CustomUser.UserType.ADMIN,
        'is_staff': True,
        'is_superuser': True
    }
]

print("Creating/Updating Test Users...")
print("-" * 50)

for user_data in users_to_create:
    email = user_data['email']
    password = user_data['password']
    
    try:
        user, created = User.objects.get_or_create(email=email)
        
        user.set_password(password)
        user.user_type = user_data['user_type']
        user.is_staff = user_data['is_staff']
        user.is_superuser = user_data['is_superuser']
        user.is_active = True
        user.is_verified = True
        user.save()
        
        action = "Created" if created else "Updated"
        print(f"[{action}] {user.user_type.upper()}: {email} (Password: {password})")
        
    except Exception as e:
        print(f"[ERROR] Failed to process {email}: {str(e)}")

print("-" * 50)
print("Done.")
