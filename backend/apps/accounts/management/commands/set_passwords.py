from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Reset passwords for key accounts'

    def handle(self, *args, **options):
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
                self.stdout.write(self.style.SUCCESS(f"Reset password for {email}"))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"User {email} not found"))
