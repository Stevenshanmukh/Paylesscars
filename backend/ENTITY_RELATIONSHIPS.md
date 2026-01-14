# Entity Relationship Documentation

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CARNEGOTIATE DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────────────────┘

                                ┌─────────────┐
                                │    User     │
                                ├─────────────┤
                    ┌───────────│ id (PK)     │──────────────┐
                    │           │ email       │              │
                    │           │ role        │              │
                    │           └─────────────┘              │
             (as dealer user)          │                     │
                    │                  │ 1:1                 │ 1:N
                    ▼                  ▼                     ▼
              ┌─────────────┐   ┌─────────────┐       ┌─────────────┐
              │   Dealer    │   │ DealerReview│       │Notification │
              ├─────────────┤   ├─────────────┤       ├─────────────┤
              │ id (PK)     │◀──│ dealer_id   │       │ user_id(FK) │
              │ user_id(FK) │   │ user_id     │       └─────────────┘
              │ name        │   └─────────────┘
              └─────────────┘
                    │
                    │ 1:N
                    ▼
              ┌─────────────┐       ┌─────────────┐
              │   Vehicle   │◀──────│ SavedVehicle│
              ├─────────────┤ 1:N   ├─────────────┤
              │ id (PK)     │───────│ vehicle_id  │
      ┌───────│ dealer_id   │       │ user_id     │◀─(buyer)
      │       │ status      │       └─────────────┘
      │       └─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│ Negotiation │
├─────────────┤
│ id (PK)     │
│ vehicle_id  │
│ buyer_id(FK)│◀──(buyer)
│ dealer_id(FK)│◀──(from vehicle)
└─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│    Offer    │
├─────────────┤
│ id (PK)     │
│ negr_id(FK) │
│ amount      │
└─────────────┘
```

## Relationship Reference

### One-to-One
- **User ↔ Dealer**: A User with role 'dealer' has exactly one Dealer profile.

### One-to-Many
- **Dealer → Vehicle**: A Dealer lists multiple Vehicles.
- **Vehicle → VehicleImage**: A Vehicle has multiple images.
- **Vehicle → Negotiation**: A Vehicle can be negotiated by multiple buyers (until Sold).
- **Negotiation → Offer**: A Negotiation consists of a history of Offers.
- **User → Notification**: Users receive multiple Notifications.
- **Dealer → DealerReview**: Dealers receive multiple reviews.

### Many-to-Many
- **User ↔ Vehicle** (via SavedVehicle): Buyers can save multiple vehicles, and vehicles can be saved by multiple buyers.
