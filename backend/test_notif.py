import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from decimal import Decimal
from apps.accounts.models import CustomUser
from apps.vehicles.models import Vehicle
from apps.negotiations.models import Negotiation
from apps.notifications.models import Notification
from apps.negotiations.services import NegotiationService

print("=== DYNAMIC NOTIFICATIONS TEST ===")
print("\nClearing test data...")
Notification.objects.all().delete()
Negotiation.objects.filter(buyer__email='buyer1@email.com').delete()

buyer = CustomUser.objects.get(email='buyer1@email.com')
vehicle = Vehicle.objects.filter(status='active', dealer__isnull=False).first()
dealer_user = vehicle.dealer.user
print(f"Buyer: {buyer.email}")
print(f"Dealer: {dealer_user.email}")
print(f"Vehicle: {vehicle.year} {vehicle.make} {vehicle.model}")

# TEST 1
print("\n--- TEST 1: New Offer ---")
offer_amount = Decimal(str(float(vehicle.asking_price) * 0.9))
negotiation = NegotiationService.start_negotiation(
    buyer=buyer, vehicle=vehicle, amount=offer_amount, message="Test offer"
)
dealer_notif = Notification.objects.filter(
    user=dealer_user, notification_type='offer_received'
).first()
print(f"Result: {'PASS' if dealer_notif else 'FAIL'}")
if dealer_notif:
    print(f"  -> {dealer_notif.title}")

# TEST 2
print("\n--- TEST 2: Counter Offer ---")
counter_amount = Decimal(str(float(vehicle.asking_price) * 0.95))
NegotiationService.submit_offer(
    negotiation=negotiation, user=dealer_user, amount=counter_amount, message="Counter"
)
buyer_notif = Notification.objects.filter(
    user=buyer, notification_type='counter_offer'
).first()
print(f"Result: {'PASS' if buyer_notif else 'FAIL'}")
if buyer_notif:
    print(f"  -> {buyer_notif.title}")

# TEST 3
print("\n--- TEST 3: Accept Offer ---")
NegotiationService.accept_offer(negotiation=negotiation, user=buyer)
accept_count = Notification.objects.filter(notification_type='offer_accepted').count()
print(f"Result: {'PASS' if accept_count >= 2 else 'FAIL'} ({accept_count} notifications)")

# Summary
print("\n=== SUMMARY ===")
total = Notification.objects.count()
print(f"Total notifications created: {total}")
for n in Notification.objects.all().order_by('-created_at'):
    print(f"  [{n.notification_type}] {n.title} -> {n.user.email}")

if total >= 4:
    print("\n=== ALL TESTS PASSED ===")
else:
    print("\n=== SOME TESTS FAILED ===")
