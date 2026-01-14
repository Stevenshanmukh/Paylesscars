from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Clear test data (users, vehicles, negotiations) created by seed_test_data'

    def handle(self, *args, **options):
        self.stdout.write('Clearing test data...')

        # 1. Delete Buyer
        # This should cascade delete Negotiations because Negotiation.buyer is CASCADE
        try:
            buyer = User.objects.filter(email='buyer@test.com').first()
            if buyer:
                # Double check if we need to manually delete negotiations if CASCADE doesn't work as expected
                # or if there are other constraints.
                # Negotiation.vehicle is PROTECT, so we must delete negotiations before vehicles.
                # Deleting buyer *should* delete negotiations.
                count, _ = buyer.delete()
                self.stdout.write(f'Deleted buyer and {count} related objects')
            else:
                self.stdout.write('Buyer user not found')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error deleting buyer: {e}'))

        # 2. Delete Dealer
        # This should delete Dealer profile (CASCADE) -> Vehicles (CASCADE)
        # Vehicles can be deleted now because negotiations (PROTECTing them) are gone.
        try:
            dealer = User.objects.filter(email='dealer@test.com').first()
            if dealer:
                count, _ = dealer.delete()
                self.stdout.write(f'Deleted dealer and {count} related objects')
            else:
                self.stdout.write('Dealer user not found')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error deleting dealer: {e}'))

        self.stdout.write(self.style.SUCCESS('Successfully cleared test data'))
