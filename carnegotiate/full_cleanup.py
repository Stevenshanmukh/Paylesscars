
import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.negotiations.models import Negotiation, Offer
from apps.vehicles.models import Vehicle, VehicleImage, SavedVehicle

def clean_database():
    print("Starting database cleanup...")

    # 1. Delete Negotiations (and cascading Offers)
    negotiations_count = Negotiation.objects.count()
    if negotiations_count > 0:
        print(f"Deleting {negotiations_count} negotiations...")
        Negotiation.objects.all().delete()
    else:
        print("No negotiations to delete.")

    # 2. Delete Offers (just in case any orphaned ones exist, though cascade should handle implied)
    offers_count = Offer.objects.count()
    if offers_count > 0:
        print(f"Deleting {offers_count} remaining offers...")
        Offer.objects.all().delete()
    else:
        print("No remaining offers.")

    # 3. Delete SavedVehicles (before vehicles)
    saved_count = SavedVehicle.objects.count()
    if saved_count > 0:
        print(f"Deleting {saved_count} saved vehicle records...")
        SavedVehicle.objects.all().delete()
    else:
        print("No saved vehicles to delete.")

    # 4. Delete Vehicles (and cascading Images)
    # Note: Negotiation.vehicle is PROTECT, so we must delete negotiations first (done above)
    vehicles_count = Vehicle.objects.count()
    if vehicles_count > 0:
        print(f"Deleting {vehicles_count} vehicles...")
        Vehicle.objects.all().delete()
    else:
        print("No vehicles to delete.")
    
    print("-" * 30)
    print("Cleanup complete!")
    print(f"Remaining Negotiations: {Negotiation.objects.count()}")
    print(f"Remaining Vehicles: {Vehicle.objects.count()}")

if __name__ == '__main__':
    clean_database()
