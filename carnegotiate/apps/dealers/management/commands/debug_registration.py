from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.dealers.serializers import DealerRegistrationSerializer
from apps.dealers.services import DealerService

class Command(BaseCommand):
    help = 'Debug dealer registration'

    def handle(self, *args, **options):
        User = get_user_model()
        email = 'debug_user@test.com'
        
        # Cleanup
        User.objects.filter(email=email).delete()
        
        user = User.objects.create_user(
            email=email,
            password='Password123!',
        )
        
        data = {
            'business_name': 'Debug Auto Sales',
            'license_number': 'DBG-12345',
            'phone': '(555) 123-4567',
            'street_address': '123 Debug St',
            'city': 'Test City',
            'state': 'CA',
            'zip_code': '90210',
            # 'tax_id': '', # Frontend sends empty or missing? Frontend sends: zip_code... but no tax_id.
            'website': 'https://example.com',
            'description': 'Test description'
        }
        
        self.stdout.write("Validating serializer...")
        serializer = DealerRegistrationSerializer(data=data)
        if serializer.is_valid():
            self.stdout.write(self.style.SUCCESS("Serializer is valid"))
            try:
                self.stdout.write("Attempting registration service...")
                dealer = DealerService.register_dealer(user=user, **serializer.validated_data)
                self.stdout.write(self.style.SUCCESS(f"Dealer created: {dealer}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Service error: {e}"))
        else:
            self.stdout.write(self.style.ERROR(f"Serializer errors: {serializer.errors}"))
