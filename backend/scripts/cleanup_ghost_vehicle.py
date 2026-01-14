from django.db import transaction
from apps.vehicles.models import Vehicle
from apps.negotiations.models import Negotiation

def run():
    print("--- HARD DELETE SCRIPT ---")
    
    # 1. Find Vehicle
    vehicles = Vehicle.objects.filter(make__icontains="TestMake")
    print(f"Found {vehicles.count()} vehicles")
    
    for v in vehicles:
        print(f"Processing Vehicle {v.id} ({v.make} {v.model})")
        
        # 2. Find Blocking Negotiations
        negs = Negotiation.objects.filter(vehicle=v)
        print(f" - Found {negs.count()} negotiations")
        
        # 3. Delete Negotiations
        for n in negs:
            print(f"   - Deleting Negotiation {n.id} (Buyer: {n.buyer.email})")
            n.delete()
            
        # 4. Delete Vehicle
        print(f" - Deleting Vehicle {v.id}")
        v.delete()
        print("   ✓ Vehicle Deleted")
        
        # 5. Check Dealer
        dealer_user = v.dealer.user
        if 'example.com' in dealer_user.email or 'test' in dealer_user.email:
             # Only delete if it looks like a test user and not the main ones (unless requested)
             # User asked to delete repro accounts.
             if 'repro' in dealer_user.email:
                 print(f" - Deleting Dealer User {dealer_user.email}")
                 dealer_user.delete()
                 print("   ✓ User Deleted")

if __name__ == '__main__':
    run()
