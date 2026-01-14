# Payless Cars - Application Overview & Purpose

## 1. Application Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Payless Cars |
| **Type** | B2B2C Automotive Marketplace with Negotiation System |
| **Version** | 1.0.0 |
| **Tech Stack** | Next.js 16 (Frontend) + Django 5 REST (Backend) |

## 2. Core Problem Statement

Traditional car buying suffers from:
1. **Information Asymmetry**: Buyers don't know the dealer's floor price
2. **Adversarial Negotiations**: In-person haggling creates stress
3. **Opaque Pricing**: MSRP doesn't reflect actual market value
4. **Time Waste**: Multiple dealership visits required

**Payless Cars Solution**: A digital marketplace where buyers can submit offers on vehicles and negotiate directly with dealers online, with transparent pricing tiers (MSRP, asking price, floor price).

## 3. Target Users

### 3.1 Buyers (Primary)
- **Demographics**: Adults 25-55 seeking vehicles
- **Tech Level**: Comfortable with web apps, mobile-friendly
- **Pain Points**: Dislike in-person negotiation, want transparency
- **Goals**: Get best price with minimal stress

### 3.2 Dealers (Primary)
- **Demographics**: Licensed car dealerships
- **Business Model**: Vehicle sales with negotiable margins
- **Pain Points**: Wasted time on unqualified leads
- **Goals**: Efficient lead conversion, inventory turnover

### 3.3 Admins (System)
- Admin users for dealer verification and system management
- Access to Django Admin panel

## 4. Primary Use Cases

### UC-1: Vehicle Browsing (Public)
- Browse all active vehicle listings
- Filter by make, model, year, price, body type
- View vehicle details and dealer information
- No authentication required

### UC-2: Buyer Registration & Login
- Register with email/password as buyer
- JWT-based authentication
- Profile management

### UC-3: Dealer Registration & Verification
- Register as dealer (requires business info)
- Upload verification documents
- Await admin verification
- Verified dealers can list vehicles

### UC-4: Vehicle Listing (Dealers Only)
- Create vehicle listings with:
  - VIN, stock number
  - Make, model, year, trim
  - MSRP, asking price, floor price (hidden from buyers)
  - Photos, specifications, features
- Manage inventory (edit, deactivate, mark sold)
- Bulk upload via CSV

### UC-5: Negotiation Flow
1. Buyer submits initial offer on a vehicle
2. System creates negotiation thread
3. Dealer receives notification
4. Dealer can accept, reject, or counter-offer
5. Buyer can accept, counter, or cancel
6. Continue until accepted or rejected
7. Accepted offer moves vehicle to "pending_sale"

### UC-6: Dashboard Analytics
- Buyers: Active negotiations, saved vehicles, history
- Dealers: Inventory stats, pending offers, revenue tracking

## 5. Functional Scope

### ✅ In Scope
| Feature | Description |
|---------|-------------|
| User Authentication | Register, login, logout, JWT tokens |
| Role-Based Access | Buyer, Dealer, Admin roles |
| Vehicle Listings | Full CRUD for dealers |
| Search & Filter | Make, model, year, price, body type |
| Negotiations | Offer/counter-offer system |
| Notifications | In-app alerts for offers |
| Saved Vehicles | Favorites/watchlist for buyers |
| Dealer Profiles | Business info, verification status |
| Image Upload | Vehicle photos |
| Bulk Upload | CSV import for inventory |
| Vehicle Comparison | Compare up to 4 vehicles side-by-side |

### ❌ Out of Scope (V1)
| Feature | Rationale |
|---------|-----------|
| Payment Processing | Handled offline after negotiation |
| Financing Calculator | Future enhancement |
| Vehicle History (Carfax) | Third-party integration |
| Chat/Messaging | Offers include messages |
| Mobile Apps | Responsive web only |
| Multi-language | English only |

## 6. Key Constraints & Assumptions

### Technical Constraints
- **Database**: SQLite for development, PostgreSQL for production
- **File Storage**: Local filesystem (media folder)
- **Authentication**: JWT tokens stored in localStorage
- **CORS**: Configured for localhost:3000 ↔ localhost:8000

### Business Constraints
- Dealers must be verified before listing vehicles
- One active negotiation per buyer-vehicle pair
- Offers expire after 72 hours by default
- Floor price visible only to dealer

### Assumptions
- Users have modern browsers (ES6+ support)
- Stable internet connection
- Dealers are licensed businesses
- All prices in USD

## 7. Data Flow Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  localhost:3000                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   Pages    │  │ Components │  │   Store    │                 │
│  │ (App Dir)  │  │   (React)  │  │ (Zustand)  │                 │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                 │
│        └───────────────┼───────────────┘                         │
│                        ▼                                         │
│                   API Client (Axios)                             │
│                   Bearer JWT Auth                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Backend (Django)                             │
│  localhost:8000/api/v1/                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     URL Router                                │ │
│  │  /auth/  /vehicles/  /dealers/  /negotiations/  /notifications│ │
│  └──────────────────────────────────────────────────────────────┘ │
│                        ▼                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                  │
│  │   Views    │  │ Serializers│  │  Services  │                  │
│  │ (ViewSets) │  │   (DRF)    │  │  (Logic)   │                  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                  │
│        └───────────────┼───────────────┘                          │
│                        ▼                                          │
│                   ORM (Django Models)                             │
└────────────────────────┬──────────────────────────────────────────┘
                         │ SQL
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Database (SQLite/PostgreSQL)                    │
│  Tables: accounts_customuser, dealers_dealer, vehicles_vehicle,   │
│          negotiations_negotiation, negotiations_offer,            │
│          notifications_notification, ...                          │
└────────────────────────────────────────────────────────────────────┘
```

## 8. Deployment Information

### Development Environment
| Service | URL | Command |
|---------|-----|---------|
| Frontend | http://localhost:3000 | `npm run dev` |
| Backend API | http://localhost:8000/api/v1/ | `python manage.py runserver` |
| Django Admin | http://localhost:8000/admin/ | (same as backend) |

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer1@email.com | pass1234 |
| Dealer | dealer1@premierauto.com | pass1234 |

## 9. Project Directory Structure

```
paylesscars/
├── backend/           # Django Backend
│   ├── apps/               # Django Apps
│   │   ├── accounts/       # User authentication & profiles
│   │   ├── dealers/        # Dealer management
│   │   ├── vehicles/       # Vehicle listings
│   │   ├── negotiations/   # Offer/counter-offer system
│   │   ├── notifications/  # Alert system
│   │   └── analytics/      # Dashboard stats
│   ├── config/             # Django settings
│   ├── core/               # Shared utilities
│   └── manage.py
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Pages (App Router)
│   │   ├── components/     # React components
│   │   ├── lib/            # API client, types, utils
│   │   └── store/          # Zustand state stores
│   └── package.json
├── docs/                   # Documentation (this folder)
└── scripts/                # Utility scripts
```
