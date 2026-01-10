"""
Management command to create sample data for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        from apps.accounts.models import UserProfile
        from apps.dealers.models import Dealer
        from apps.vehicles.models import Vehicle
        from apps.negotiations.models import Negotiation, Offer
        from apps.notifications.models import Notification
        
        self.stdout.write('Creating sample data...\n')
        
        # Create superuser if not exists
        if not User.objects.filter(email='admin@carnegotiate.com').exists():
            admin = User.objects.create_superuser(
                email='admin@carnegotiate.com',
                password='admin123456',
            )
            UserProfile.objects.create(
                user=admin,
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS('Created superuser: admin@carnegotiate.com'))
        else:
            admin = User.objects.get(email='admin@carnegotiate.com')
            self.stdout.write('Superuser already exists')
        
        # Create sample dealers (using correct field names from Dealer model)
        dealers_data = [
            {
                'email': 'dealer1@premierauto.com',
                'password': 'dealer123456',
                'first_name': 'John',
                'last_name': 'Smith',
                'business_name': 'Premier Auto Sales',
                'phone': '(555) 123-4567',
                'license_number': 'DLR-001',
                'tax_id': '12-3456789',
                'street_address': '123 Auto Drive',
                'city': 'Los Angeles',
                'state': 'CA',
                'zip_code': '90210',
            },
            {
                'email': 'dealer2@luxurycars.com',
                'password': 'dealer123456',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'business_name': 'Luxury Cars LLC',
                'phone': '(555) 987-6543',
                'license_number': 'DLR-002',
                'tax_id': '98-7654321',
                'street_address': '456 Premium Blvd',
                'city': 'Beverly Hills',
                'state': 'CA',
                'zip_code': '90211',
            },
        ]
        
        dealers = []
        for data in dealers_data:
            email = data.pop('email')
            password = data.pop('password')
            first_name = data.pop('first_name')
            last_name = data.pop('last_name')
            
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    user_type='dealer'
                )
                UserProfile.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name
                )
                dealer = Dealer.objects.create(
                    user=user,
                    verification_status=Dealer.VerificationStatus.VERIFIED,
                    verified_at=timezone.now(),
                    **data
                )
                dealers.append(dealer)
                self.stdout.write(self.style.SUCCESS(f'Created dealer: {email}'))
            else:
                user = User.objects.get(email=email)
                if hasattr(user, 'dealer_profile'):
                    dealers.append(user.dealer_profile)
                self.stdout.write(f'Dealer already exists: {email}')
        
        # Create sample buyers
        buyers_data = [
            {'email': 'buyer1@email.com', 'first_name': 'Mike', 'last_name': 'Wilson'},
            {'email': 'buyer2@email.com', 'first_name': 'Emily', 'last_name': 'Davis'},
            {'email': 'buyer3@email.com', 'first_name': 'David', 'last_name': 'Brown'},
        ]
        
        buyers = []
        for data in buyers_data:
            if not User.objects.filter(email=data['email']).exists():
                user = User.objects.create_user(
                    email=data['email'],
                    password='buyer123456',
                    user_type='buyer'
                )
                UserProfile.objects.create(
                    user=user,
                    first_name=data['first_name'],
                    last_name=data['last_name']
                )
                buyers.append(user)
                self.stdout.write(self.style.SUCCESS(f'Created buyer: {data["email"]}'))
            else:
                buyers.append(User.objects.get(email=data['email']))
                self.stdout.write(f'Buyer already exists: {data["email"]}')
        
        # Create sample vehicles (matching actual Vehicle model fields)
        vehicles_data = [
            {'make': 'Toyota', 'model': 'Camry', 'year': 2024, 'trim': 'XSE', 'msrp': Decimal('35000'), 'asking_price': Decimal('32500'), 'exterior_color': 'White', 'interior_color': 'Black', 'body_type': 'sedan'},
            {'make': 'Honda', 'model': 'Accord', 'year': 2024, 'trim': 'Touring', 'msrp': Decimal('42000'), 'asking_price': Decimal('38000'), 'exterior_color': 'Black', 'interior_color': 'Gray', 'body_type': 'sedan'},
            {'make': 'BMW', 'model': 'X5', 'year': 2024, 'trim': 'xDrive40i', 'msrp': Decimal('72000'), 'asking_price': Decimal('65000'), 'exterior_color': 'Silver', 'interior_color': 'Beige', 'body_type': 'suv'},
            {'make': 'Mercedes-Benz', 'model': 'GLC', 'year': 2025, 'trim': '300', 'msrp': Decimal('58000'), 'asking_price': Decimal('52000'), 'exterior_color': 'Blue', 'interior_color': 'Black', 'body_type': 'suv'},
            {'make': 'Ford', 'model': 'F-150', 'year': 2024, 'trim': 'Lariat', 'msrp': Decimal('65000'), 'asking_price': Decimal('58000'), 'exterior_color': 'Red', 'interior_color': 'Gray', 'body_type': 'truck'},
            {'make': 'Tesla', 'model': 'Model 3', 'year': 2024, 'trim': 'Long Range', 'msrp': Decimal('50000'), 'asking_price': Decimal('45000'), 'exterior_color': 'White', 'interior_color': 'White', 'body_type': 'sedan'},
            {'make': 'Lexus', 'model': 'RX', 'year': 2024, 'trim': '350', 'msrp': Decimal('62000'), 'asking_price': Decimal('55000'), 'exterior_color': 'Gray', 'interior_color': 'Brown', 'body_type': 'suv'},
            {'make': 'Audi', 'model': 'A4', 'year': 2024, 'trim': 'Premium Plus', 'msrp': Decimal('54000'), 'asking_price': Decimal('48000'), 'exterior_color': 'Black', 'interior_color': 'Black', 'body_type': 'sedan'},
        ]
        
        vehicles = []
        for i, data in enumerate(vehicles_data):
            vin = f'1HGBH41JXMN{100000 + i}'
            if not Vehicle.objects.filter(vin=vin).exists():
                dealer = dealers[i % len(dealers)] if dealers else None
                if dealer:
                    vehicle = Vehicle.objects.create(
                        dealer=dealer,
                        vin=vin,
                        stock_number=f'STK-{1000 + i}',
                        floor_price=data['asking_price'] * Decimal('0.90'),  # Floor price is 90% of asking
                        status=Vehicle.Status.ACTIVE,
                        specifications={
                            'mileage': 5000 + (i * 1000),
                            'transmission': 'Automatic',
                            'drivetrain': 'AWD',
                            'fuel_type': 'Gasoline',
                            'engine': '2.0L Turbo',
                            'mpg_city': 25,
                            'mpg_highway': 32,
                        },
                        features=['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera', 'Bluetooth'],
                        **data
                    )
                    vehicles.append(vehicle)
                    self.stdout.write(self.style.SUCCESS(f'Created vehicle: {data["year"]} {data["make"]} {data["model"]}'))
            else:
                vehicles.append(Vehicle.objects.get(vin=vin))
                self.stdout.write(f'Vehicle already exists: VIN {vin}')
        
        # Create sample negotiations
        if vehicles and buyers:
            negotiations_created = 0
            for i, vehicle in enumerate(vehicles[:4]):
                buyer = buyers[i % len(buyers)]
                
                if not Negotiation.objects.filter(buyer=buyer, vehicle=vehicle).exists():
                    # Create negotiation
                    negotiation = Negotiation.objects.create(
                        buyer=buyer,
                        vehicle=vehicle,
                        status=Negotiation.Status.ACTIVE,
                        expires_at=timezone.now() + timedelta(hours=72)
                    )
                    
                    # Create initial offer
                    initial_offer = vehicle.asking_price * Decimal(str(random.uniform(0.85, 0.95)))
                    Offer.objects.create(
                        negotiation=negotiation,
                        amount=initial_offer.quantize(Decimal('0.01')),
                        offered_by=Offer.OfferedBy.BUYER,
                        message=f"I'm interested in this {vehicle.year} {vehicle.make} {vehicle.model}. Would you consider this offer?",
                        status=Offer.Status.PENDING
                    )
                    
                    negotiations_created += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'Created negotiation: {buyer.email} -> {vehicle.year} {vehicle.make} {vehicle.model}'
                    ))
            
            self.stdout.write(f'Created {negotiations_created} negotiations')
        
        # Create sample notifications
        if dealers:
            for dealer in dealers:
                if not Notification.objects.filter(user=dealer.user).exists():
                    Notification.objects.create(
                        user=dealer.user,
                        notification_type=Notification.NotificationType.OFFER_RECEIVED,
                        title='New offer received!',
                        message='You have received a new offer on one of your vehicles.',
                        data={}
                    )
                    self.stdout.write(self.style.SUCCESS(f'Created notification for {dealer.user.email}'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Sample data created successfully!'))
        self.stdout.write('\nTest accounts:')
        self.stdout.write('  Admin: admin@carnegotiate.com / admin123456')
        self.stdout.write('  Dealer: dealer1@premierauto.com / dealer123456')
        self.stdout.write('  Dealer: dealer2@luxurycars.com / dealer123456')
        self.stdout.write('  Buyer: buyer1@email.com / buyer123456')
        self.stdout.write('  Buyer: buyer2@email.com / buyer123456')
        self.stdout.write('  Buyer: buyer3@email.com / buyer123456')
