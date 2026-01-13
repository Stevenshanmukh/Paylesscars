import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import CustomUser

print("\n" + "="*70)
print("ALL USER ACCOUNTS IN DATABASE")
print("="*70)

users = CustomUser.objects.all().order_by('user_type', 'email')

for u in users:
    print(f"\nEmail: {u.email}")
    print(f"  Type: {u.user_type}")
    print(f"  Staff: {u.is_staff} | Superuser: {u.is_superuser}")
    print(f"  Active: {u.is_active} | Verified: {getattr(u, 'is_verified', 'N/A')}")

print("\n" + "="*70)
print(f"TOTAL USERS: {users.count()}")
print("="*70)
