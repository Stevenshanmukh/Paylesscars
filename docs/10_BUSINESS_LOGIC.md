# Payless Cars - Business Logic & Services

## 1. Core Business Rules

### 1.1 Pricing Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| `floor_price ≤ msrp` | Floor cannot exceed MSRP | Database constraint |
| `asking_price ≥ floor_price` | Asking must be at/above floor | Database constraint |
| Floor price hidden | Buyers never see floor_price | Serializer exclusion |
| Prices in USD | All monetary values in dollars | Convention |

### 1.2 Negotiation Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| One active per pair | Max one active negotiation per buyer-vehicle | Unique constraint |
| 72-hour expiration | Negotiations expire after 72 hours of inactivity | Background job + checks |
| Turn-based offers | Can only submit offer when it's your turn | View permission check |
| Buyer initiates | Only buyers can start negotiations | Permission class |
| Dealer rejects | Only dealers can reject (buyers cancel) | Permission check |

### 1.3 User Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| Email unique | No duplicate email accounts | Model constraint |
| Dealer must be verified | Unverified dealers can't list vehicles | Permission class |
| Role immutable | user_type cannot be changed after creation | No update endpoint |

---

## 2. Validation Logic

### 2.1 User Registration
```python
def validate_registration(data):
    errors = {}
    
    # Email validation
    if not is_valid_email(data['email']):
        errors['email'] = 'Enter a valid email address'
    if User.objects.filter(email=data['email']).exists():
        errors['email'] = 'User with this email already exists'
    
    # Password validation
    if len(data['password']) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    if data['password'] != data['password_confirm']:
        errors['password_confirm'] = 'Passwords do not match'
    
    # User type validation
    if data['user_type'] not in ['buyer', 'dealer']:
        errors['user_type'] = 'Invalid user type'
    
    return errors
```

### 2.2 Vehicle Creation
```python
def validate_vehicle(data, dealer):
    errors = {}
    
    # VIN validation
    if len(data['vin']) != 17:
        errors['vin'] = 'VIN must be exactly 17 characters'
    if Vehicle.objects.filter(vin=data['vin']).exists():
        errors['vin'] = 'Vehicle with this VIN already exists'
    
    # Price validation
    if data['floor_price'] > data['msrp']:
        errors['floor_price'] = 'Floor price cannot exceed MSRP'
    if data['asking_price'] < data['floor_price']:
        errors['asking_price'] = 'Asking price cannot be below floor price'
    
    # Year validation
    current_year = datetime.now().year
    if data['year'] < 2000 or data['year'] > current_year + 2:
        errors['year'] = 'Invalid model year'
    
    return errors
```

### 2.3 Negotiation Start
```python
def validate_negotiation_start(data, buyer, vehicle):
    errors = {}
    
    # Can't negotiate own vehicles
    if hasattr(buyer, 'dealer_profile') and vehicle.dealer == buyer.dealer_profile:
        errors['vehicle_id'] = 'Cannot negotiate on your own vehicle'
    
    # Check for existing active negotiation
    if Negotiation.objects.filter(
        vehicle=vehicle,
        buyer=buyer,
        status='active'
    ).exists():
        errors['vehicle_id'] = 'You already have an active negotiation for this vehicle'
    
    # Vehicle must be active
    if vehicle.status != 'active':
        errors['vehicle_id'] = 'This vehicle is not available for offers'
    
    # Amount validation
    if data['initial_amount'] <= 0:
        errors['initial_amount'] = 'Offer amount must be positive'
    
    return errors
```

### 2.4 Offer Submission
```python
def validate_offer_submission(negotiation, user, amount):
    errors = {}
    
    # Negotiation must be active
    if negotiation.status != 'active':
        errors['negotiation'] = 'This negotiation is no longer active'
    
    # Check expiration
    if negotiation.is_expired:
        errors['negotiation'] = 'This negotiation has expired'
    
    # Must be participant
    is_buyer = negotiation.buyer == user
    is_dealer = negotiation.vehicle.dealer.user == user
    if not (is_buyer or is_dealer):
        errors['negotiation'] = 'You are not a participant in this negotiation'
    
    # Must be their turn
    pending_offer = negotiation.pending_offer
    if pending_offer:
        if pending_offer.offered_by == 'buyer' and is_buyer:
            errors['negotiation'] = 'Waiting for dealer response'
        if pending_offer.offered_by == 'dealer' and is_dealer:
            errors['negotiation'] = 'Waiting for buyer response'
    
    # Amount validation
    if amount <= 0:
        errors['amount'] = 'Offer amount must be positive'
    
    return errors
```

---

## 3. Business Calculations

### 3.1 Discount Calculation
```python
def calculate_discount(vehicle):
    """Calculate discount from MSRP."""
    return {
        'amount': vehicle.msrp - vehicle.asking_price,
        'percentage': ((vehicle.msrp - vehicle.asking_price) / vehicle.msrp) * 100
    }
```

### 3.2 Deal Rating
```python
def get_deal_rating(discount_percentage):
    """Rate the deal based on discount percentage."""
    if discount_percentage >= 15:
        return 'great'  # Green
    elif discount_percentage >= 10:
        return 'good'   # Light green
    elif discount_percentage >= 5:
        return 'fair'   # Yellow
    elif discount_percentage >= 0:
        return 'above'  # Orange
    else:
        return 'high'   # Red (asking > msrp)
```

### 3.3 Negotiation Expiration
```python
def calculate_expiration(from_time=None, hours=72):
    """Calculate negotiation expiration time."""
    start = from_time or timezone.now()
    return start + timedelta(hours=hours)

def is_expired(negotiation):
    """Check if negotiation has expired."""
    return timezone.now() > negotiation.expires_at
```

### 3.4 Dealer Statistics
```python
def calculate_dealer_stats(dealer):
    """Calculate dealer dashboard statistics."""
    vehicles = Vehicle.objects.filter(dealer=dealer)
    
    return {
        'total_inventory': vehicles.count(),
        'active_listings': vehicles.filter(status='active').count(),
        'pending_sale': vehicles.filter(status='pending_sale').count(),
        'sold_count': vehicles.filter(status='sold').count(),
        'revenue': vehicles.filter(
            status='sold',
            negotiations__status='accepted'
        ).aggregate(
            total=Sum('negotiations__accepted_price')
        )['total'] or 0,
        'pending_offers': Negotiation.objects.filter(
            vehicle__dealer=dealer,
            status='active',
            offers__status='pending',
            offers__offered_by='buyer'
        ).distinct().count()
    }
```

---

## 4. State Transitions

### 4.1 Vehicle Status Transitions
```
                    ┌─────────┐
        create ──→  │  DRAFT  │
                    └────┬────┘
                         │ publish
                         ▼
                    ┌─────────┐
                    │ ACTIVE  │ ←─────────┐
                    └────┬────┘           │
           offer         │                │ reactivate
         accepted        │                │
                         ▼                │
               ┌─────────────────┐        │
               │  PENDING_SALE   │────────┘
               └────────┬────────┘   sale cancelled
                        │
                        │ sale completed
                        ▼
                    ┌─────────┐
                    │  SOLD   │
                    └─────────┘

       (any status)
            │
            │ deactivate
            ▼
       ┌──────────┐
       │ INACTIVE │
       └──────────┘
```

### 4.2 Negotiation Status Transitions
```
                    ┌─────────┐
        create ──→  │ ACTIVE  │ ←──────────────────┐
                    └────┬────┘                    │
         ┌───────────────┼───────────────┐         │
         │               │               │         │
         ▼               ▼               ▼         │
   ┌──────────┐   ┌──────────┐   ┌───────────┐    │
   │ ACCEPTED │   │ REJECTED │   │ CANCELLED │    │
   └──────────┘   └──────────┘   └───────────┘    │
                                                   │
                                          (counter offer
                                           resets timer)
                              ┌───────────┐
                  timeout ──→ │  EXPIRED  │
                              └───────────┘
```

### 4.3 Offer Status Transitions
```
                    ┌─────────┐
        create ──→  │ PENDING │
                    └────┬────┘
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌───────────┐
   │ ACCEPTED │   │ REJECTED │   │ COUNTERED │
   └──────────┘   └──────────┘   └───────────┘
```

---

## 5. Service Layer

### 5.1 NegotiationService
```python
# apps/negotiations/services.py

class NegotiationService:
    
    @staticmethod
    def create_negotiation(buyer, vehicle, initial_amount, message=''):
        """Create new negotiation with initial offer."""
        
        # Validation
        if vehicle.status != 'active':
            raise ValidationError('Vehicle not available')
        
        if Negotiation.objects.filter(
            buyer=buyer, vehicle=vehicle, status='active'
        ).exists():
            raise ValidationError('Active negotiation exists')
        
        # Create negotiation
        negotiation = Negotiation.objects.create(
            vehicle=vehicle,
            buyer=buyer,
            status=Negotiation.Status.ACTIVE,
            expires_at=timezone.now() + timedelta(hours=72)
        )
        
        # Create initial offer
        Offer.objects.create(
            negotiation=negotiation,
            amount=initial_amount,
            offered_by=Offer.OfferedBy.BUYER,
            message=message,
            status=Offer.Status.PENDING
        )
        
        # Send notification to dealer
        NotificationService.notify_new_offer(negotiation)
        
        return negotiation
    
    @staticmethod
    def submit_counter_offer(negotiation, user, amount, message=''):
        """Submit counter offer."""
        
        # Validate turn
        pending = negotiation.pending_offer
        if not pending:
            raise ValidationError('No pending offer to counter')
        
        is_buyer = negotiation.buyer == user
        is_dealer = negotiation.vehicle.dealer.user == user
        
        if pending.offered_by == 'buyer' and is_buyer:
            raise ValidationError('Not your turn')
        if pending.offered_by == 'dealer' and is_dealer:
            raise ValidationError('Not your turn')
        
        # Mark previous as countered
        pending.status = Offer.Status.COUNTERED
        pending.responded_at = timezone.now()
        pending.save()
        
        # Create new offer
        offer = Offer.objects.create(
            negotiation=negotiation,
            amount=amount,
            offered_by='dealer' if is_dealer else 'buyer',
            message=message,
            status=Offer.Status.PENDING
        )
        
        # Reset expiration
        negotiation.expires_at = timezone.now() + timedelta(hours=72)
        negotiation.save()
        
        # Notify other party
        NotificationService.notify_counter_offer(negotiation, offer)
        
        return negotiation
    
    @staticmethod
    def accept_offer(negotiation, user):
        """Accept the current pending offer."""
        
        pending = negotiation.pending_offer
        if not pending:
            raise ValidationError('No pending offer')
        
        # Validate recipient is accepting
        is_buyer = negotiation.buyer == user
        is_dealer = negotiation.vehicle.dealer.user == user
        
        if pending.offered_by == 'buyer' and is_buyer:
            raise ValidationError('Cannot accept your own offer')
        if pending.offered_by == 'dealer' and is_dealer:
            raise ValidationError('Cannot accept your own offer')
        
        # Update offer
        pending.status = Offer.Status.ACCEPTED
        pending.responded_at = timezone.now()
        pending.save()
        
        # Update negotiation
        negotiation.status = Negotiation.Status.ACCEPTED
        negotiation.accepted_price = pending.amount
        negotiation.save()
        
        # Update vehicle status
        vehicle = negotiation.vehicle
        vehicle.status = Vehicle.Status.PENDING_SALE
        vehicle.save()
        
        # Notify both parties
        NotificationService.notify_offer_accepted(negotiation)
        
        return negotiation
    
    @staticmethod
    def reject_negotiation(negotiation, dealer_user, reason=''):
        """Dealer rejects negotiation."""
        
        if negotiation.vehicle.dealer.user != dealer_user:
            raise PermissionError('Only dealer can reject')
        
        # Update pending offer
        pending = negotiation.pending_offer
        if pending:
            pending.status = Offer.Status.REJECTED
            pending.responded_at = timezone.now()
            pending.save()
        
        # Update negotiation
        negotiation.status = Negotiation.Status.REJECTED
        negotiation.save()
        
        NotificationService.notify_rejection(negotiation, reason)
        
        return negotiation
    
    @staticmethod
    def cancel_negotiation(negotiation, buyer_user):
        """Buyer cancels negotiation."""
        
        if negotiation.buyer != buyer_user:
            raise PermissionError('Only buyer can cancel')
        
        negotiation.status = Negotiation.Status.CANCELLED
        negotiation.save()
        
        NotificationService.notify_cancellation(negotiation)
        
        return negotiation
```

### 5.2 VehicleService
```python
class VehicleService:
    
    @staticmethod
    def create_vehicle(dealer, data):
        """Create vehicle listing."""
        
        # Validate dealer is verified
        if not dealer.is_verified:
            raise PermissionError('Dealer must be verified')
        
        # Validate pricing
        if data['floor_price'] > data['msrp']:
            raise ValidationError('Floor price cannot exceed MSRP')
        if data['asking_price'] < data['floor_price']:
            raise ValidationError('Asking price cannot be below floor')
        
        vehicle = Vehicle.objects.create(
            dealer=dealer,
            **data
        )
        
        return vehicle
    
    @staticmethod
    def bulk_import(dealer, csv_file):
        """Import vehicles from CSV."""
        
        results = {
            'created': 0,
            'errors': []
        }
        
        reader = csv.DictReader(csv_file)
        for i, row in enumerate(reader, start=2):  # Skip header
            try:
                vehicle_data = VehicleService._parse_csv_row(row, dealer)
                VehicleService.create_vehicle(dealer, vehicle_data)
                results['created'] += 1
            except Exception as e:
                results['errors'].append({
                    'row': i,
                    'error': str(e)
                })
        
        return results
```

---

## 6. Cross-Feature Dependencies

### 6.1 Negotiation → Vehicle
- Accepting offer changes vehicle status to `pending_sale`
- Vehicle deletion blocked if active negotiations exist

### 6.2 Dealer → Vehicle
- Deleting dealer cascades to delete vehicles
- Dealer verification required to create vehicles

### 6.3 User → Dealer
- Creating dealer profile sets user as owner
- User deletion cascades to dealer deletion

### 6.4 Notification → All
- Notifications created on:
  - New offer (to dealer)
  - Counter offer (to other party)
  - Acceptance (to both)
  - Rejection (to buyer)
  - Cancellation (to dealer)

---

## 7. Edge Cases

### 7.1 Concurrent Offers
**Scenario**: Two buyers submit offers simultaneously.
**Handling**: Database constraint ensures one active negotiation per buyer-vehicle. Second request fails with validation error.

### 7.2 Expired Negotiation
**Scenario**: User tries to submit offer on expired negotiation.
**Handling**: Check `expires_at` in service layer. Return 400 with "Negotiation has expired".

### 7.3 Vehicle Sold Mid-Negotiation
**Scenario**: Dealer marks vehicle sold while negotiations active.
**Handling**: All active negotiations should be marked as expired/rejected. (Currently manual process)

### 7.4 Dealer Unverified
**Scenario**: Admin revokes dealer verification.
**Handling**: Dealer can't create new listings. Existing listings remain but may require policy decision.

### 7.5 Offer Below Floor
**Scenario**: Buyer offers below floor price.
**Handling**: System accepts offer (floor is hidden). Dealer sees it's below floor and likely rejects/counters.
