# CarNegotiate - API Documentation

## Base URL
```
Development: http://localhost:8000/api/v1
Production: https://api.carnegotiate.com/api/v1
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints (`/auth/`)

### 1.1 Register User
```
POST /auth/register/
```

**Auth Required**: No

**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "securePassword123",
    "password_confirm": "securePassword123",
    "user_type": "buyer"  // "buyer" | "dealer"
}
```

**Response (201 Created)**:
```json
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "user_type": "buyer",
        "is_verified": false,
        "created_at": "2024-01-10T12:00:00Z"
    },
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>"
}
```

**Errors**:
| Status | Scenario |
|--------|----------|
| 400 | Email already exists |
| 400 | Passwords don't match |
| 400 | Invalid email format |

**Frontend Trigger**: Register form submission

---

### 1.2 Login
```
POST /auth/login/
```

**Auth Required**: No

**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "securePassword123"
}
```

**Response (200 OK)**:
```json
{
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "user_type": "buyer"
    }
}
```

**Errors**:
| Status | Scenario |
|--------|----------|
| 401 | Invalid credentials |

**Frontend Trigger**: Login form submission

---

### 1.3 Logout
```
POST /auth/logout/
```

**Auth Required**: Yes

**Request Body**:
```json
{
    "refresh": "<refresh_token>"
}
```

**Response (200 OK)**:
```json
{
    "detail": "Successfully logged out."
}
```

**Side Effects**: Refresh token blacklisted

---

### 1.4 Token Refresh
```
POST /auth/token/refresh/
```

**Auth Required**: No (uses refresh token)

**Request Body**:
```json
{
    "refresh": "<refresh_token>"
}
```

**Response (200 OK)**:
```json
{
    "access": "<new_access_token>"
}
```

---

### 1.5 Get Current User
```
GET /auth/me/
```

**Auth Required**: Yes

**Response (200 OK)**:
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "buyer",
    "is_verified": true,
    "profile": {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "555-1234",
        "city": "Los Angeles",
        "state": "CA"
    },
    "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 1.6 Update Profile
```
PATCH /auth/me/
```

**Auth Required**: Yes

**Request Body**:
```json
{
    "profile": {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "555-1234"
    }
}
```

**Response (200 OK)**: Updated user object

---

### 1.7 Change Password
```
POST /auth/password/change/
```

**Auth Required**: Yes

**Request Body**:
```json
{
    "old_password": "currentPassword",
    "new_password": "newSecurePassword",
    "new_password_confirm": "newSecurePassword"
}
```

**Response (200 OK)**:
```json
{
    "detail": "Password updated successfully."
}
```

---

## 2. Vehicles Endpoints (`/vehicles/`)

### 2.1 List Vehicles
```
GET /vehicles/
```

**Auth Required**: No

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| page_size | int | Items per page (default: 12) |
| make | string | Filter by make |
| model | string | Filter by model |
| year__gte | int | Minimum year |
| year__lte | int | Maximum year |
| asking_price__gte | decimal | Min price |
| asking_price__lte | decimal | Max price |
| body_type | string | sedan, suv, truck, etc. |
| status | string | active (default for public) |
| ordering | string | created_at, -asking_price, etc. |

**Response (200 OK)**:
```json
{
    "count": 150,
    "next": "http://.../vehicles/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "dealer": {
                "id": "uuid",
                "business_name": "Premier Auto",
                "city": "Los Angeles",
                "state": "CA"
            },
            "vin": "1HGBH41JXMN109186",
            "make": "Toyota",
            "model": "Camry",
            "year": 2024,
            "trim": "XSE",
            "body_type": "sedan",
            "exterior_color": "Blue",
            "interior_color": "Black",
            "msrp": "35000.00",
            "asking_price": "33000.00",
            "images": [],
            "primary_image": null,
            "status": "active",
            "created_at": "2024-01-10T12:00:00Z"
        }
    ]
}
```

---

### 2.2 Get Vehicle Detail
```
GET /vehicles/{id}/
```

**Auth Required**: No

**Response (200 OK)**:
```json
{
    "id": "uuid",
    "dealer": {
        "id": "uuid",
        "business_name": "Premier Auto",
        "city": "Los Angeles",
        "state": "CA",
        "phone": "555-1234",
        "is_verified": true
    },
    "vin": "1HGBH41JXMN109186",
    "stock_number": "ST12345",
    "make": "Toyota",
    "model": "Camry",
    "year": 2024,
    "trim": "XSE",
    "body_type": "sedan",
    "exterior_color": "Blue",
    "interior_color": "Black",
    "msrp": "35000.00",
    "asking_price": "33000.00",
    "specifications": {
        "engine": "2.5L I4",
        "transmission": "8-Speed Automatic",
        "mpg_city": 28,
        "mpg_highway": 39
    },
    "features": ["Sunroof", "Navigation", "Leather Seats"],
    "images": [
        {
            "id": "uuid",
            "image_url": "/media/vehicles/image1.jpg",
            "is_primary": true,
            "display_order": 0
        }
    ],
    "status": "active",
    "views_count": 142,
    "created_at": "2024-01-10T12:00:00Z",
    "updated_at": "2024-01-10T12:00:00Z"
}
```

---

### 2.3 Create Vehicle (Dealers Only)
```
POST /vehicles/
```

**Auth Required**: Yes (Verified Dealer)

**Request Body**:
```json
{
    "vin": "1HGBH41JXMN109186",
    "stock_number": "ST12345",
    "make": "Toyota",
    "model": "Camry",
    "year": 2024,
    "trim": "XSE",
    "body_type": "sedan",
    "exterior_color": "Blue",
    "interior_color": "Black",
    "msrp": "35000.00",
    "floor_price": "30000.00",
    "asking_price": "33000.00",
    "specifications": {},
    "features": [],
    "status": "active"
}
```

**Response (201 Created)**: Vehicle object

**Side Effects**: Vehicle linked to authenticated dealer

---

### 2.4 Update Vehicle
```
PATCH /vehicles/{id}/
```

**Auth Required**: Yes (Owner dealer only)

**Request Body**: Partial vehicle fields

---

### 2.5 Delete Vehicle (Soft Delete)
```
DELETE /vehicles/{id}/
```

**Auth Required**: Yes (Owner dealer only)

**Side Effects**: Sets status to "inactive"

---

### 2.6 Get Featured Vehicles
```
GET /vehicles/featured/
```

**Auth Required**: No

**Response (200 OK)**:
```json
{
    "results": [/* 8 most recent active vehicles */]
}
```

**Frontend Trigger**: Homepage load

---

### 2.7 Get Available Makes
```
GET /vehicles/makes/
```

**Auth Required**: No

**Response (200 OK)**:
```json
{
    "makes": ["BMW", "Ford", "Honda", "Toyota", "..."]
}
```

---

### 2.8 Get Similar Vehicles
```
GET /vehicles/{id}/similar/
```

**Auth Required**: No

**Response (200 OK)**:
```json
{
    "results": [/* 4 similar vehicles by make and price range */]
}
```

---

### 2.9 Get Dealer's Inventory
```
GET /vehicles/my-inventory/
```

**Auth Required**: Yes (Dealer)

**Response**: All vehicles owned by dealer (all statuses)

---

### 2.10 Saved Vehicles

**Get Saved List**:
```
GET /vehicles/saved/
```

**Save Vehicle**:
```
POST /vehicles/saved/
Body: { "vehicle_id": "uuid" }
```

**Remove Saved**:
```
DELETE /vehicles/saved/{vehicle_id}/
```

---

### 2.11 Bulk Upload
```
POST /vehicles/bulk_upload/
Content-Type: multipart/form-data
```

**Auth Required**: Yes (Verified Dealer)

**Request Body**: FormData with `csv_file`

**Response (200 OK)**:
```json
{
    "success": true,
    "created": 10,
    "skipped": 2,
    "errors": [
        { "row": 5, "error": "Invalid VIN format" }
    ]
}
```

---

### 2.12 Download Bulk Template
```
GET /vehicles/bulk_upload_template/
```

**Auth Required**: Yes (Dealer)

**Response**: CSV file download

---

## 3. Dealers Endpoints (`/dealers/`)

### 3.1 List Dealers
```
GET /dealers/
```

**Auth Required**: No

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| city | string | Filter by city |
| state | string | Filter by state |
| search | string | Search by name |

**Response (200 OK)**:
```json
{
    "results": [
        {
            "id": "uuid",
            "business_name": "Premier Auto",
            "city": "Los Angeles",
            "state": "CA",
            "is_verified": true
        }
    ]
}
```

---

### 3.2 Get Dealer Detail
```
GET /dealers/{id}/
```

**Auth Required**: No

**Response**: Public dealer information

---

### 3.3 Register as Dealer
```
POST /dealers/register/
```

**Auth Required**: Yes (User with user_type='dealer')

**Request Body**:
```json
{
    "business_name": "Premier Auto",
    "license_number": "DL123456",
    "tax_id": "12-3456789",
    "phone": "555-1234",
    "street_address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001"
}
```

**Response (201 Created)**:
```json
{
    "id": "uuid",
    "business_name": "Premier Auto",
    "verification_status": "pending",
    ...
}
```

---

### 3.4 Get/Update My Profile
```
GET /dealers/me/
PATCH /dealers/me/
```

**Auth Required**: Yes (Dealer)

---

### 3.5 Get Dealer Stats
```
GET /dealers/me/stats/
```

**Auth Required**: Yes (Dealer)

**Response (200 OK)**:
```json
{
    "total_inventory": 50,
    "active_listings": 42,
    "pending_offers": 5,
    "sold_this_month": 8,
    "revenue_this_month": 350000
}
```

---

### 3.6 Get Pending Offers
```
GET /dealers/me/pending-offers/
```

**Auth Required**: Yes (Dealer)

**Response**: List of negotiations with pending offers

---

## 4. Negotiations Endpoints (`/negotiations/`)

### 4.1 List Negotiations
```
GET /negotiations/
```

**Auth Required**: Yes

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| status | string | active, accepted, rejected, etc. |

**Response (200 OK)**:
```json
{
    "results": [
        {
            "id": "uuid",
            "vehicle": {
                "id": "uuid",
                "title": "2024 Toyota Camry",
                "asking_price": "33000.00",
                "primary_image": "/media/..."
            },
            "buyer": { "id": "uuid", "email": "buyer@example.com" },
            "status": "active",
            "expires_at": "2024-01-13T12:00:00Z",
            "current_offer": {
                "id": "uuid",
                "amount": "31000.00",
                "offered_by": "dealer",
                "status": "pending",
                "created_at": "2024-01-10T14:00:00Z"
            },
            "is_my_turn": true,
            "my_role": "buyer",
            "created_at": "2024-01-10T12:00:00Z"
        }
    ]
}
```

---

### 4.2 Get Negotiation Detail
```
GET /negotiations/{id}/
```

**Auth Required**: Yes (Participant only)

**Response**: Full negotiation with all offers

---

### 4.3 Create Negotiation (Start Offer)
```
POST /negotiations/
```

**Auth Required**: Yes (Buyer)

**Request Body**:
```json
{
    "vehicle_id": "uuid",
    "initial_amount": 30000.00,
    "message": "I'm interested in this vehicle"
}
```

**Response (201 Created)**:
```json
{
    "id": "uuid",
    "vehicle": {...},
    "status": "active",
    "expires_at": "2024-01-13T12:00:00Z",
    "offers": [
        {
            "id": "uuid",
            "amount": "30000.00",
            "offered_by": "buyer",
            "status": "pending",
            "message": "I'm interested in this vehicle"
        }
    ]
}
```

**Side Effects**:
- Creates negotiation record
- Creates first offer
- Sends notification to dealer

---

### 4.4 Submit Counter Offer
```
POST /negotiations/{id}/submit-offer/
```

**Auth Required**: Yes (Participant whose turn it is)

**Request Body**:
```json
{
    "amount": "31500.00",
    "message": "How about this price?"
}
```

**Side Effects**:
- Creates new offer
- Marks previous offer as "countered"
- Resets expiration (adds 72 hours)
- Sends notification to other party

---

### 4.5 Accept Offer
```
POST /negotiations/{id}/accept/
```

**Auth Required**: Yes (Recipient of pending offer)

**Request Body**:
```json
{
    "confirm": true
}
```

**Response (200 OK)**:
```json
{
    "id": "uuid",
    "status": "accepted",
    "accepted_price": "31500.00",
    ...
}
```

**Side Effects**:
- Negotiation status → "accepted"
- Offer status → "accepted"
- Vehicle status → "pending_sale"
- Notification sent

---

### 4.6 Reject Negotiation (Dealer)
```
POST /negotiations/{id}/reject/
```

**Auth Required**: Yes (Dealer)

**Request Body**:
```json
{
    "reason": "Vehicle no longer available"
}
```

**Side Effects**:
- Negotiation status → "rejected"
- All pending offers → "rejected"
- Notification sent to buyer

---

### 4.7 Cancel Negotiation (Buyer)
```
POST /negotiations/{id}/cancel/
```

**Auth Required**: Yes (Buyer)

**Side Effects**:
- Negotiation status → "cancelled"

---

### 4.8 Get Active Negotiations
```
GET /negotiations/active/
```

**Auth Required**: Yes

**Response**: Only active negotiations requiring attention

---

### 4.9 Get Negotiation Stats
```
GET /negotiations/stats/
```

**Auth Required**: Yes

**Response (200 OK)**:
```json
{
    "total": 25,
    "active": 3,
    "accepted": 10,
    "rejected": 5,
    "cancelled": 4,
    "expired": 3,
    "completed": 0
}
```

---

## 5. Notifications Endpoints (`/notifications/`)

### 5.1 List Notifications
```
GET /notifications/
```

**Auth Required**: Yes

**Response (200 OK)**:
```json
{
    "results": [
        {
            "id": "uuid",
            "title": "New Offer Received",
            "message": "Buyer offered $30,000 for 2024 Toyota Camry",
            "notification_type": "offer",
            "related_link": "/negotiations/uuid",
            "is_read": false,
            "created_at": "2024-01-10T12:00:00Z"
        }
    ]
}
```

---

### 5.2 Mark as Read
```
PATCH /notifications/{id}/
Body: { "is_read": true }
```

---

## 6. Health Check

```
GET /health/
```

**Auth Required**: No

**Response (200 OK)**:
```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-10T12:00:00Z"
}
```

---

## Error Response Formats

### Validation Error (400)
```json
{
    "email": ["This field is required."],
    "password": ["Password must be at least 8 characters."]
}
```

### Authentication Error (401)
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### Permission Error (403)
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Not Found (404)
```json
{
    "detail": "Not found."
}
```

### Server Error (500)
```json
{
    "detail": "Internal server error."
}
```

---

## Pagination Format

All list endpoints return paginated responses:
```json
{
    "count": 100,          // Total items
    "next": "?page=2",     // Next page URL (null if last)
    "previous": null,      // Previous page URL (null if first)
    "results": [...]       // Array of items
}
```

Default page size: 12 items
