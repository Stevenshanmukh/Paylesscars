import os
import django
from django.db.models import Count

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.vehicles.models import Vehicle

def cleanup_duplicates():
    # Group by make, model, year
    duplicates = Vehicle.objects.values('make', 'model', 'year').annotate(count=Count('id')).filter(count__gt=1)
    
    deleted_count = 0
    merged_count = 0
    
    print(f"Processing {duplicates.count()} sets of duplicates...")
    for d in duplicates:
        print(f"\nEvaluating: {d['year']} {d['make']} {d['model']}")
        
        vehicles = list(Vehicle.objects.filter(
            make=d['make'], 
            model=d['model'], 
            year=d['year']
        ).order_by('-created_at')) # Newest first
        
        if not vehicles:
            continue

        # MERGE STRATEGY:
        # 1. Identify "Kept" vehicle (Active/Pending status moves up, then most negotiations, then newest)
        
        # Sort vehicles to find the best one to keep
        # Criteria: 1. Status is pending_sale/sold (priority), 2. Num negotiations, 3. Newest
        def sort_key(v):
            status_score = 0
            if v.status == 'sold': status_score = 10
            elif v.status == 'pending_sale': status_score = 5
            elif v.status == 'active': status_score = 1
            
            return (status_score, v.negotiations.count(), v.created_at.timestamp())

        # Sort descending (best first)
        sorted_vehicles = sorted(vehicles, key=sort_key, reverse=True)
        keep_v = sorted_vehicles[0]
        
        print(f"  Keeping ID: {keep_v.id} (Status: {keep_v.status}, Negs: {keep_v.negotiations.count()})")
        
        duplicates_list = [v for v in vehicles if v.id != keep_v.id]
        
        for dup in duplicates_list:
            print(f"  Processing duplicate {dup.id} (Status: {dup.status}, Negs: {dup.negotiations.count()})")
            
            # Move negotiations to kept vehicle
            for neg in dup.negotiations.all():
                # Check for constraint violation: Active negotiation from same buyer on kept vehicle?
                if neg.status == 'active':
                    conflict = keep_v.negotiations.filter(buyer=neg.buyer, status='active').exists()
                    if conflict:
                        print(f"    - Skipping active negotiation merge due to conflict (Buyer {neg.buyer_id})")
                        # If duplicate has active negotiation that conflicts, we might have to cancel it or delete it?
                        # Let's cancel it
                        neg.status = 'cancelled'
                        neg.save()
                        print(f"    - Cancelled conflicting negotiation {neg.id}")
                
                # Move it
                try:
                    neg.vehicle = keep_v
                    neg.save()
                    print(f"    - Moved negotiation {neg.id} to kept vehicle")
                    merged_count += 1
                except Exception as e:
                    print(f"    - Failed to move negotiation {neg.id}: {e}")
            
            # Now delete the duplicate vehicle
            try:
                # Refresh ID just in case? No need.
                dup_id = dup.id
                dup.delete()
                print(f"  - Deleted duplicate vehicle {dup_id}")
                deleted_count += 1
            except Exception as e:
                print(f"  - Failed to delete vehicle {dup.id}: {e}")

    print(f"\nCleanup complete. Merged {merged_count} negotiations. Deleted {deleted_count} duplicate vehicles.")

if __name__ == '__main__':
    cleanup_duplicates()
