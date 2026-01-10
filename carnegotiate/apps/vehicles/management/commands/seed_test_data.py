import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.dealers.models import Dealer
from apps.vehicles.models import Vehicle, VehicleImage
from apps.negotiations.models import Negotiation, Offer

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with test data for verified dealer and negotiations'

    def handle(self, *args, **options):
        self.stdout.write('Seeding test data...')

        # 1. Create Test Users
        buyer_email = 'buyer@test.com'
        dealer_email = 'dealer@test.com'
        
        buyer, created = User.objects.get_or_create(
            email=buyer_email,
            defaults={
                'is_active': True,
                'is_verified': True,
                'user_type': 'buyer'
            }
        )
        # Always ensure test user has correct password and is active
        buyer.set_password('pass1234')
        buyer.is_active = True
        buyer.save()
        
        if created:
            # Create profile
            if not hasattr(buyer, 'profile'):
                from apps.accounts.models import UserProfile
                UserProfile.objects.create(
                    user=buyer,
                    first_name='John',
                    last_name='Buyer',
                    city='Austin',
                    state='TX'
                )
            self.stdout.write(f'Created buyer: {buyer_email}')
        else:
             self.stdout.write(f'Updated buyer: {buyer_email}')

        dealer_user, created = User.objects.get_or_create(
            email=dealer_email,
            defaults={
                'is_active': True,
                'is_verified': True,
                'user_type': 'dealer'
            }
        )
        # Always ensure test user has correct password and is active
        dealer_user.set_password('pass1234')
        dealer_user.is_active = True
        dealer_user.save()

        if created:
            if not hasattr(dealer_user, 'profile'):
                from apps.accounts.models import UserProfile
                UserProfile.objects.create(
                    user=dealer_user,
                    first_name='Mike',
                    last_name='Dealer',
                    city='Austin',
                    state='TX'
                )
            self.stdout.write(f'Created dealer user: {dealer_email}')
        else:
            self.stdout.write(f'Updated dealer user: {dealer_email}')

        # 2. Create Verified Dealer Profile
        dealer_profile, created = Dealer.objects.get_or_create(
            user=dealer_user,
            defaults={
                'business_name': 'Prestige Autos Austin',
                'license_number': 'TX-12345678',
                'tax_id': '12-3456789',
                'phone': '(512) 555-0199',
                'street_address': '123 Car Row',
                'city': 'Austin',
                'state': 'TX',
                'zip_code': '78701',
                'verification_status': 'verified',
                'verified_at': timezone.now()
            }
        )
        if created:
            self.stdout.write(f'Created dealer profile: {dealer_profile.business_name}')

        # 3. Create Vehicles
        # We need some dummy images or placeholders
        placeholder_images = [
            'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80', # Accord
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80', # Camry
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80', # Generic Sport
            'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', # Red Car
        ]

        vehicles_data = [
            {
                'make': 'Honda',
                'model': 'Accord',
                'year': 2024,
                'trim': 'Sport',
                'body_type': 'sedan',
                'msrp': 32900,
                'asking_price': 31500,
                'exterior_color': 'Platinum White',
                'interior_color': 'Black',
                'vin': '1HG12345678900001',
                'stock_number': 'STK-001'
            },
            {
                'make': 'Toyota',
                'model': 'Camry',
                'year': 2024,
                'trim': 'SE',
                'body_type': 'sedan',
                'msrp': 31500,
                'asking_price': 29900,
                'exterior_color': 'Midnight Black',
                'interior_color': 'Black',
                'vin': '4T112345678900002',
                'stock_number': 'STK-002'
            },
            {
                'make': 'Ford',
                'model': 'F-150',
                'year': 2023,
                'trim': 'XLT',
                'body_type': 'truck',
                'msrp': 58000,
                'asking_price': 54500,
                'exterior_color': 'Carbonized Gray',
                'interior_color': 'Gray',
                'vin': '1FT12345678900003',
                'stock_number': 'STK-003'
            },
            {
                'make': 'Tesla',
                'model': 'Model 3',
                'year': 2024,
                'trim': 'Long Range',
                'body_type': 'sedan',
                'msrp': 47990,
                'asking_price': 46500,
                'exterior_color': 'Stealth Grey',
                'interior_color': 'Black',
                'vin': '5YJ12345678900004',
                'stock_number': 'STK-004'
            },
             {
                'make': 'BMW',
                'model': 'X5',
                'year': 2024,
                'trim': 'xDrive40i',
                'body_type': 'suv',
                'msrp': 67500,
                'asking_price': 65900,
                'exterior_color': 'Alpine White',
                'interior_color': 'Cognac',
                'vin': '5UX12345678900005',
                'stock_number': 'STK-005'
            },
        ]

        created_vehicles = []
        for v_data in vehicles_data:
            vehicle, created = Vehicle.objects.get_or_create(
                vin=v_data['vin'],
                defaults={
                    'dealer': dealer_profile,
                    'status': 'active',
                    'floor_price': Decimal(v_data['asking_price']) * Decimal('0.9'), # 10% room
                    **v_data
                }
            )
            if created:
                # Add specifications
                vehicle.specifications = {
                    'mileage': random.randint(0, 50),
                    'transmission': 'Automatic',
                    'fuel_type': 'Gasoline' if v_data['make'] != 'Tesla' else 'Electric',
                    'drivetrain': 'FWD'
                }
                vehicle.save()
                
                # Add dummy image
                from django.core.files.base import ContentFile
                
                # 1x1 transparent gif
                dummy_image_content = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
                
                VehicleImage.objects.create(
                    vehicle=vehicle,
                    image=ContentFile(dummy_image_content, name=f'vehicle_{vehicle.id}.gif'),
                    is_primary=True,
                    display_order=0,
                    large_url=placeholder_images[len(created_vehicles) % len(placeholder_images)] # Use external URL for display
                )
            
            created_vehicles.append(vehicle)
        
        self.stdout.write(f'Created {len(created_vehicles)} vehicles')

        # 4. Create Negotiations
        # Active negotiation
        active_vehicle = created_vehicles[0]
        neg, created = Negotiation.objects.get_or_create(
            vehicle=active_vehicle,
            buyer=buyer,
            defaults={
                'status': 'active',
                'expires_at': timezone.now() + timedelta(days=2)
            }
        )
        if created:
            # Buyer offers
            Offer.objects.create(
                negotiation=neg,
                amount=active_vehicle.asking_price - 2000,
                offered_by='buyer',
                status='pending'
            )
            self.stdout.write(f'Created active negotiation for {active_vehicle}')

        # Accepted negotiation
        accepted_vehicle = created_vehicles[1]
        neg_acc, created = Negotiation.objects.get_or_create(
            vehicle=accepted_vehicle,
            buyer=buyer,
            defaults={
                'status': 'accepted',
                'expires_at': timezone.now() + timedelta(days=1),
                'accepted_price': accepted_vehicle.asking_price - 500,
                'completed_at': timezone.now()
            }
        )
        if created:
             Offer.objects.create(
                negotiation=neg_acc,
                amount=accepted_vehicle.asking_price - 500,
                offered_by='dealer',
                status='accepted'
            )
             self.stdout.write(f'Created accepted negotiation for {accepted_vehicle}')

        # 5. Create Saved Vehicles
        from apps.vehicles.models import SavedVehicle
        # Save the first 3 vehicles for the buyer
        for vehicle in created_vehicles[:3]:
            SavedVehicle.objects.get_or_create(
                user=buyer,
                vehicle=vehicle
            )
        self.stdout.write(f'Created saved vehicles for buyer')

        self.stdout.write(self.style.SUCCESS('Successfully seeded test data'))
