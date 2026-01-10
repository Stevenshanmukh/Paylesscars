BEGIN;

    INSERT INTO accounts_customuser (id, email, password, user_type, is_active, is_verified, is_staff, is_superuser, created_at, updated_at)
    VALUES (gen_random_uuid(), 'buyer@test.com', 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=', 'buyer', true, true, false, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET 
        password = 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=',
        user_type = 'buyer',
        is_staff = false,
        is_superuser = false,
        is_active = true,
        is_verified = true;
    
    INSERT INTO accounts_customuser (id, email, password, user_type, is_active, is_verified, is_staff, is_superuser, created_at, updated_at)
    VALUES (gen_random_uuid(), 'dealer@test.com', 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=', 'dealer', true, true, false, false, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET 
        password = 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=',
        user_type = 'dealer',
        is_staff = false,
        is_superuser = false,
        is_active = true,
        is_verified = true;
    
    INSERT INTO accounts_customuser (id, email, password, user_type, is_active, is_verified, is_staff, is_superuser, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin@test.com', 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=', 'admin', true, true, true, true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET 
        password = 'pbkdf2_sha256$1000000$pS5JGdMn7LMHtIrX5ftgaC$+BkSTmjJyAyy5dnWb/31TJ5oc9DajPSJfL1KKYdlccs=',
        user_type = 'admin',
        is_staff = true,
        is_superuser = true,
        is_active = true,
        is_verified = true;
    COMMIT;
