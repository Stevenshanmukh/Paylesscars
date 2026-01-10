from django.contrib.auth import get_user_model
from django.db import transaction
from apps.vehicles.models import Vehicle
from apps.negotiations.models import Negotiation

User = get_user_model()
EMAILS_TO_DELETE = ['dealer_repro@example.com', 'buyer_repro@example.com']

def run():
    print("--- STARTING CLEANUP ---")
    with transaction.atomic():
        for email in EMAILS_TO_DELETE:
            try:
                user = User.objects.get(email=email)
                print(f"\nProcessing User: {user.email} (Type: {user.user_type})")
                
                # Check for related data
                if user.user_type == 'dealer':
                    # Dealer's vehicles
                    if hasattr(user, 'dealer_profile'):
                        vehicles = Vehicle.objects.filter(dealer=user.dealer_profile)
                        v_count = vehicles.count()
                        print(f"- Deleting {v_count} vehicles (including Ghost Vehicle 'TestMake')...")
                        vehicles.delete()
                
                if user.user_type == 'buyer':
                    # Buyer's negotiations
                    negotiations = Negotiation.objects.filter(buyer=user)
                    n_count = negotiations.count()
                    print(f"- Deleting {n_count} negotiations as buyer...")
                    negotiations.delete()
                
                # Negotiations where dealer is participant (indirectly deleted via vehicle delete usually, but check)
                
                # Delete User (cascades to Profile)
                print(f"- Deleting User account...")
                user.delete()
                print("✓ Deleted successfully")
                
            except User.DoesNotExist:
                print(f"\nUser {email} not found. Skipping.")
            except Exception as e:
                print(f"Error deleting {email}: {e}")

if __name__ == '__main__':
    run()
