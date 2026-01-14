# Data Flow Documentation

## User Flows

### 1. User Registration & Onboarding
- **Buyer**: Creates account -> `User` record created (role='buyer').
- **Dealer**: Creates account -> `User` record created (role='dealer') -> `Dealer` profile created -> Marked `is_verified=False` -> Admin verifies -> `is_verified=True`.

### 2. Vehicle Listing (Dealer)
- **Create**: Dealer submits form -> `Vehicle` created (status='active').
- **Upload API**: External feed -> `Vehicle` records created/updated.
- **Images**: Images uploaded -> `VehicleImage` records linked to `Vehicle`.

### 3. Negotiation Process
- **Start**: Buyer clicks "Make Offer" -> `Negotiation` created (status='open') -> `Offer` created (type='buyer_offer').
- **Counter**: Dealer responds -> `Offer` created (type='dealer_counter').
- **Accept**: Party accepts -> `Negotiation` status='accepted' -> `Vehicle` status may update to 'pending'.
- **Reject**: Party rejects -> `Negotiation` status='rejected'.

### 4. Search & Save
- **Search**: User filters vehicles -> DB Query on `Vehicle` table (indexed fields: make, model, year, price).
- **Save**: User clicks "Heart" -> `SavedVehicle` record created linking User and Vehicle.

## Data Retention Policy
- **Users**: Retained until account deletion request.
- **Vehicles**: Sold vehicles retained for historical pricing data (status='sold').
- **Negotiations**: Retained for audit trails and analytics.
- **Logs**: System logs retained for 90 days.
