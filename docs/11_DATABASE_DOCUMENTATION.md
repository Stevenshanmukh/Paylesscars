# CarNegotiate - Database Documentation

## 1. Database Overview

| Attribute | Value |
|-----------|-------|
| **Development DB** | SQLite |
| **Production DB** | PostgreSQL |
| **ORM** | Django ORM |
| **Migration System** | Django Migrations |
| **Location (Dev)** | `carnegotiate/db.sqlite3` |

## 2. Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│    CustomUser       │       │     UserProfile     │
│─────────────────────│       │─────────────────────│
│ id (UUID) PK        │──────<│ user_id (FK) UNIQUE │
│ email (UNIQUE)      │       │ first_name          │
│ password            │       │ last_name           │
│ user_type           │       │ phone               │
│ is_active           │       │ city                │
│ is_verified         │       │ state               │
│ is_staff            │       │ zip_code            │
│ created_at          │       │ avatar              │
│ updated_at          │       └─────────────────────┘
└─────────────────────┘
         │
         │ user_type='dealer'
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│      Dealer         │       │   DealerDocument    │
│─────────────────────│       │─────────────────────│
│ id (UUID) PK        │──────<│ dealer_id (FK)      │
│ user_id (FK) UNIQUE │       │ document_type       │
│ business_name       │       │ file                │
│ license_number      │       │ is_verified         │
│ phone               │       └─────────────────────┘
│ street_address      │
│ city, state, zip    │
│ verification_status │
└─────────────────────┘
         │
         │ vehicles
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│      Vehicle        │       │    VehicleImage     │
│─────────────────────│       │─────────────────────│
│ id (UUID) PK        │──────<│ vehicle_id (FK)     │
│ dealer_id (FK)      │       │ image               │
│ vin (UNIQUE)        │       │ is_primary          │
│ stock_number        │       │ display_order       │
│ make, model, year   │       └─────────────────────┘
│ msrp                │
│ floor_price         │       ┌─────────────────────┐
│ asking_price        │       │    SavedVehicle     │
│ status              │       │─────────────────────│
└─────────────────────┘──────<│ vehicle_id (FK)     │
         │                    │ user_id (FK)        │
         │                    │ (unique_together)   │
         │                    └─────────────────────┘
         │
         │ negotiations
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│    Negotiation      │       │       Offer         │
│─────────────────────│       │─────────────────────│
│ id (UUID) PK        │──────<│ negotiation_id (FK) │
│ vehicle_id (FK)     │       │ amount              │
│ buyer_id (FK)       │       │ offered_by          │
│ status              │       │ message             │
│ expires_at          │       │ status              │
│ accepted_price      │       │ responded_at        │
│ completed_at        │       │ created_at          │
│ version             │       └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐
│    Notification     │
│─────────────────────│
│ id (UUID) PK        │
│ recipient_id (FK)   │ → CustomUser
│ title               │
│ message             │
│ notification_type   │
│ related_link        │
│ is_read             │
│ created_at          │
└─────────────────────┘
```

## 3. Table Definitions

### 3.1 accounts_customuser

**Purpose**: Main user authentication table. Uses email as username.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid4 | Unique identifier |
| email | VARCHAR(254) | UNIQUE, NOT NULL, INDEX | Login identifier |
| password | VARCHAR(128) | NOT NULL | Hashed password |
| user_type | VARCHAR(10) | NOT NULL, DEFAULT 'buyer' | buyer/dealer/admin |
| is_active | BOOLEAN | DEFAULT TRUE | Account active flag |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verified |
| is_staff | BOOLEAN | DEFAULT FALSE | Django admin access |
| is_superuser | BOOLEAN | DEFAULT FALSE | Full admin rights |
| created_at | DATETIME | AUTO NOW ADD | Registration date |
| updated_at | DATETIME | AUTO NOW | Last modified |
| last_login | DATETIME | NULL | Last login timestamp |

**Indexes**:
- `idx_email` on email
- `idx_user_type_active` on (user_type, is_active)

---

### 3.2 accounts_userprofile

**Purpose**: Extended profile information for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY, UNIQUE | Links to CustomUser |
| first_name | VARCHAR(100) | NULL | First name |
| last_name | VARCHAR(100) | NULL | Last name |
| phone | VARCHAR(20) | NULL | Contact phone |
| avatar | VARCHAR(100) | NULL | Profile image path |
| city | VARCHAR(100) | NULL | User city |
| state | VARCHAR(50) | NULL | User state |
| zip_code | VARCHAR(10) | NULL | Postal code |
| latitude | DECIMAL(9,6) | NULL | Geo coordinate |
| longitude | DECIMAL(9,6) | NULL | Geo coordinate |
| created_at | DATETIME | AUTO NOW ADD | Created |
| updated_at | DATETIME | AUTO NOW | Modified |

**Relationships**:
- `user_id` → `accounts_customuser.id` (ON DELETE CASCADE)

---

### 3.3 dealers_dealer

**Purpose**: Dealership business entity information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY, UNIQUE | Links to CustomUser |
| business_name | VARCHAR(200) | NOT NULL, INDEX | Dealership name |
| license_number | VARCHAR(50) | UNIQUE | State dealer license |
| tax_id | VARCHAR(20) | NOT NULL | Federal Tax ID |
| phone | VARCHAR(20) | NOT NULL | Business phone |
| website | VARCHAR(200) | NULL | Dealer website |
| street_address | VARCHAR(255) | NOT NULL | Street address |
| city | VARCHAR(100) | NOT NULL, INDEX | City |
| state | VARCHAR(50) | NOT NULL, INDEX | State |
| zip_code | VARCHAR(10) | NOT NULL | Zip code |
| latitude | DECIMAL(9,6) | NULL | Geo coordinate |
| longitude | DECIMAL(9,6) | NULL | Geo coordinate |
| verification_status | VARCHAR(20) | DEFAULT 'pending', INDEX | pending/verified/rejected/suspended |
| verified_at | DATETIME | NULL | Verification date |
| verification_notes | TEXT | NULL | Admin notes |
| created_at | DATETIME | AUTO NOW ADD | Created |
| updated_at | DATETIME | AUTO NOW | Modified |

**Relationships**:
- `user_id` → `accounts_customuser.id` (ON DELETE CASCADE)

**Indexes**:
- `idx_verification_status` on verification_status
- `idx_city_state` on (city, state)
- `idx_geo` on (latitude, longitude)

---

### 3.4 dealers_dealerdocument

**Purpose**: Verification documents uploaded by dealers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| dealer_id | UUID | FOREIGN KEY | Links to Dealer |
| document_type | VARCHAR(20) | NOT NULL | license/insurance/w9/bank_verification/other |
| file | VARCHAR(100) | NOT NULL | File path |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| is_verified | BOOLEAN | DEFAULT FALSE | Admin verified |
| verified_at | DATETIME | NULL | Verification date |
| notes | TEXT | NULL | Admin notes |
| created_at | DATETIME | AUTO NOW ADD | Upload date |
| updated_at | DATETIME | AUTO NOW | Modified |

---

### 3.5 vehicles_vehicle

**Purpose**: Main vehicle listing data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| dealer_id | UUID | FOREIGN KEY | Links to Dealer |
| vin | VARCHAR(17) | UNIQUE, INDEX | Vehicle Identification Number |
| stock_number | VARCHAR(50) | NOT NULL | Dealer stock number |
| make | VARCHAR(50) | NOT NULL, INDEX | Manufacturer |
| model | VARCHAR(100) | NOT NULL, INDEX | Model name |
| year | SMALLINT | NOT NULL, INDEX | Model year |
| trim | VARCHAR(100) | NULL | Trim level |
| body_type | VARCHAR(20) | NOT NULL, INDEX | sedan/suv/truck/etc |
| exterior_color | VARCHAR(50) | NOT NULL | Paint color |
| interior_color | VARCHAR(50) | NOT NULL | Interior color |
| msrp | DECIMAL(12,2) | NOT NULL | Manufacturer's price |
| floor_price | DECIMAL(12,2) | NOT NULL | Minimum acceptable (hidden) |
| asking_price | DECIMAL(12,2) | NOT NULL, INDEX | Listed price |
| specifications | JSON | DEFAULT {} | Vehicle specs |
| features | JSON | DEFAULT [] | Feature list |
| status | VARCHAR(20) | DEFAULT 'draft' | draft/active/pending_sale/sold/inactive |
| views_count | INTEGER | DEFAULT 0 | View counter |
| created_at | DATETIME | AUTO NOW ADD, INDEX | Listing date |
| updated_at | DATETIME | AUTO NOW | Modified |

**Relationships**:
- `dealer_id` → `dealers_dealer.id` (ON DELETE CASCADE)

**Indexes**:
- `idx_status_dealer` on (status, dealer_id)
- `idx_make_model_year` on (make, model, year)
- `idx_price` on asking_price
- `idx_body_type` on body_type
- `idx_created` on -created_at

**Constraints**:
- CHECK: `floor_price <= msrp`
- CHECK: `asking_price >= floor_price`

---

### 3.6 vehicles_vehicleimage

**Purpose**: Images associated with vehicle listings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| vehicle_id | UUID | FOREIGN KEY | Links to Vehicle |
| image | VARCHAR(100) | NOT NULL | Image file path |
| thumbnail_url | VARCHAR(200) | NULL | Thumbnail URL |
| medium_url | VARCHAR(200) | NULL | Medium size URL |
| large_url | VARCHAR(200) | NULL | Large size URL |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary listing image |
| display_order | SMALLINT | DEFAULT 0 | Sort order |
| alt_text | VARCHAR(255) | NULL | Accessibility text |
| created_at | DATETIME | AUTO NOW ADD | Upload date |
| updated_at | DATETIME | AUTO NOW | Modified |

**Note**: Only one image per vehicle can have `is_primary=True` (enforced in model save)

---

### 3.7 vehicles_savedvehicle

**Purpose**: User favorites/watchlist.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Links to CustomUser |
| vehicle_id | UUID | FOREIGN KEY | Links to Vehicle |
| created_at | DATETIME | AUTO NOW ADD | Save date |
| updated_at | DATETIME | AUTO NOW | Modified |

**Constraints**:
- UNIQUE: (user_id, vehicle_id) - prevents duplicate saves

---

### 3.8 negotiations_negotiation

**Purpose**: Container for buyer-dealer negotiation threads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| vehicle_id | UUID | FOREIGN KEY | Links to Vehicle |
| buyer_id | UUID | FOREIGN KEY | Links to CustomUser |
| status | VARCHAR(20) | DEFAULT 'active', INDEX | active/accepted/rejected/expired/cancelled/completed |
| expires_at | DATETIME | NOT NULL, INDEX | Expiration timestamp |
| accepted_price | DECIMAL(12,2) | NULL | Final agreed price |
| completed_at | DATETIME | NULL | Completion date |
| version | INTEGER | DEFAULT 1 | Optimistic lock version |
| created_at | DATETIME | AUTO NOW ADD | Start date |
| updated_at | DATETIME | AUTO NOW | Last activity |

**Relationships**:
- `vehicle_id` → `vehicles_vehicle.id` (ON DELETE PROTECT)
- `buyer_id` → `accounts_customuser.id` (ON DELETE CASCADE)

**Indexes**:
- `idx_status_buyer` on (status, buyer_id)
- `idx_vehicle_status` on (vehicle_id, status)
- `idx_expires` on expires_at

**Constraints**:
- UNIQUE: (vehicle_id, buyer_id) WHERE status='active' - one active negotiation per buyer-vehicle

---

### 3.9 negotiations_offer

**Purpose**: Individual price offers within negotiations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| negotiation_id | UUID | FOREIGN KEY | Links to Negotiation |
| amount | DECIMAL(12,2) | NOT NULL | Offer price |
| offered_by | VARCHAR(10) | NOT NULL | buyer/dealer |
| message | TEXT(500) | NULL | Offer message |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/accepted/rejected/countered/expired |
| responded_at | DATETIME | NULL | Response timestamp |
| created_at | DATETIME | AUTO NOW ADD | Offer date |
| updated_at | DATETIME | AUTO NOW | Modified |

**Relationships**:
- `negotiation_id` → `negotiations_negotiation.id` (ON DELETE CASCADE)

**Indexes**:
- `idx_negotiation_created` on (negotiation_id, -created_at)
- `idx_status` on status

---

### 3.10 notifications_notification

**Purpose**: In-app user notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| recipient_id | UUID | FOREIGN KEY | Links to CustomUser |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| notification_type | VARCHAR(20) | NOT NULL | offer/counter/accepted/rejected/expired/system |
| related_link | VARCHAR(255) | NULL | Navigate URL |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | DATETIME | AUTO NOW ADD | Send date |
| updated_at | DATETIME | AUTO NOW | Modified |

**Relationships**:
- `recipient_id` → `accounts_customuser.id` (ON DELETE CASCADE)

---

## 4. Base Model

All models inherit from `TimeStampedModel`:

```python
class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
```

---

## 5. Data Flow Examples

### 5.1 User Registration → Vehicle Listing

```
1. User registers (user_type='dealer')
   INSERT INTO accounts_customuser (email, password, user_type='dealer')
   
2. User profile created automatically (signal/hook)
   INSERT INTO accounts_userprofile (user_id, ...)

3. Dealer completes business registration
   INSERT INTO dealers_dealer (user_id, business_name, license_number, ...)
   
4. Admin verifies dealer
   UPDATE dealers_dealer SET verification_status='verified', verified_at=NOW()
   
5. Dealer creates vehicle listing
   INSERT INTO vehicles_vehicle (dealer_id, vin, make, model, ...)
   
6. Images uploaded
   INSERT INTO vehicles_vehicleimage (vehicle_id, image, is_primary=TRUE)
```

### 5.2 Negotiation Flow

```
1. Buyer views vehicle
   UPDATE vehicles_vehicle SET views_count = views_count + 1

2. Buyer starts negotiation
   INSERT INTO negotiations_negotiation (vehicle_id, buyer_id, status='active', expires_at=NOW()+72h)
   INSERT INTO negotiations_offer (negotiation_id, amount=30000, offered_by='buyer', status='pending')
   INSERT INTO notifications_notification (recipient_id=dealer.user_id, title='New Offer', ...)

3. Dealer counters
   UPDATE negotiations_offer SET status='countered', responded_at=NOW() WHERE id=<first_offer>
   INSERT INTO negotiations_offer (negotiation_id, amount=31500, offered_by='dealer', status='pending')
   UPDATE negotiations_negotiation SET expires_at=NOW()+72h
   INSERT INTO notifications_notification (recipient_id=buyer_id, ...)

4. Buyer accepts
   UPDATE negotiations_offer SET status='accepted', responded_at=NOW() WHERE id=<dealer_offer>
   UPDATE negotiations_negotiation SET status='accepted', accepted_price=31500
   UPDATE vehicles_vehicle SET status='pending_sale' WHERE id=<vehicle_id>
   INSERT INTO notifications_notification (recipient_id=dealer.user_id, ...)
```

---

## 6. Sample Data

### Sample User
```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "buyer@example.com",
    "user_type": "buyer",
    "is_active": true,
    "is_verified": true
}
```

### Sample Dealer
```json
{
    "id": "d1e2f3a4-b5c6-7890-def0-123456789abc",
    "user_id": "c1d2e3f4-...",
    "business_name": "Premier Auto Los Angeles",
    "license_number": "CA-DL-123456",
    "verification_status": "verified",
    "city": "Los Angeles",
    "state": "CA"
}
```

### Sample Vehicle
```json
{
    "id": "v1e2h3i4-...",
    "dealer_id": "d1e2f3a4-...",
    "vin": "1HGBH41JXMN109186",
    "make": "Toyota",
    "model": "Camry",
    "year": 2024,
    "msrp": "35000.00",
    "floor_price": "30000.00",
    "asking_price": "33000.00",
    "status": "active"
}
```

### Sample Negotiation
```json
{
    "id": "n1e2g3o4-...",
    "vehicle_id": "v1e2h3i4-...",
    "buyer_id": "a1b2c3d4-...",
    "status": "active",
    "expires_at": "2024-01-13T12:00:00Z"
}
```

### Sample Offer
```json
{
    "id": "o1f2f3e4-...",
    "negotiation_id": "n1e2g3o4-...",
    "amount": "30000.00",
    "offered_by": "buyer",
    "status": "pending",
    "message": "Interested in this vehicle"
}
```

---

## 7. Migration Commands

```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Reset database (dev only)
rm db.sqlite3
python manage.py migrate
```
