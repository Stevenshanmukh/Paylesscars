"""
Test script to verify dynamic notifications are working correctly.
Run from project root: python backend/test_notifications.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from decimal import Decimal
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.vehicles.models import Vehicle
from apps.negotiations.models import Negotiation, Offer
from apps.notifications.models import Notification
from apps.negotiations.services import NegotiationService


def clear_test_data():
    """Clear notifications and negotiations for test users."""
    print("🧹 Clearing existing test data...")
    Notification.objects.all().delete()
    Negotiation.objects.filter(buyer__email='buyer1@email.com').delete()
    print("   ✓ Cleared notifications and test negotiations\n")


def test_dynamic_notifications():
    """Test that notifications are created dynamically during negotiation flow."""
    print("=" * 60)
    print("🔔 DYNAMIC NOTIFICATIONS TEST")
    print("=" * 60 + "\n")
    
    # Get test users
    try:
        buyer = CustomUser.objects.get(email='buyer1@email.com')
        dealer_user = CustomUser.objects.filter(user_type='dealer').first()
        print(f"✓ Found buyer: {buyer.email}")
        print(f"✓ Found dealer: {dealer_user.email}\n")
    except CustomUser.DoesNotExist:
        print("✗ Test users not found. Run seed script first.")
        return False
    
    # Get an active vehicle from a dealer
    vehicle = Vehicle.objects.filter(
        status='active',
        dealer__isnull=False
    ).first()
    
    if not vehicle:
        print("✗ No active vehicles found. Add some vehicles first.")
        return False
    
    print(f"✓ Using vehicle: {vehicle.year} {vehicle.make} {vehicle.model}")
    print(f"   Asking price: ${vehicle.asking_price:,.2f}")
    print(f"   Dealer: {vehicle.dealer.business_name}\n")
    
    dealer_user = vehicle.dealer.user
    
    # Clear existing test data
    clear_test_data()
    
    # Track initial notification count
    initial_count = Notification.objects.count()
    print(f"📊 Initial notification count: {initial_count}\n")
    
    # -------------------------------------------------------------------------
    # TEST 1: New Offer (should create notification for dealer)
    # -------------------------------------------------------------------------
    print("=" * 40)
    print("TEST 1: Creating new offer")
    print("=" * 40)
    
    offer_amount = Decimal(str(float(vehicle.asking_price) * 0.9))  # 90% of asking
    
    negotiation = NegotiationService.start_negotiation(
        buyer=buyer,
        vehicle=vehicle,
        amount=offer_amount,
        message="I'm interested in this vehicle!"
    )
    
    print(f"   ✓ Negotiation created: {negotiation.id}")
    print(f"   ✓ Initial offer: ${offer_amount:,.2f}")
    
    # Check for dealer notification
    dealer_notif = Notification.objects.filter(
        user=dealer_user,
        notification_type='offer_received'
    ).first()
    
    if dealer_notif:
        print(f"   ✓ NOTIFICATION CREATED for dealer: '{dealer_notif.title}'")
    else:
        print("   ✗ FAILED: No notification created for dealer")
        return False
    
    # -------------------------------------------------------------------------
    # TEST 2: Counter Offer (should create notification for buyer)
    # -------------------------------------------------------------------------
    print("\n" + "=" * 40)
    print("TEST 2: Dealer counter-offer")
    print("=" * 40)
    
    counter_amount = Decimal(str(float(vehicle.asking_price) * 0.95))  # 95% of asking
    
    counter_offer = NegotiationService.submit_offer(
        negotiation=negotiation,
        user=dealer_user,
        amount=counter_amount,
        message="I can do this price"
    )
    
    print(f"   ✓ Counter offer created: ${counter_amount:,.2f}")
    
    # Check for buyer notification
    buyer_notif = Notification.objects.filter(
        user=buyer,
        notification_type='counter_offer'
    ).first()
    
    if buyer_notif:
        print(f"   ✓ NOTIFICATION CREATED for buyer: '{buyer_notif.title}'")
    else:
        print("   ✗ FAILED: No notification created for buyer")
        return False
    
    # -------------------------------------------------------------------------
    # TEST 3: Accept Offer (should create notifications for both parties)
    # -------------------------------------------------------------------------
    print("\n" + "=" * 40)
    print("TEST 3: Buyer accepts offer")
    print("=" * 40)
    
    NegotiationService.accept_offer(negotiation=negotiation, user=buyer)
    
    print(f"   ✓ Offer accepted!")
    
    # Check for acceptance notifications
    buyer_accept_notif = Notification.objects.filter(
        user=buyer,
        notification_type='offer_accepted'
    ).first()
    
    dealer_accept_notif = Notification.objects.filter(
        user=dealer_user,
        notification_type='offer_accepted'
    ).first()
    
    if buyer_accept_notif:
        print(f"   ✓ NOTIFICATION CREATED for buyer: '{buyer_accept_notif.title}'")
    else:
        print("   ✗ FAILED: No acceptance notification for buyer")
        return False
    
    if dealer_accept_notif:
        print(f"   ✓ NOTIFICATION CREATED for dealer: '{dealer_accept_notif.title}'")
    else:
        print("   ✗ FAILED: No acceptance notification for dealer")
        return False
    
    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    final_count = Notification.objects.count()
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"   Notifications created: {final_count - initial_count}")
    print(f"   Total notifications now: {final_count}")
    print("\n   All notifications:")
    for n in Notification.objects.all().order_by('-created_at'):
        status = "🔵" if not n.is_read else "⚪"
        print(f"   {status} [{n.notification_type}] {n.title} → {n.user.email}")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED! Notifications are working dynamically!")
    print("=" * 60)
    
    return True


if __name__ == '__main__':
    success = test_dynamic_notifications()
    sys.exit(0 if success else 1)
