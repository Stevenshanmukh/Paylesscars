# Payless Cars - Page-by-Page UI Documentation

## Page Index

| Route | Page Name | Access |
|-------|-----------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/register` | Registration | Public |
| `/vehicles` | Vehicle Listings | Public |
| `/vehicles/[id]` | Vehicle Details | Public |
| `/saved` | Saved Vehicles | Buyer Auth |
| `/dashboard` | Buyer Dashboard | Buyer Auth |
| `/negotiations` | Negotiations List | Auth |
| `/negotiations/[id]` | Negotiation Detail | Auth |
| `/dealer` | Dealer Dashboard | Dealer Auth |
| `/dealer/inventory` | Inventory Management | Dealer Auth |
| `/dealer/inventory/new` | Add Vehicle | Dealer Auth |
| `/dealer/inventory/[id]/edit` | Edit Vehicle | Dealer Auth |
| `/dealer/offers` | Pending Offers | Dealer Auth |
| `/dealer/onboarding` | Dealer Registration | Auth |
| `/settings` | User Settings | Auth |
| `/how-it-works` | How It Works | Public |
| `/for-dealers` | Dealer Landing | Public |

---

## Page: Home (`/`)

### Purpose
Landing page showcasing the platform value proposition and featured vehicles.

### Entry Points
- Direct URL navigation
- Logo click from any page
- Logout redirect

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Header (transparent variant, positioned absolute over hero)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        HERO SECTION                             │
│   - Background gradient                                         │
│   - Headline: "Find Your Perfect Car. Negotiate Your Price."   │
│   - Subheadline text                                            │
│   - Search form with make/model/price inputs                    │
│   - CTA Button: "Search Vehicles"                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    TRUST INDICATORS                             │
│   - Stat cards: Vehicles Listed | Deals Closed | Dealers        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   FEATURED VEHICLES                             │
│   - Section title: "Featured Deals"                             │
│   - Carousel of 8 vehicle cards                                 │
│   - Navigation arrows                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     HOW IT WORKS                                │
│   - 4-step process with icons                                   │
│   - 1. Browse | 2. Make Offer | 3. Negotiate | 4. Deal          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   VALUE PROPOSITION                             │
│   - Feature cards: Transparent Pricing, Direct Negotiation, etc │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     TESTIMONIALS                                │
│   - Customer review cards                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    POPULAR MAKES                                │
│   - Grid of brand logos (Toyota, Honda, Ford, etc.)             │
│   - Click to filter vehicles                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     CALL TO ACTION                              │
│   - "Ready to start?" section                                   │
│   - Buttons: Browse Vehicles | For Dealers                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        FOOTER                                   │
│   - Links, copyright, social media                              │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
| Component | Location | Purpose |
|-----------|----------|---------|
| `<Header variant="transparent">` | Top | Navigation (absolute) |
| `<Hero>` | Section 1 | Hero with search |
| `<TrustIndicators>` | Section 2 | Stats bar |
| `<FeaturedVehicles>` | Section 3 | Vehicle carousel |
| `<HowItWorks>` | Section 4 | Process steps |
| `<ValueProposition>` | Section 5 | Feature highlights |
| `<Testimonials>` | Section 6 | Social proof |
| `<PopularMakes>` | Section 7 | Brand grid |
| `<CallToAction>` | Section 8 | Final CTA |
| `<Footer>` | Bottom | Site footer |

### Interactive Elements

| Element | Action | Outcome |
|---------|--------|---------|
| Search button | Click | Navigate to `/vehicles?filters` |
| Featured vehicle card | Click | Navigate to `/vehicles/[id]` |
| Popular make logo | Click | Navigate to `/vehicles?make=X` |
| Browse Vehicles CTA | Click | Navigate to `/vehicles` |
| For Dealers CTA | Click | Navigate to `/for-dealers` |
| Login link | Click | Navigate to `/login` |
| Register link | Click | Navigate to `/register` |

### API Calls
| Trigger | Endpoint | Purpose |
|---------|----------|---------|
| Page load | `GET /vehicles/featured/` | Fetch featured vehicles |
| Page load | `GET /vehicles/makes/` | Fetch available makes |

### State Changes
- None (stateless public page)

---

## Page: Login (`/login`)

### Purpose
Authenticate existing users.

### Entry Points
- Header "Login" link
- Redirect from protected routes
- Register page "Sign in" link

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header (default variant)                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│              ┌─────────────────────────────────┐               │
│              │         LOGIN CARD              │               │
│              │                                 │               │
│              │  ┌─────────────────────────┐   │               │
│              │  │ Email input             │   │               │
│              │  └─────────────────────────┘   │               │
│              │                                 │               │
│              │  ┌─────────────────────────┐   │               │
│              │  │ Password input          │   │               │
│              │  └─────────────────────────┘   │               │
│              │                                 │               │
│              │  [✓] Remember me               │               │
│              │                                 │               │
│              │  ┌─────────────────────────┐   │               │
│              │  │     Sign In Button      │   │               │
│              │  └─────────────────────────┘   │               │
│              │                                 │               │
│              │  Forgot password? (link)        │               │
│              │  Don't have account? Register   │               │
│              └─────────────────────────────────┘               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Components Used
- `<Header>`
- `<LoginForm>` or inline form
- `<Input type="email">`
- `<Input type="password">`
- `<Button>` (primary)
- `<Footer>`

### Interactive Elements

| Element | Action | Validation | Outcome |
|---------|--------|------------|---------|
| Email input | Type | Required, email format | Update form state |
| Password input | Type | Required, min 8 chars | Update form state |
| Sign In button | Click | All fields valid | Submit login |
| Register link | Click | - | Navigate to `/register` |
| Forgot password | Click | - | Navigate to password reset |

### API Calls
| Trigger | Endpoint | Purpose |
|---------|----------|---------|
| Form submit | `POST /auth/login/` | Authenticate user |
| Success | `GET /auth/me/` | Fetch user profile |

### State Changes
| State | Before | After |
|-------|--------|-------|
| `authStore.isAuthenticated` | false | true |
| `authStore.user` | null | User object |
| `localStorage.access_token` | - | JWT token |
| `localStorage.refresh_token` | - | JWT token |

### Navigation Outcomes
| Scenario | Destination |
|----------|-------------|
| Login success (buyer) | `/dashboard` |
| Login success (dealer) | `/dealer` |
| Login failure | Stay on page, show error |

---

## Page: Registration (`/register`)

### Purpose
Create new user accounts.

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│              ┌─────────────────────────────────┐               │
│              │      REGISTRATION CARD          │               │
│              │                                 │               │
│              │  User Type Toggle:              │               │
│              │  [Buyer] [Dealer]               │               │
│              │                                 │               │
│              │  Email input                    │               │
│              │  Password input                 │               │
│              │  Confirm Password input         │               │
│              │                                 │               │
│              │  [Create Account] button        │               │
│              │                                 │               │
│              │  Already have account? Login    │               │
│              └─────────────────────────────────┘               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Interactive Elements

| Element | Action | Outcome |
|---------|--------|---------|
| User type toggle | Click Buyer/Dealer | Sets user_type field |
| Create Account | Click | Submit registration |
| Login link | Click | Navigate to `/login` |

### API Calls
```
POST /auth/register/
Body: { email, password, password_confirm, user_type }
Response: { user, access, refresh }
```

### Navigation Outcomes
| User Type | Destination |
|-----------|-------------|
| Buyer | `/dashboard` |
| Dealer | `/dealer/onboarding` (complete business info) |

---

## Page: Vehicle Listings (`/vehicles`)

### Purpose
Browse and filter all active vehicle listings.

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌─────────────────────────────────────────┐  │
│ │              │ │                                         │  │
│ │   FILTERS    │ │           VEHICLE GRID                  │  │
│ │   SIDEBAR    │ │                                         │  │
│ │              │ │  ┌───────┐ ┌───────┐ ┌───────┐         │  │
│ │  Make ▼      │ │  │ Card  │ │ Card  │ │ Card  │         │  │
│ │  Model ▼     │ │  └───────┘ └───────┘ └───────┘         │  │
│ │  Year Range  │ │                                         │  │
│ │  Price Range │ │  ┌───────┐ ┌───────┐ ┌───────┐         │  │
│ │  Body Type ▼ │ │  │ Card  │ │ Card  │ │ Card  │         │  │
│ │              │ │  └───────┘ └───────┘ └───────┘         │  │
│ │  [Clear]     │ │                                         │  │
│ │  [Apply]     │ │        Pagination controls              │  │
│ │              │ │                                         │  │
│ └──────────────┘ └─────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Components Used
- `<VehicleFilters>` - Sidebar filter panel
- `<VehicleGrid>` - Grid container
- `<VehicleCard>` - Individual vehicle card
- `<Pagination>` - Page controls

### Interactive Elements

| Element | Action | Outcome |
|---------|--------|---------|
| Filter dropdown | Select | Update filter state |
| Apply Filters | Click | Fetch filtered vehicles |
| Clear Filters | Click | Reset all filters |
| Vehicle card | Click | Navigate to `/vehicles/[id]` |
| Save heart icon | Click (auth) | Save/unsave vehicle |
| Pagination | Click | Fetch page N |

### API Calls
```
GET /vehicles/?make=Toyota&year__gte=2020&page=1
```

### URL State
Filters persist in URL query params:
```
/vehicles?make=Toyota&year_min=2020&price_max=50000&body_type=suv&page=2
```

---

## Page: Vehicle Details (`/vehicles/[id]`)

### Purpose
Display complete vehicle information and enable offer creation.

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌─────────────────────────────────┐ ┌───────────────────────┐ │
│ │                                 │ │                       │ │
│ │        IMAGE GALLERY            │ │    PRICE CARD         │ │
│ │                                 │ │                       │ │
│ │   [Main Image]                  │ │   $33,000             │ │
│ │                                 │ │   MSRP: $35,000       │ │
│ │   [Thumbnail] [Thumb] [Thumb]  │ │   You save: $2,000    │ │
│ │                                 │ │                       │ │
│ └─────────────────────────────────┘ │   [Make Offer]        │ │
│                                     │   [Save Vehicle ♡]    │ │
│ ┌─────────────────────────────────┐ │                       │ │
│ │ VEHICLE TITLE                   │ └───────────────────────┘ │
│ │ 2024 Toyota Camry XSE           │                           │
│ └─────────────────────────────────┘                           │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ SPECIFICATIONS                                          │   │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│ │ │ Body: Sedan │ │ Year: 2024  │ │ Color: Blue │        │   │
│ │ └─────────────┘ └─────────────┘ └─────────────┘        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ FEATURES                                                │   │
│ │ ✓ Sunroof  ✓ Navigation  ✓ Leather Seats  ...          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ DEALER INFORMATION                                      │   │
│ │ Premier Auto Los Angeles  |  (555) 123-4567             │   │
│ │ 123 Main St, Los Angeles, CA 90001                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ SIMILAR VEHICLES                                        │   │
│ │ [Card] [Card] [Card] [Card]                             │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Components Used
- `<ImageGallery>` - Main image with thumbnails
- `<PriceCard>` - Price display with save/deal badges
- `<VehicleSpecs>` - Specification grid
- `<FeatureList>` - Feature badges
- `<DealerCard>` - Dealer contact info
- `<SimilarVehicles>` - Related vehicles carousel

### Interactive Elements

| Element | Auth Required | Action | Outcome |
|---------|--------------|--------|---------|
| Image thumbnail | No | Click | Switch main image |
| Make Offer button | Yes | Click | Open offer modal |
| Save Vehicle | Yes | Click | Add to saved list |
| Dealer phone | No | Click | Initiate call |
| Similar vehicle | No | Click | Navigate to that vehicle |

### API Calls
| Trigger | Endpoint |
|---------|----------|
| Page load | `GET /vehicles/{id}/` |
| Page load | `GET /vehicles/{id}/similar/` |
| Save click | `POST /vehicles/saved/` |
| Make offer | `POST /negotiations/` |

### Offer Modal
When "Make Offer" is clicked:
```
┌─────────────────────────────────────┐
│        MAKE AN OFFER                │
│                                     │
│  Asking Price: $33,000              │
│                                     │
│  Your Offer: [$___________]         │
│                                     │
│  Message (optional):                │
│  [________________________]         │
│  [________________________]         │
│                                     │
│  [Cancel]        [Submit Offer]     │
└─────────────────────────────────────┘
```

---

## Page: Dealer Dashboard (`/dealer`)

### Purpose
Main dashboard for dealers showing key metrics and actions.

### Access
- Dealer role only
- Verified dealers see full dashboard
- Pending verification shows limited view

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌─────────────────────────────────────────┐  │
│ │   SIDEBAR    │ │         MAIN CONTENT                    │  │
│ │              │ │                                         │  │
│ │  Dashboard ● │ │  Welcome, [Dealer Name]                 │  │
│ │  Inventory   │ │                                         │  │
│ │  Offers      │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│ │  Analytics   │ │  │ Total   │ │ Active  │ │ Pending │   │  │
│ │  Settings    │ │  │ Inv: 50 │ │ List:42 │ │ Offers:5│   │  │
│ │              │ │  └─────────┘ └─────────┘ └─────────┘   │  │
│ │              │ │                                         │  │
│ │              │ │  ┌─────────┐ ┌─────────┐               │  │
│ │              │ │  │ Revenue │ │ Sold    │               │  │
│ │              │ │  │ $125K   │ │ 8 cars  │               │  │
│ │              │ │  └─────────┘ └─────────┘               │  │
│ │              │ │                                         │  │
│ │              │ │  RECENT OFFERS                          │  │
│ │              │ │  ┌───────────────────────────────────┐ │  │
│ │              │ │  │ Offer list table                  │ │  │
│ │              │ │  └───────────────────────────────────┘ │  │
│ │              │ │                                         │  │
│ │              │ │  QUICK ACTIONS                          │  │
│ │              │ │  [Add Vehicle] [View All Offers]        │  │
│ └──────────────┘ └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Stat Cards
| Stat | Source | Description |
|------|--------|-------------|
| Total Inventory | `dealers/me/stats` | All vehicles count |
| Active Listings | `dealers/me/stats` | status=active count |
| Pending Offers | `dealers/me/pending-offers` | Offers awaiting response |
| Revenue | `dealers/me/stats` | Sum of sold vehicle prices |
| Sold This Month | `dealers/me/stats` | Sold count this month |

### Interactive Elements

| Element | Action | Outcome |
|---------|--------|---------|
| Sidebar nav item | Click | Navigate to section |
| Add Vehicle | Click | Navigate to `/dealer/inventory/new` |
| Offer row | Click | Navigate to `/negotiations/[id]` |
| View All Offers | Click | Navigate to `/dealer/offers` |

### API Calls
| Trigger | Endpoint |
|---------|----------|
| Page load | `GET /dealers/me/stats/` |
| Page load | `GET /dealers/me/pending-offers/` |
| Page load | `GET /vehicles/my-inventory/?limit=5` |

---

## Page: Negotiations List (`/negotiations`)

### Purpose
List all user's negotiations with filtering.

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  MY NEGOTIATIONS                                               │
│                                                                │
│  Filter tabs: [All] [Active] [Accepted] [Rejected]             │
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐│
│  │ NEGOTIATION CARD                                          ││
│  │ ┌───────┐ 2024 Toyota Camry                               ││
│  │ │ Image │ Status: Active  |  Your turn                    ││
│  │ └───────┘ Current offer: $32,000 (by dealer)              ││
│  │           Expires in 48 hours                              ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐│
│  │ NEGOTIATION CARD                                          ││
│  │ ...                                                       ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Interactive Elements

| Element | Action | Outcome |
|---------|--------|---------|
| Filter tab | Click | Filter list by status |
| Negotiation card | Click | Navigate to `/negotiations/[id]` |

### API Calls
```
GET /negotiations/?status=active
```

---

## Page: Negotiation Detail (`/negotiations/[id]`)

### Purpose
View negotiation history and submit/respond to offers.

### Layout Structure
```
┌────────────────────────────────────────────────────────────────┐
│ Header                                                         │
├────────────────────────────────────────────────────────────────┤
│ ← Back to Negotiations                                         │
│                                                                │
│ ┌──────────────────────────┐ ┌───────────────────────────────┐│
│ │                          │ │ NEGOTIATION STATUS            ││
│ │      VEHICLE INFO        │ │                               ││
│ │                          │ │ Status: Active                ││
│ │  [Vehicle Image]         │ │ Asking: $33,000               ││
│ │  2024 Toyota Camry       │ │ Current: $31,500              ││
│ │  Asking: $33,000         │ │ Your role: Buyer              ││
│ │                          │ │ Expires: 47h 32m              ││
│ │  [View Vehicle]          │ │                               ││
│ └──────────────────────────┘ └───────────────────────────────┘│
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │                    OFFER HISTORY                            ││
│ │                                                             ││
│ │  ┌─ Buyer ─────────────────────────────────────────────┐   ││
│ │  │ $30,000 - "Interested in this car"                  │   ││
│ │  │ Jan 10, 2024 2:30 PM                                │   ││
│ │  └─────────────────────────────────────────────────────┘   ││
│ │                                                             ││
│ │  ┌─ Dealer ────────────────────────────────────────────┐   ││
│ │  │ $31,500 - "Best I can do"                           │   ││
│ │  │ Jan 10, 2024 4:15 PM              ● PENDING         │   ││
│ │  └─────────────────────────────────────────────────────┘   ││
│ │                                                             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ACTION BUTTONS (if it's my turn)                            ││
│ │                                                             ││
│ │  [Accept $31,500]   [Counter Offer]   [Decline]             ││
│ │                                                             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└────────────────────────────────────────────────────────────────┘
```

### Interactive Elements (Buyer View)

| Element | Visible When | Action | Outcome |
|---------|--------------|--------|---------|
| Accept | Dealer offer pending | Click | Accept deal |
| Counter Offer | Dealer offer pending | Click | Open counter modal |
| Cancel | Any active | Click | Cancel negotiation |

### Interactive Elements (Dealer View)

| Element | Visible When | Action | Outcome |
|---------|--------------|--------|---------|
| Accept | Buyer offer pending | Click | Accept deal |
| Counter Offer | Buyer offer pending | Click | Open counter modal |
| Reject | Any active | Click | Reject negotiation |

### API Calls
| Trigger | Endpoint |
|---------|----------|
| Page load | `GET /negotiations/{id}/` |
| Accept | `POST /negotiations/{id}/accept/` |
| Counter | `POST /negotiations/{id}/submit-offer/` |
| Reject | `POST /negotiations/{id}/reject/` |
| Cancel | `POST /negotiations/{id}/cancel/` |
