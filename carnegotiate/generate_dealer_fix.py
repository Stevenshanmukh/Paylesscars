import os

# We will generate SQL to:
# 1. Get the UUID of dealer@test.com
# 2. Insert a row into dealers_dealer linked to that UUID
# 3. Ensure the dealer is "verified" so they can list cars

sql_script = """
DO $$
DECLARE
    dealer_user_id uuid;
BEGIN
    -- 1. Get User ID
    SELECT id INTO dealer_user_id FROM accounts_customuser WHERE email = 'dealer@test.com';

    IF dealer_user_id IS NULL THEN
        RAISE NOTICE 'User dealer@test.com not found!';
        RETURN;
    END IF;

    -- 2. Insert Dealer Profile if not exists
    INSERT INTO dealers_dealer (
        id, created_at, updated_at, 
        user_id, 
        business_name, 
        license_number, 
        tax_id, 
        phone, 
        street_address, 
        city, 
        state, 
        zip_code, 
        verification_status,
        website,
        latitude,
        longitude,
        verified_at,
        verification_notes
    )
    VALUES (
        gen_random_uuid(), NOW(), NOW(),
        dealer_user_id,
        'Test Dealership',
        'DL-12345-TEST',
        'TAX-98765',
        '555-0199',
        '123 Dealer Lane',
        'Test City',
        'NY',
        '10001',
        'verified',
        'https://example.com',
        0.0,
        0.0,
        NOW(),
        'Auto-verified via script'
    )
    ON CONFLICT DO NOTHING;
    
    -- 3. Update verification status if it already existed but wasn't verified
    UPDATE dealers_dealer 
    SET verification_status = 'verified' 
    WHERE user_id = dealer_user_id;

    RAISE NOTICE 'Dealer profile verified for dealer@test.com';
END $$;
"""

with open('fix_dealer_profile.sql', 'w', encoding='utf-8') as f:
    f.write(sql_script)

print("Generated fix_dealer_profile.sql")
