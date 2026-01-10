# CarNegotiate Database Schema

## Overview
- **Database System**: PostgreSQL (Production) / SQLite (Dev)
- **Framework**: Django 4.2+
- **Total Apps**: 6 (accounts, vehicles, dealers, negotiations, notifications, analytics)

---

## App: accounts

### Model: User
**Table**: `accounts_user` (Custom User Model)
**Purpose**: Stores authentication and profile information for all users (buyers, dealers, admins).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| email | EmailField | UNIQUE, NOT NULL | User's email address (username) |
| password | CharField | NOT NULL | Hashed password |
| first_name | CharField | NULL | First name |
| last_name | CharField | NULL | Last name |
| role | CharField | Choices: buyer, dealer, admin | User role for permission handling |
| is_active | BooleanField | Default: True | Designates whether this user should be treated as active |
| is_staff | BooleanField | Default: False | Designates whether the user can log into this admin site |
| date_joined | DateTimeField | Auto Now Add | Date joined |
| last_login | DateTimeField | NULL | Last login timestamp |

### Model: UserProfile (Optional/Derived)
*Note: Profile data might be merged into User or separate table depending on implementation. Assuming integrated into User or separate Profile.*

---

## App: dealers

### Model: Dealer
**Table**: `dealers_dealer`
**Purpose**: Stores business information for dealer accounts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| user | OneToOneField | FK (accounts_user), UNIQUE | Link to User account |
| name | CharField | NOT NULL | Dealership Name |
| phone | CharField | NOT NULL | Contact phone number |
| address | CharField | NULL | Street address |
| city | CharField | NULL | City |
| state | CharField | NULL | State |
| zip_code | CharField | NULL | Zip code |
| license_number | CharField | NULL | Dealer license number |
| is_verified | BooleanField | Default: False | Verification status |
| created_at | DateTimeField | Auto Now Add | Record creation time |

### Model: DealerReview
**Table**: `dealers_dealerreview`
**Purpose**: Reviews left by buyers for dealers.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| dealer | ForeignKey | FK (dealers_dealer) | Reviewed dealer |
| reviewer | ForeignKey | FK (accounts_user) | User leaving review |
| rating | IntegerField | Min: 1, Max: 5 | Star rating |
| comment | TextField | NULL | Review text |
| created_at | DateTimeField | Auto Now Add | Review date |

---

## App: vehicles

### Model: Vehicle
**Table**: `vehicles_vehicle`
**Purpose**: Core listing data for cars.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| dealer | ForeignKey | FK (dealers_dealer) | Seller |
| vin | CharField | UNIQUE, Indexed | Vehicle Identification Number |
| make | CharField | Indexed | Manufacturer (e.g. Toyota) |
| model | CharField | Indexed | Model name (e.g. Camry) |
| year | IntegerField | Indexed | Model year |
| trim | CharField | NULL | Trim level |
| body_type | CharField | Choices | Sedan, SUV, etc. |
| price | DecimalField | Indexed | Listing price |
| mileage | IntegerField | Indexed | Odometer reading |
| transmission | CharField | Choices | Automatic, Manual, etc. |
| fuel_type | CharField | Choices | Gas, Hybrid, EV |
| exterior_color | CharField | NULL | Paint color |
| interior_color | CharField | NULL | Interior color |
| description | TextField | NULL | Seller's notes |
| status | CharField | Default: active | active, sold, pending |
| created_at | DateTimeField | Auto Now Add | Listing date |
| updated_at | DateTimeField | Auto Now | Last update |

### Model: VehicleImage
**Table**: `vehicles_vehicleimage`
**Purpose**: Photos associated with a vehicle listing.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| vehicle | ForeignKey | FK (vehicles_vehicle) | Related vehicle |
| image | ImageField | NOT NULL | Path to image file |
| is_primary | BooleanField | Default: False | Main listing photo |
| user_order | IntegerField | Default: 0 | Display order |

### Model: SavedVehicle
**Table**: `vehicles_savedvehicle`
**Purpose**: User favorites/watch list.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| user | ForeignKey | FK (accounts_user) | User saving the car |
| vehicle | ForeignKey | FK (vehicles_vehicle) | Saved car |
| created_at | DateTimeField | Auto Now Add | Save date |

---

## App: negotiations

### Model: Negotiation
**Table**: `negotiations_negotiation`
**Purpose**: Tracks a conversation/deal between a buyer and a dealer for a specific vehicle.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| vehicle | ForeignKey | FK (vehicles_vehicle) | Subject vehicle |
| buyer | ForeignKey | FK (accounts_user) | Buyer |
| dealer | ForeignKey | FK (dealers_dealer) | Seller |
| status | CharField | Default: open | open, accepted, rejected, cancelled |
| created_at | DateTimeField | Auto Now Add | Start date |
| last_activity | DateTimeField | Auto Now | Last message/offer |

### Model: Offer
**Table**: `negotiations_offer`
**Purpose**: Individual price offers within a negotiation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| negotiation | ForeignKey | FK (negotiations_negotiation) | Parent negotiation |
| amount | DecimalField | NOT NULL | Offer price |
| offer_type | CharField | Choices: buyer_offer, dealer_counter | Who made the offer |
| notes | TextField | NULL | Message with offer |
| is_accepted | BooleanField | Default: False | If this specific offer was accepted |
| created_at | DateTimeField | Auto Now Add | Offer time |

---

## App: notifications

### Model: Notification
**Table**: `notifications_notification`
**Purpose**: System alerts for users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| recipient | ForeignKey | FK (accounts_user) | Who receives the alert |
| title | CharField | NOT NULL | Short title |
| message | TextField | NOT NULL | Body text |
| notification_type | CharField | Choices | offer, system, message |
| related_link | CharField | NULL | URL to redirect to |
| is_read | BooleanField | Default: False | Read status |
| created_at | DateTimeField | Auto Now Add | Timestamp |

---

## App: analytics

### Model: AnalyticsEvent (Assumed)
**Table**: `analytics_analyticsevent`
**Purpose**: Tracking user behavior.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PK | Primary Key |
| event_type | CharField | Indexed | pageload, click, search |
| user | ForeignKey | FK (accounts_user), NULL | User (if logged in) |
| metadata | JSONField | NULL | Extra data |
| timestamp | DateTimeField | Auto Now Add | Event time |
