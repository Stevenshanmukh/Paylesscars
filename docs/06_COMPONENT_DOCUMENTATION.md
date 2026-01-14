# Payless Cars - Component Documentation

## 1. Component Architecture

### 1.1 Directory Structure
```
src/components/
├── ui/                 # Base UI primitives
├── layout/             # Page structure components
├── home/               # Home page sections
├── vehicles/           # Vehicle-related components
├── negotiations/       # Negotiation components
├── dealers/            # Dealer components
└── auth/               # Authentication components
```

### 1.2 Component Naming Conventions
- PascalCase for component names
- Descriptive, action-oriented names
- Suffix with purpose (Card, List, Form, Button)

---

## 2. UI Components (`components/ui/`)

### 2.1 Button

**File**: `components/ui/Button.tsx`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'ghost' \| 'destructive' \| 'outline'` | No | `'primary'` | Visual style variant |
| size | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Size variant |
| disabled | boolean | No | false | Disable interaction |
| loading | boolean | No | false | Show loading spinner |
| fullWidth | boolean | No | false | Width 100% |
| leftIcon | ReactNode | No | - | Icon before text |
| rightIcon | ReactNode | No | - | Icon after text |
| onClick | () => void | No | - | Click handler |
| children | ReactNode | Yes | - | Button content |

**Usage**:
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
    Start Negotiating
</Button>

<Button variant="ghost" leftIcon={<Save />} loading={isSaving}>
    Save
</Button>
```

**Internal State**: None

**Styling**:
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Ghost: `bg-transparent hover:bg-muted`
- Destructive: `bg-destructive text-white`

---

### 2.2 Card

**File**: `components/ui/Card.tsx`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| className | string | No | - | Additional classes |
| hoverable | boolean | No | false | Add hover shadow effect |
| children | ReactNode | Yes | - | Card content |

**Sub-components**:
- `Card.Header` - Top section with title
- `Card.Body` - Main content area
- `Card.Footer` - Bottom actions area

**Usage**:
```tsx
<Card hoverable>
    <Card.Header>
        <h3>Vehicle Title</h3>
    </Card.Header>
    <Card.Body>
        {/* content */}
    </Card.Body>
    <Card.Footer>
        <Button>View Details</Button>
    </Card.Footer>
</Card>
```

---

### 2.3 Input

**File**: `components/ui/Input.tsx`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | string | No | 'text' | Input type (text, email, password, etc.) |
| label | string | No | - | Field label |
| placeholder | string | No | - | Placeholder text |
| value | string | No | - | Controlled value |
| onChange | (value: string) => void | No | - | Change handler |
| error | string | No | - | Error message |
| disabled | boolean | No | false | Disable input |
| required | boolean | No | false | Required field |
| leftIcon | ReactNode | No | - | Icon inside left |
| rightIcon | ReactNode | No | - | Icon inside right |

**Internal State**: Focus state for styling

**Usage**:
```tsx
<Input
    type="email"
    label="Email Address"
    placeholder="you@example.com"
    value={email}
    onChange={setEmail}
    error={errors.email}
    required
/>
```

---

### 2.4 Select

**File**: `components/ui/Select.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| options | `{value: string, label: string}[]` | Yes | Select options |
| value | string | No | Selected value |
| onChange | (value: string) => void | No | Change handler |
| placeholder | string | No | Placeholder |
| label | string | No | Field label |
| error | string | No | Error message |
| disabled | boolean | No | Disable select |

---

### 2.5 Badge

**File**: `components/ui/Badge.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| variant | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | No | Color variant |
| size | `'sm' \| 'md'` | No | Size |
| children | ReactNode | Yes | Badge content |

**Usage**:
```tsx
<Badge variant="success">Verified</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### 2.6 Modal

**File**: `components/ui/Modal.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Visibility state |
| onClose | () => void | Yes | Close handler |
| title | string | No | Modal title |
| size | `'sm' \| 'md' \| 'lg' \| 'xl'` | No | Width |
| children | ReactNode | Yes | Modal content |

**Internal State**: None (controlled)

**Usage**:
```tsx
<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Make an Offer">
    <OfferForm vehicle={vehicle} onSubmit={handleSubmit} />
</Modal>
```

---

## 3. Layout Components (`components/layout/`)

### 3.1 Header

**File**: `components/layout/Header.tsx`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | `'default' \| 'transparent'` | No | 'default' | Background style |
| className | string | No | - | Additional classes |

**Internal State**:
- `mobileMenuOpen`: boolean - Mobile nav visibility
- Uses `useAuthStore` for user state

**Sub-components**:
- Logo (links to `/`)
- Navigation links
- Auth buttons or user menu
- Mobile hamburger menu

**Displayed**:
- Logo: Always
- Nav Links: Vehicles, How It Works, For Dealers
- Auth: Login/Register when logged out
- User Menu: Profile, Dashboard, Logout when logged in

---

### 3.2 Footer

**File**: `components/layout/Footer.tsx`

**Props**: None (static component)

**Sections**:
- Logo and description
- Quick links (Vehicles, How It Works)
- Support (Contact, FAQ)
- Legal (Privacy, Terms)
- Social media icons
- Copyright

---

### 3.3 Sidebar (Dealer Dashboard)

**File**: `components/layout/DealerSidebar.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activePath | string | Yes | Current route |

**Navigation Items**:
- Dashboard (`/dealer`)
- Inventory (`/dealer/inventory`)
- Offers (`/dealer/offers`)
- Analytics (`/dealer/analytics`)
- Settings (`/dealer/settings`)

---

## 4. Home Components (`components/home/`)

### 4.1 Hero

**File**: `components/home/Hero.tsx`

**Props**: None

**Internal State**:
- Search form values (make, model, price range)

**Components Used**:
- `Select` for make/model dropdowns
- `Input` for price range
- `Button` for search

**API Calls**:
- `GET /vehicles/makes/` on mount

**Actions**:
- Search button navigates to `/vehicles?filters`

---

### 4.2 FeaturedVehicles

**File**: `components/home/FeaturedVehicles.tsx`

**Props**: None

**Internal State**:
- `vehicles`: Vehicle[]
- `currentSlide`: number
- `isLoading`: boolean

**Components Used**:
- `VehicleCard` for each vehicle
- Carousel navigation buttons

**API Calls**:
- `GET /vehicles/featured/` on mount

---

### 4.3 HowItWorks

**File**: `components/home/HowItWorks.tsx`

**Props**: None

**Content**: Static 4-step process
1. Browse Vehicles
2. Make an Offer
3. Negotiate
4. Close the Deal

---

### 4.4 TrustIndicators

**File**: `components/home/TrustIndicators.tsx`

**Props**: None

**Content**: Statistics display
- Vehicles Listed
- Deals Closed
- Verified Dealers
- Average Savings

---

## 5. Vehicle Components (`components/vehicles/`)

### 5.1 VehicleCard

**File**: `components/vehicles/VehicleCard.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vehicle | Vehicle | Yes | Vehicle data |
| showSaveButton | boolean | No | Show heart icon |
| onSave | (id: string) => void | No | Save handler |
| isSaved | boolean | No | Saved state |

**Display**:
- Primary image
- Year, make, model, trim
- Asking price (formatted)
- Dealer name, location
- Body type badge

**Actions**:
- Click card → Navigate to `/vehicles/{id}`
- Click heart → Toggle saved state

---

### 5.2 VehicleGrid

**File**: `components/vehicles/VehicleGrid.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vehicles | Vehicle[] | Yes | Array of vehicles |
| loading | boolean | No | Show skeletons |
| emptyMessage | string | No | Empty state message |

**Components Used**:
- `VehicleCard` for each vehicle
- Grid layout (responsive)
- Loading skeleton cards

---

### 5.3 VehicleFilters

**File**: `components/vehicles/VehicleFilters.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| filters | VehicleFilters | Yes | Current filters |
| onFilterChange | (filters) => void | Yes | Update handler |
| onReset | () => void | Yes | Reset handler |

**Filter Fields**:
- Make (select)
- Model (select, depends on make)
- Year min/max (number inputs)
- Price min/max (number inputs)
- Body type (multi-select)

**Components Used**:
- `Select`, `Input` for fields
- `Button` for Apply/Reset

---

### 5.4 VehicleImageGallery

**File**: `components/vehicles/VehicleImageGallery.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| images | VehicleImage[] | Yes | Image array |
| vehicleTitle | string | Yes | Alt text |

**Internal State**:
- `currentIndex`: number - Selected image

**Features**:
- Main image display
- Thumbnail strip
- Previous/Next navigation
- Keyboard navigation

---

## 6. Negotiation Components (`components/negotiations/`)

### 6.1 NegotiationCard

**File**: `components/negotiations/NegotiationCard.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| negotiation | Negotiation | Yes | Negotiation data |
| userRole | 'buyer' \| 'dealer' | Yes | Current user role |

**Display**:
- Vehicle thumbnail and title
- Current offer amount
- Status badge
- "Your turn" indicator
- Time remaining

**Actions**:
- Click → Navigate to `/negotiations/{id}`

---

### 6.2 OfferHistory

**File**: `components/negotiations/OfferHistory.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| offers | Offer[] | Yes | Offer history |
| userRole | 'buyer' \| 'dealer' | Yes | For styling alignment |

**Display**:
- Timeline of offers
- Each offer: amount, by whom, message, timestamp
- Pending offer highlighted
- Status badges (accepted, rejected, countered)

---

### 6.3 OfferForm

**File**: `components/negotiations/OfferForm.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vehiclePrice | number | Yes | Reference price |
| onSubmit | (amount, message) => Promise | Yes | Submit handler |
| submitLabel | string | No | Button text |
| isLoading | boolean | No | Loading state |

**Internal State**:
- `amount`: string
- `message`: string
- `error`: string

**Validation**:
- Amount must be positive number
- Amount should be reasonable (warning if too low)

---

### 6.4 NegotiationActions

**File**: `components/negotiations/NegotiationActions.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| negotiation | Negotiation | Yes | Current negotiation |
| userRole | 'buyer' \| 'dealer' | Yes | User role |
| onAccept | () => Promise | Yes | Accept handler |
| onCounter | () => void | Yes | Open counter modal |
| onReject | () => Promise | No | Reject handler (dealer) |
| onCancel | () => Promise | No | Cancel handler (buyer) |
| isLoading | boolean | No | Loading state |

**Conditional Rendering**:
- Show Accept, Counter when it's user's turn
- Show Reject for dealer
- Show Cancel for buyer
- Hide all when not active

---

## 7. Dealer Components (`components/dealers/`)

### 7.1 DealerCard

**File**: `components/dealers/DealerCard.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| dealer | VehicleDealer | Yes | Dealer info |
| showPhone | boolean | No | Display phone |

**Display**:
- Business name
- Verified badge
- Location (city, state)
- Phone number (if shown)

---

### 7.2 DealerStats

**File**: `components/dealers/DealerStats.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| stats | DealerStats | Yes | Statistics object |
| isLoading | boolean | No | Loading state |

**Display Stats**:
- Total Inventory
- Active Listings
- Pending Offers
- Sold This Month
- Revenue

---

### 7.3 InventoryTable

**File**: `components/dealers/InventoryTable.tsx`

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vehicles | Vehicle[] | Yes | Dealer's vehicles |
| onEdit | (id) => void | Yes | Edit handler |
| onDelete | (id) => void | Yes | Delete handler |
| onStatusChange | (id, status) => void | Yes | Status change |

**Columns**:
- Image (thumbnail)
- Title (year make model)
- VIN
- Status (dropdown)
- Price
- Actions (Edit, Delete)

---

## 8. Component Dependencies

```
Header
├── Button
├── Modal (for mobile menu)
└── useAuthStore

VehicleCard
├── Card
├── Badge
├── Button (save)
└── Image

NegotiationDetail (page)
├── OfferHistory
├── OfferForm
├── NegotiationActions
├── VehicleCard (sidebar)
└── Modal (for counter offer)

DealerDashboard (page)
├── DealerSidebar
├── DealerStats
├── InventoryTable (partial)
└── Card
```

## 9. Event Patterns

### 9.1 State Updates
- Components emit events up via props
- Parent components handle state updates
- Global state via Zustand stores

### 9.2 API Calls
- Made in page components or stores
- Components receive data via props
- Loading/error states passed as props
