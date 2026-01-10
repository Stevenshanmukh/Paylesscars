import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carnegotiate.settings')
django.setup()

from apps.negotiations.models import Negotiation, Offer

n = Negotiation.objects.last()
print(f"Negotiation ID: {n.id}")
print(f"Status: {n.status}")

offers = n.offers.all().order_by('-created_at')
print(f"Total Offers: {offers.count()}")

for o in offers:
    print(f" - {o.amount} ({o.offered_by}) Status: {o.status}")

# Check if last offer is from dealer (my test)
last_offer = offers.first()
if last_offer and last_offer.offered_by == 'dealer':
    print("Deleting last dealer offer to reset state...")
    last_offer.delete()
    
    # Re-fetch and update negotiation status if needed
    # But technically just deleting the offer might leave negotiation in 'active' which is fine
    # Previous offer (buyer) should be 'pending' again? 
    # Actually, when dealer countered, buyer offer became 'countered'.
    # We need to reset buyer offer to 'pending'
    
    buyer_offer = n.offers.order_by('-created_at').first()
    if buyer_offer and buyer_offer.offered_by == 'buyer':
        buyer_offer.status = 'pending'
        buyer_offer.save()
        print("Reset buyer offer to pending.")
    
    print("State reset complete.")
else:
    print("Last offer is not from dealer. No reset needed.")
