import os
import django
import sys

# Setup Django environment just enough for hashing
from django.conf import settings
if not settings.configured:
    settings.configure(SECRET_KEY='temporary_secret_key_for_hashing')

from django.contrib.auth.hashers import make_password

password_hash = make_password('password123')

users = [
    ('buyer@test.com', 'buyer', 'false', 'false'),
    ('dealer@test.com', 'dealer', 'false', 'false'),
    ('admin@test.com', 'admin', 'true', 'true')
]

with open('users.sql', 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n")
    for email, type, staff, superuser in users:
        sql = f"""
    INSERT INTO accounts_customuser (id, email, password, user_type, is_active, is_verified, is_staff, is_superuser, created_at, updated_at)
    VALUES (gen_random_uuid(), '{email}', '{password_hash}', '{type}', true, true, {staff}, {superuser}, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET 
        password = '{password_hash}',
        user_type = '{type}',
        is_staff = {staff},
        is_superuser = {superuser},
        is_active = true,
        is_verified = true;
    """
        f.write(sql)
    f.write("COMMIT;\n")

