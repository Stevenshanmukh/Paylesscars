# Data Dictionary

## Field Reference

### Common Fields
- **id**: Unique identifier for the record (Auto-incrementing Integer).
- **created_at**: UTC timestamp when the record was first created.
- **updated_at**: UTC timestamp when the record was last modified.

### User & Dealer Fields
- **email**: Unique email address used for login and notifications.
- **role**: Defines user permissions.
    - `buyer`: Regular user looking for cards.
    - `dealer`: Business user listing cars.
    - `admin`: System administrator.
- **is_verified**: (Dealer) Boolean indicating if the dealership has been vetted by platform admins.
- **license_number**: State-issued dealer license ID.

### Vehicle Fields
- **vin**: 17-character unique Vehicle Identification Number.
- **status**: Current state of the listing.
    - `active`: Visible to buyers.
    - `pending`: Under negotiation/sale.
    - `sold`: Transaction complete.
    - `inactive`: Hidden by dealer.
- **price**: Listing price in USD.
- **floor_price**: (Hidden) Minimum price dealer is willing to accept (if implemented).

### Negotiation Fields
- **status**: state of the deal.
    - `open`: Active negotiation.
    - `accepted`: Deal reached.
    - `rejected`: Deal failed.
- **offer_type**:
    - `buyer_offer`: Offer made by buyer.
    - `dealer_counter`: Counter-offer made by dealer.

---

## Status Codes & Enums

### User Roles
| Value | Description |
|-------|-------------|
| `buyer` | Standard consumer account |
| `dealer` | Dealership business account |
| `admin` | Platform superuser |

### Vehicle Status
| Value | Description |
|-------|-------------|
| `active` | Listed and searchable |
| `pending` | In active negotiation or deposit paid |
| `sold` | Vehicle sold, historical record |
| `draft` | Incomplete listing |

### Negotiation Status
| Value | Description |
|-------|-------------|
| `open` | Active discussion |
| `accepted` | Price agreed, proceeding to paperwork |
| `rejected` | Offer declined, negotiation closed |
| `cancelled`| Buyer withdrew interest |

### Notification Types
| Value | Description |
|-------|-------------|
| `offer` | New offer or counter-offer received |
| `system` | Admin announcement or platform alert |
| `message` | Chat message received |
