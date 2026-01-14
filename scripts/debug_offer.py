import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/db.sqlite3'))
os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.vehicles.models import Vehicle
from apps.negotiations.serializers import CreateNegotiationSerializer

def debug():
    count = Vehicle.objects.count()
    print(f"Total Vehicles: {count}")
    
    target_vehicle = None
    
    print("Listing ALL Vehicles (regardless of status):")
    pending_vehicle = None
    
    with open('debug_results.txt', 'w') as f:
        f.write("Vehicle Dump:\n")
        for v in Vehicle.objects.all():
            info = f"- {v.year} {v.make} {v.model} (ID: {v.id}) Status: {v.status} Price: {v.asking_price}"
            print(info)
            f.write(info + "\n")
            
            if v.status == 'pending_sale' and not pending_vehicle:
                pending_vehicle = v

        if pending_vehicle:
            f.write(f"\nCaught 'pending_sale' vehicle: {pending_vehicle.make} {pending_vehicle.model}\n")
            data_pending = {
                'vehicle_id': str(pending_vehicle.id),
                'initial_amount': float(pending_vehicle.asking_price),
                'message': "Offer on pending vehicle"
            }
            f.write(f"Testing offer on pending vehicle ({pending_vehicle.id})...\n")
            serializer_pending = CreateNegotiationSerializer(data=data_pending)
            f.write(f"Is Valid: {serializer_pending.is_valid()}\n")
            if not serializer_pending.is_valid():
                f.write(f"Errors: {serializer_pending.errors}\n")
        else:
            f.write("\nNo 'pending_sale' vehicles found in database.\n")
            
            # Create a dummy pending vehicle for testing if none exists
            # (Only if we want to force verify the code path, but easier to just report)
            pass

if __name__ == "__main__":
    debug()
