# Payless Cars - Features & Business Logic

## 1. Feature Index

| ID | Feature | User Roles | Status |
|----|---------|------------|--------|
| F-01 | User Registration | Public | Complete |
| F-02 | Authentication | All | Complete |
| F-03 | Vehicle Browsing | Public | Complete |
| F-04 | Vehicle Search | Public | Complete |
| F-05 | Vehicle Details | Public | Complete |
| F-06 | Dealer Registration | Buyers | Complete |
| F-07 | Vehicle Listing | Dealers | Complete |
| F-08 | Bulk Upload | Dealers | Complete |
| F-09 | Inventory Management | Dealers | Complete |
| F-10 | Start Negotiation | Buyers | Complete |
| F-11 | Counter Offers | All Auth | Complete |
| F-12 | Accept/Reject Offers | All Auth | Complete |
| F-13 | Saved Vehicles | Buyers | Complete |
| F-14 | Dashboard Analytics | All Auth | Complete |
| F-15 | Notifications | All Auth | Complete |

---

## F-01: User Registration

### Description
Allows new users to create accounts with email and password. Users choose their role (buyer or dealer) during registration.

### User Role Access
- **Public**: Anyone can register

### Preconditions
- Email address not already registered
- Valid email format
- Password meets requirements (8+ characters)

### User Actions
1. Navigate to `/register`
2. Enter email address
3. Enter password
4. Confirm password
5. Select user type (Buyer or Dealer)
6. Click "Create Account"

### System Responses
| Scenario | Response |
|----------|----------|
| Success | Create user, generate JWT tokens, redirect to dashboard |
| Email exists | Error: "User with this email already exists" |
| Password mismatch | Error: "Passwords do not match" |
| Invalid email | Error: "Enter a valid email address" |

### API Call
```
POST /api/v1/auth/register/
Body: {
    "email": "user@example.com",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "user_type": "buyer" | "dealer"
}
Response: {
    "user": { id, email, user_type, ... },
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>"
}
```

### Edge Cases
- Dealer registration creates user but dealer profile needs separate registration
- Tokens stored in localStorage immediately for auto-login

---

## F-02: Authentication

### Description
Login/logout functionality using JWT Bearer tokens.

### User Role Access
- **Login**: Public
- **Logout**: Authenticated users

### Preconditions
- Valid email and password combination for login
- Valid access token for logout

### User Actions
**Login:**
1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"
4. System redirects based on user type

**Logout:**
1. Click profile menu
2. Click "Logout"
3. System clears tokens and redirects to home

### System Responses
| Scenario | Response |
|----------|----------|
| Login success | Store tokens, fetch profile, redirect to dashboard |
| Invalid credentials | Error: "Invalid email or password" |
| Logout success | Clear localStorage, redirect to home |

### API Calls
```
POST /api/v1/auth/login/
Body: { "email": "...", "password": "..." }
Response: { "access": "...", "refresh": "...", "user": {...} }

POST /api/v1/auth/logout/
Headers: Authorization: Bearer <token>
Body: { "refresh": "<refresh_token>" }
Response: { "detail": "Successfully logged out." }

POST /api/v1/auth/token/refresh/
Body: { "refresh": "<refresh_token>" }
Response: { "access": "<new_access_token>" }
```

### Token Lifecycle
1. Access token: Short-lived (5-60 minutes)
2. Refresh token: Long-lived (7 days)
3. On 401 error: Attempt token refresh, else redirect to login

---

## F-03: Vehicle Browsing

### Description
Public listing of all active vehicle listings with pagination.

### User Role Access
- **Public**: All visitors

### Preconditions
- None (public access)

### User Actions
1. Navigate to `/vehicles`
2. Scroll through vehicle cards
3. Click card to view details
4. Use pagination controls

### System Responses
| Scenario | Response |
|----------|----------|
| Success | Display grid of vehicle cards |
| No vehicles | Show "No vehicles found" message |
| API error | Show error message with retry |

### API Call
```
GET /api/v1/vehicles/
Query: ?page=1&page_size=12&status=active
Response: {
    "count": 50,
    "next": ".../vehicles/?page=2",
    "previous": null,
    "results": [{ id, make, model, year, asking_price, ... }]
}
```

### Display Information
Per vehicle card:
- Primary image (or placeholder)
- Year, make, model, trim
- Asking price (formatted as currency)
- Dealer name and location
- Body type badge

---

## F-04: Vehicle Search & Filter

### Description
Filter and search vehicles by various criteria.

### User Role Access
- **Public**: All visitors

### Available Filters
| Filter | Type | Values |
|--------|------|--------|
| Make | Select | Dynamic from API |
| Model | Select | Dynamic (depends on make) |
| Year (min/max) | Range | 1990 - current year |
| Price (min/max) | Range | $0 - $500,000 |
| Body Type | Multi-select | sedan, suv, truck, coupe, etc. |
| City | Text | Free text |
| State | Select | US states |
| Search | Text | Free text (VIN, make, model) |

### User Actions
1. Open filter panel
2. Set desired filters
3. Click "Apply Filters"
4. Results update dynamically

### API Call
```
GET /api/v1/vehicles/?make=Toyota&year__gte=2020&asking_price__lte=50000&body_type=suv
```

### Edge Cases
- Empty results show "No vehicles match your filters"
- Reset filters button clears all

---

## F-05: Vehicle Details

### Description
Full vehicle information page with all specifications.

### User Role Access
- **Public**: View vehicle details
- **Authenticated Buyers**: Make offers, save vehicle

### Preconditions
- Valid vehicle ID in URL
- Vehicle status is "active" (or owner viewing own listing)

### User Actions
1. Click vehicle card from listing
2. View all details and images
3. [Auth] Click "Make Offer" to start negotiation
4. [Auth] Click heart icon to save

### System Responses
| Scenario | Response |
|----------|----------|
| Success | Display full vehicle page |
| Vehicle not found | 404 page |
| Vehicle inactive | Redirect to listings or 404 |

### API Call
```
GET /api/v1/vehicles/{id}/
Response: {
    "id": "uuid",
    "dealer": { id, business_name, city, state, phone },
    "vin": "1HGBH41...",
    "make": "Toyota",
    "model": "Camry",
    "year": 2024,
    "trim": "XSE",
    "body_type": "sedan",
    "msrp": "35000.00",
    "asking_price": "33000.00",
    "specifications": { "engine": "2.5L", "mpg": 32, ... },
    "features": ["Sunroof", "Navigation", ...],
    "images": [{ id, image_url, is_primary, ... }],
    ...
}
```

### Displayed Sections
1. Image gallery (carousel)
2. Price & deal rating
3. Key specifications
4. Vehicle details table
5. Features list
6. Dealer information card
7. Similar vehicles section

---

## F-06: Dealer Registration

### Description
Existing users (registered as dealers) complete dealer profile.

### User Role Access
- **Authenticated users with user_type='dealer'**

### Preconditions
- User is authenticated
- User type is "dealer"
- User does not already have dealer profile

### User Actions
1. Navigate to `/dealer/onboarding` or `/for-dealers`
2. Enter business information:
   - Business name
   - License number
   - Tax ID
   - Phone number
   - Street address, city, state, zip
3. Submit registration

### System Responses
| Scenario | Response |
|----------|----------|
| Success | Create dealer profile (pending verification), redirect to dashboard |
| Duplicate license | Error: "This license number is already registered" |
| Missing fields | Validation errors per field |

### API Call
```
POST /api/v1/dealers/register/
Headers: Authorization: Bearer <token>
Body: {
    "business_name": "Premier Auto",
    "license_number": "DL123456",
    "tax_id": "12-3456789",
    "phone": "555-1234",
    "street_address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001"
}
Response: { id, business_name, verification_status: "pending", ... }
```

### Verification Status Flow
```
pending (new) → verified (admin approved) → active
                                          ↘ rejected
                                          ↘ suspended
```

---

## F-07: Vehicle Listing (CRUD)

### Description
Dealers create and manage vehicle listings.

### User Role Access
- **Verified Dealers only**

### Preconditions
- User is authenticated dealer
- Dealer is verified (verification_status = 'verified')

### User Actions (Create)
1. Navigate to Dealer Dashboard
2. Click "Add Vehicle"
3. Fill in vehicle form:
   - VIN (17 characters, unique)
   - Stock number
   - Make, model, year, trim
   - Body type
   - Exterior/interior colors
   - MSRP, floor price, asking price
   - Specifications (JSON)
   - Features (array)
4. Upload images
5. Set status (draft or active)
6. Submit

### Business Rules
| Rule | Description |
|------|-------------|
| floor_price ≤ MSRP | Floor price cannot exceed MSRP |
| asking_price ≥ floor_price | Asking price must be at or above floor |
| VIN unique | Each vehicle has unique VIN |
| floor_price hidden | Buyers never see floor_price |

### API Calls
```
POST /api/v1/vehicles/
Headers: Authorization: Bearer <token>
Body: {
    "vin": "1HGBH41JXMN109186",
    "stock_number": "ST12345",
    "make": "Honda",
    "model": "Accord",
    "year": 2024,
    "trim": "Touring",
    "body_type": "sedan",
    "exterior_color": "Blue",
    "interior_color": "Black",
    "msrp": "35000.00",
    "floor_price": "30000.00",
    "asking_price": "32000.00",
    "specifications": {},
    "features": [],
    "status": "active"
}

PATCH /api/v1/vehicles/{id}/
DELETE /api/v1/vehicles/{id}/ (soft delete - marks inactive)
```

---

## F-08: Bulk Upload

### Description
Dealers upload multiple vehicles via CSV file.

### User Role Access
- **Verified Dealers only**

### CSV Template Columns
| Column | Required | Format |
|--------|----------|--------|
| vin | Yes | 17 characters |
| stock_number | Yes | Text |
| make | Yes | Text |
| model | Yes | Text |
| year | Yes | Integer (2000-2030) |
| trim | No | Text |
| body_type | Yes | sedan/suv/truck/coupe/hatchback/convertible/van/wagon |
| exterior_color | Yes | Text |
| interior_color | Yes | Text |
| msrp | Yes | Decimal |
| floor_price | Yes | Decimal |
| asking_price | Yes | Decimal |

### User Actions
1. Click "Bulk Upload" in dashboard
2. Download CSV template
3. Fill in vehicle data
4. Upload CSV file
5. Review validation results
6. Confirm import

### System Responses
| Scenario | Response |
|----------|----------|
| All valid | Import all, show success count |
| Partial errors | Show row-by-row errors, import valid rows |
| File format error | Reject entire file |

### API Calls
```
GET /api/v1/vehicles/bulk_upload_template/
Response: CSV file download

POST /api/v1/vehicles/bulk_upload/
Headers: Content-Type: multipart/form-data
Body: FormData with csv_file
Response: {
    "success": true,
    "created": 10,
    "skipped": 2,
    "errors": [
        { "row": 5, "error": "Invalid VIN format" }
    ]
}
```

---

## F-09: Inventory Management

### Description
Dealers manage their vehicle listings with status changes.

### User Role Access
- **Verified Dealers only**

### Vehicle Statuses
| Status | Description | Visibility |
|--------|-------------|------------|
| draft | Not published | Owner only |
| active | Published, searchable | Public |
| pending_sale | Offer accepted, awaiting completion | Owner only |
| sold | Sale completed | Hidden |
| inactive | Removed from listings | Owner only |

### User Actions
1. View inventory list at `/dealer/inventory`
2. Filter by status
3. Edit vehicle details
4. Change vehicle status
5. Delete/deactivate vehicles

### API Calls
```
GET /api/v1/vehicles/my-inventory/
Response: List of all dealer's vehicles regardless of status

PATCH /api/v1/vehicles/{id}/
Body: { "status": "sold" }
```

---

## F-10: Start Negotiation

### Description
Buyers initiate negotiations on vehicles.

### User Role Access
- **Authenticated Buyers only**

### Preconditions
- User is authenticated as buyer
- No active negotiation exists for this buyer-vehicle pair
- Vehicle is active

### User Actions
1. Navigate to vehicle detail page
2. Click "Make Offer"
3. Enter offer amount
4. Optionally add message
5. Submit offer

### Business Rules
| Rule | Description |
|------|-------------|
| One active per pair | Only one active negotiation per buyer-vehicle combination |
| Must be < asking price | Initial offer typically below asking price |
| Expiration | Negotiations expire after 72 hours of inactivity |

### API Call
```
POST /api/v1/negotiations/
Headers: Authorization: Bearer <token>
Body: {
    "vehicle_id": "uuid",
    "initial_amount": 30000.00,
    "message": "I'm interested in this vehicle"
}
Response: {
    "id": "uuid",
    "vehicle": {...},
    "buyer": {...},
    "status": "active",
    "expires_at": "2024-01-15T12:00:00Z",
    "offers": [{
        "id": "uuid",
        "amount": "30000.00",
        "offered_by": "buyer",
        "status": "pending",
        "message": "...",
        "created_at": "..."
    }]
}
```

---

## F-11: Counter Offers

### Description
Both parties can submit counter-offers in active negotiations.

### User Role Access
- **Authenticated Buyers and Dealers**
- Must be participant in the negotiation

### Preconditions
- Negotiation is active
- Not expired
- Previous offer is pending (waiting for response)
- Current user is the recipient of pending offer

### User Actions
1. View negotiation at `/negotiations/{id}`
2. See current offer
3. Click "Counter Offer"
4. Enter new amount
5. Optionally add message
6. Submit

### Business Rules
| Rule | Description |
|------|-------------|
| Turn-based | Can only counter when it's your turn |
| Must specify amount | Amount is required |
| Resets expiration | Submitting offer extends expiration by 72 hours |

### API Call
```
POST /api/v1/negotiations/{id}/submit-offer/
Headers: Authorization: Bearer <token>
Body: {
    "amount": "31000.00",
    "message": "How about this price?"
}
Response: Updated negotiation object
```

---

## F-12: Accept/Reject Offers

### Description
Accept or reject the current pending offer.

### User Role Access
- **Buyer**: Can accept dealer's offer, can cancel negotiation
- **Dealer**: Can accept buyer's offer, can reject negotiation

### User Actions (Accept)
1. View negotiation details
2. Click "Accept Offer"
3. Confirm in modal
4. System updates status

### User Actions (Reject/Cancel)
1. View negotiation details
2. Click "Reject" or "Cancel"
3. Optionally provide reason
4. Confirm

### System Responses
| Action | By | Result |
|--------|-----|--------|
| Accept | Either party | Status → accepted, vehicle → pending_sale |
| Reject | Dealer | Status → rejected |
| Cancel | Buyer | Status → cancelled |

### API Calls
```
POST /api/v1/negotiations/{id}/accept/
Body: { "confirm": true }

POST /api/v1/negotiations/{id}/reject/
Body: { "reason": "Vehicle no longer available" }

POST /api/v1/negotiations/{id}/cancel/
```

### Side Effects
- Accepting offer: Vehicle status changes to "pending_sale"
- Notifications sent to other party
- Expiration timer stops

---

## F-13: Saved Vehicles

### Description
Buyers can save/favorite vehicles for later.

### User Role Access
- **Authenticated Buyers only**

### User Actions
1. Click heart icon on vehicle card or detail page
2. View saved vehicles at `/saved`
3. Remove by clicking heart again

### API Calls
```
GET /api/v1/vehicles/saved/
Response: { "results": [...saved vehicles...] }

POST /api/v1/vehicles/saved/
Body: { "vehicle_id": "uuid" }

DELETE /api/v1/vehicles/saved/{vehicle_id}/
```

---

## F-14: Dashboard Analytics

### Description
Role-specific dashboards with key metrics.

### User Role Access
- **Buyers**: See buyer dashboard
- **Dealers**: See dealer dashboard

### Buyer Dashboard Metrics
| Metric | Source |
|--------|--------|
| Active Negotiations | Count of status=active |
| Saved Vehicles | Count of saved vehicles |
| Offers Sent | Total offers submitted |
| Accepted Deals | Count of status=accepted |

### Dealer Dashboard Metrics
| Metric | Source |
|--------|--------|
| Total Inventory | Count of all vehicles |
| Active Listings | Count of status=active vehicles |
| New Offers | Pending offers on my vehicles |
| Revenue (Sold) | Sum of accepted_price for sold vehicles |
| Pending Sales | Count of pending_sale vehicles |

### API Calls
```
GET /api/v1/negotiations/stats/
Response: {
    "total": 25,
    "active": 3,
    "accepted": 10,
    "rejected": 5,
    "cancelled": 4,
    "expired": 3
}

GET /api/v1/dealers/me/stats/
Response: {
    "total_inventory": 50,
    "active_listings": 42,
    "pending_offers": 5,
    "sold_this_month": 8,
    "revenue_this_month": 350000
}
```

---

## F-15: Notifications

### Description
In-app notifications for important events.

### User Role Access
- **All Authenticated Users**

### Notification Types
| Type | Trigger | Recipient |
|------|---------|-----------|
| offer | New offer received | Dealer |
| counter | Counter-offer received | Buyer/Dealer |
| accepted | Offer accepted | Both parties |
| rejected | Negotiation rejected | Buyer |
| expired | Negotiation expired | Both parties |
| system | System announcements | All |

### User Actions
1. See notification count in header
2. Click bell icon to view dropdown
3. Click notification to navigate to related item
4. Mark as read

### API Calls
```
GET /api/v1/notifications/
Response: {
    "results": [{
        "id": "uuid",
        "title": "New Offer Received",
        "message": "Buyer offered $30,000 for 2024 Toyota Camry",
        "notification_type": "offer",
        "related_link": "/negotiations/uuid",
        "is_read": false,
        "created_at": "..."
    }]
}

PATCH /api/v1/notifications/{id}/
Body: { "is_read": true }
```

---

## Feature Interactions

### Negotiation → Vehicle Status Flow
```
Vehicle (active) 
    ↓ Buyer starts negotiation
Negotiation (active)
    ↓ Offer/counter cycle
    ↓ Dealer accepts
Vehicle (pending_sale)
    ↓ Sale completed (manual)
Vehicle (sold)
```

### User Registration → Full Flow
```
Register (buyer) → Login → Browse → Save → Make Offer → Negotiate → Accept

Register (dealer) → Login → Register Business → Verification (pending)
                                                    ↓ Admin approves
                                                Verified → List Vehicles → Receive Offers → Negotiate
```
