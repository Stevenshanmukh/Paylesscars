import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.dealers.models import Dealer
from apps.vehicles.models import Vehicle
from apps.negotiations.models import Negotiation
from apps.negotiations.services import NegotiationService
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.negotiations.views import NegotiationViewSet

User = get_user_model()

def test_dealer_acceptance():
    print("Setting up test data...")
    # Create users
    dealer_user, _ = User.objects.get_or_create(email="dealer_repro@example.com", defaults={'user_type': 'dealer'})
    buyer_user, _ = User.objects.get_or_create(email="buyer_repro@example.com", defaults={'user_type': 'buyer'})
    
    # Create dealer profile
    dealer, _ = Dealer.objects.get_or_create(user=dealer_user, defaults={'business_name': 'Test Motors'})
    
    # Create vehicle
    # Check if vehicle exists to avoid duplicates in repro runs
    import uuid
    vin = f'TESTVIN{uuid.uuid4().hex[:7].upper()}' # unique VIN
    
    vehicle = Vehicle.objects.create(
        dealer=dealer,
        vin=vin,
        make='TestMake',
        model='TestModel',
        year=2024,
        msrp=30000, 
        floor_price=28000,
        asking_price=29000,
        status='active'
    )
    
    print(f"Vehicle created: {vehicle.id}")
    
    # Create negotiation (Buyer makes offer)
    print("Buyer starting negotiation...")
    negotiation = NegotiationService.start_negotiation(
        buyer=buyer_user,
        vehicle=vehicle,
        amount=28500,
        message="I like this car"
    )
    
    print(f"Negotiation created: {negotiation.id}, Status: {negotiation.status}")
    
    # Verify it's dealer's turn
    # Need to check pending offer
    pending_offer = negotiation.offers.filter(status='pending').first()
    print(f"Pending offer by: {pending_offer.offered_by}")
    
    # Try to accept as Dealer via ViewSet (simulate API)
    print("Dealer attempting to accept via ViewSet...")
    factory = APIRequestFactory()
    view = NegotiationViewSet.as_view({'post': 'accept'})
    
    request = factory.post(f'/api/v1/negotiations/{negotiation.id}/accept/', {'confirm': True}, format='json')
    force_authenticate(request, user=dealer_user)
    
    try:
        response = view(request, pk=negotiation.id)
        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.data}")
        else:
            print("Acceptance successful!")
            negotiation.refresh_from_db()
            print(f"New Negotiation Status: {negotiation.status}")
            
            vehicle.refresh_from_db()
            print(f"New Vehicle Status: {vehicle.status}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Exception: {e}")

if __name__ == '__main__':
    try:
        test_dealer_acceptance()
    except Exception as e:
        print(f"Script failed: {e}")
