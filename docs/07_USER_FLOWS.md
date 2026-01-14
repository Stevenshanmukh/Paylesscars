# Payless Cars - User Flow & Navigation Logic

## 1. Entry Points

### 1.1 Direct URL Access
| URL | Description | Authentication |
|-----|-------------|----------------|
| `/` | Home page | Not required |
| `/login` | Login page | Redirect if logged in |
| `/register` | Registration | Redirect if logged in |
| `/vehicles` | Vehicle listings | Not required |
| `/vehicles/{id}` | Vehicle details | Not required |

### 1.2 Deep Links (from notifications/emails)
| Pattern | Example | Behavior |
|---------|---------|----------|
| Negotiation | `/negotiations/{id}` | Requires auth, shows detail |
| Vehicle | `/vehicles/{id}` | Public, shows detail |
| Dashboard | `/dealer` | Requires dealer auth |

---

## 2. Navigation Structure

### 2.1 Main Navigation (Header)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]    Vehicles    How It Works    For Dealers    [Auth]    │
└─────────────────────────────────────────────────────────────────┘

[Auth] = Login / Register (logged out)
[Auth] = [User Menu] (logged in)
```

### 2.2 User Menu (Logged In)
**Buyer**:
- Dashboard
- My Negotiations
- Saved Vehicles
- Settings
- Logout

**Dealer**:
- Dealer Dashboard
- Inventory
- Pending Offers
- Settings
- Logout

### 2.3 Dealer Sidebar Navigation
```
┌──────────────────────┐
│ 📊 Dashboard         │ ← /dealer
│ 🚗 Inventory         │ ← /dealer/inventory
│ 💰 Offers            │ ← /dealer/offers
│ 📈 Analytics         │ ← /dealer/analytics
│ ⚙️ Settings          │ ← /dealer/settings
└──────────────────────┘
```

---

## 3. User Flows

### 3.1 Guest Browsing Flow

```
[Home Page]
     │
     ├──→ Click "Browse Vehicles" or Nav Link
     │         ↓
     │    [Vehicle Listings]
     │         │
     │         ├──→ Apply Filters
     │         │         ↓
     │         │    [Filtered Results]
     │         │
     │         └──→ Click Vehicle Card
     │                   ↓
     │              [Vehicle Detail]
     │                   │
     │                   ├──→ Click "Make Offer"
     │                   │         ↓
     │                   │    [Redirect to Login]
     │                   │         ↓
     │                   │    [Login Success]
     │                   │         ↓
     │                   │    [Redirect back to Vehicle]
     │                   │
     │                   └──→ Click "Save"
     │                             ↓
     │                        [Redirect to Login]
     │
     ├──→ Click "How It Works"
     │         ↓
     │    [How It Works Page]
     │
     └──→ Click "For Dealers"
               ↓
          [Dealer Landing Page]
               │
               └──→ Click "Register as Dealer"
                         ↓
                    [Registration Page]
```

### 3.2 Buyer Registration Flow

```
[Register Page]
     │
     ├──→ Fill form (email, password, user_type='buyer')
     │
     └──→ Submit
               ↓
          [API: POST /auth/register/]
               │
               ├── Success ──→ [Store tokens]
               │                    ↓
               │               [Buyer Dashboard]
               │
               └── Error ──→ [Show validation errors]
                                  ↓
                             [Stay on page]
```

### 3.3 Dealer Registration Flow (Multi-step)

```
[Register Page]
     │
     └──→ Submit (user_type='dealer')
               ↓
          [Tokens stored]
               ↓
          [Dealer Onboarding Page]
               │
               ├──→ Fill business info
               │    - Business name
               │    - License number
               │    - Tax ID
               │    - Address
               │
               └──→ Submit
                         ↓
                    [API: POST /dealers/register/]
                         │
                         └──→ [Dealer Dashboard (Pending)]
                                   │
                                   └──→ Status: "Pending Verification"
                                              ↓
                                         [Admin verifies]
                                              ↓
                                         [Full access enabled]
```

### 3.4 Login Flow

```
[Login Page]
     │
     └──→ Submit credentials
               ↓
          [API: POST /auth/login/]
               │
               ├── Success ──→ [Store tokens]
               │                    │
               │                    ├── user_type='buyer' ──→ [Buyer Dashboard]
               │                    │
               │                    └── user_type='dealer' ──→ [Dealer Dashboard]
               │
               └── Error ──→ [Show "Invalid credentials"]
                                  ↓
                             [Stay on page]
```

### 3.5 Vehicle Purchase (Negotiation) Flow

```
[Vehicle Detail Page] (Buyer logged in)
     │
     └──→ Click "Make an Offer"
               ↓
          [Offer Modal opens]
               │
               ├──→ Enter amount
               ├──→ Enter message (optional)
               │
               └──→ Submit
                         ↓
                    [API: POST /negotiations/]
                         │
                         ├── Success ──→ [Modal closes]
                         │                    ↓
                         │               [Navigate to /negotiations/{id}]
                         │                    ↓
                         │               [Waiting for dealer response]
                         │
                         └── Error ──→ [Show error in modal]
                                           │
                                           └── "Active negotiation exists"
                                                    ↓
                                               [Link to existing negotiation]
```

### 3.6 Negotiation Response Flow (Dealer)

```
[Dealer receives notification]
     │
     └──→ Click notification or navigate to Offers
               ↓
          [Negotiations List]
               │
               └──→ Click negotiation
                         ↓
                    [Negotiation Detail]
                         │
                         ├──→ Review buyer's offer
                         │
                         ├──→ Option 1: Accept
                         │         ↓
                         │    [API: POST /.../accept/]
                         │         ↓
                         │    [Status → Accepted]
                         │         ↓
                         │    [Vehicle → Pending Sale]
                         │
                         ├──→ Option 2: Counter
                         │         ↓
                         │    [Counter Offer Modal]
                         │         ↓
                         │    [API: POST /.../submit-offer/]
                         │         ↓
                         │    [Wait for buyer response]
                         │
                         └──→ Option 3: Reject
                                   ↓
                              [API: POST /.../reject/]
                                   ↓
                              [Status → Rejected]
```

### 3.7 Counter-Offer Cycle

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Buyer makes offer] ──→ [Dealer's turn]                        │
│         │                      │                                 │
│         │              ┌───────┴───────┐                        │
│         │              ↓               ↓               ↓         │
│         │         [Accept]        [Counter]       [Reject]      │
│         │              │               │               │         │
│         │              ↓               │               ↓         │
│         │         [Accepted]           │          [Rejected]    │
│         │                              ↓                        │
│         │                        [Buyer's turn]                 │
│         │                              │                        │
│         │              ┌───────────────┼───────────────┐        │
│         │              ↓               ↓               ↓        │
│         │         [Accept]        [Counter]       [Cancel]      │
│         │              │               │               │        │
│         │              ↓               │               ↓        │
│         │         [Accepted]           │         [Cancelled]    │
│         │                              │                        │
│         └──────────────────────────────┘                        │
│                  (cycle continues)                              │
└──────────────────────────────────────────────────────────────────┘
```

### 3.8 Save Vehicle Flow

```
[Vehicle Card or Detail] (Buyer logged in)
     │
     └──→ Click heart icon (♡)
               │
               ├── Not saved ──→ [API: POST /vehicles/saved/]
               │                       ↓
               │                  [Icon changes to ♥]
               │
               └── Already saved ──→ [API: DELETE /vehicles/saved/{id}/]
                                           ↓
                                      [Icon changes to ♡]
```

---

## 4. Conditional Routing Logic

### 4.1 Post-Login Redirect
```typescript
// After successful login
const redirectTo = (user: User) => {
    if (user.user_type === 'dealer') {
        // Check if dealer profile exists
        if (!user.dealer_profile) {
            return '/dealer/onboarding';
        }
        return '/dealer';
    }
    return '/dashboard';
};
```

### 4.2 Protected Route Guard
```typescript
// In protected page component
useEffect(() => {
    if (!isLoading) {
        if (!isAuthenticated) {
            // Store intended destination
            router.push(`/login?redirect=${pathname}`);
        } else if (requiredRole && user?.user_type !== requiredRole) {
            router.push('/dashboard');
        }
    }
}, [isAuthenticated, isLoading, user, router]);
```

### 4.3 Post-Action Redirects

| Action | From | To |
|--------|------|-----|
| Login success (buyer) | `/login` | `/dashboard` or saved redirect |
| Login success (dealer) | `/login` | `/dealer` or `/dealer/onboarding` |
| Registration (buyer) | `/register` | `/dashboard` |
| Registration (dealer) | `/register` | `/dealer/onboarding` |
| Logout | Any | `/` |
| Create negotiation | Vehicle detail | `/negotiations/{id}` |
| Accept offer | Negotiation detail | Same page (status updated) |
| Create vehicle | Add form | `/dealer/inventory` |

---

## 5. Role-Based Navigation Differences

### 5.1 Buyer Navigation
```
Home → Vehicles → Vehicle Detail → Make Offer → Negotiate → Accept/Cancel
                                 ↳ Save to Favorites
      ↳ Saved Vehicles
      ↳ Dashboard (My Negotiations)
      ↳ Settings
```

### 5.2 Dealer Navigation
```
Home → Dealer Dashboard → Inventory → Add/Edit Vehicles
                        ↳ Pending Offers → Respond to Negotiations
                        ↳ Analytics
                        ↳ Settings
```

---

## 6. Error and Fallback Flows

### 6.1 404 Not Found
```
[Invalid URL]
     ↓
[not-found.tsx renders]
     │
     └──→ Shows "Page not found"
          │
          └──→ Links: Home, Vehicles
```

### 6.2 401 Unauthorized (API)
```
[API returns 401]
     │
     ├── Public endpoint ──→ [Fail silently, show empty state]
     │
     └── Protected endpoint ──→ [Clear tokens]
                                      ↓
                                 [Redirect to /login]
```

### 6.3 Server Error (500)
```
[API returns 500]
     ↓
[error.tsx renders]
     │
     └──→ Shows "Something went wrong"
          │
          └──→ "Try Again" button
                    ↓
               [Reset error boundary]
```

### 6.4 Network Error
```
[Network unavailable]
     ↓
[Axios interceptor catches]
     ↓
[Show toast: "Unable to connect to server"]
```

---

## 7. Navigation Flow Diagram

```
                                    ┌─────────────┐
                                    │    Home     │
                                    └──────┬──────┘
                    ┌────────────────────┬─┴─┬────────────────────┐
                    ↓                    ↓   ↓                    ↓
             ┌──────────┐         ┌──────────┐         ┌──────────────────┐
             │ Vehicles │         │How It    │         │  For Dealers     │
             └────┬─────┘         │ Works    │         └────────┬─────────┘
                  │               └──────────┘                  │
                  ↓                                             │
           ┌──────────────┐                                     │
           │Vehicle Detail│                                     │
           └──────┬───────┘                                     │
                  │                                             │
      ┌───────────┼───────────┐                                 │
      ↓           ↓           ↓                                 │
 [Make Offer] [Save]     [Similar]                              │
      │                                                         │
      ↓                                                         ↓
┌───────────┐                                           ┌───────────┐
│   Login   │ ←─────────────────────────────────────────│ Register  │
└─────┬─────┘                                           └─────┬─────┘
      │                                                       │
      ├──── buyer ────→ [Dashboard] ←────────────────────────┤
      │                      │                                │
      │                      ↓                                │
      │               [Negotiations]                          │
      │                      │                                │
      │                      ↓                                │
      │            [Negotiation Detail]                       │
      │                                                       │
      └──── dealer ───→ [Dealer Dashboard] ←── (after onboarding)
                              │
               ┌──────────────┼──────────────┐
               ↓              ↓              ↓
         [Inventory]     [Offers]      [Analytics]
               │
         ┌─────┴─────┐
         ↓           ↓
    [Add New]    [Edit]
```

---

## 8. URL Parameters

### 8.1 Filter State in URL
```
/vehicles?make=Toyota&year_min=2020&price_max=50000&page=2
```

### 8.2 Redirect Parameter
```
/login?redirect=/vehicles/abc123
```
After login, redirects to the specified URL.

### 8.3 Tab/View State
```
/dealer/inventory?status=active
/negotiations?filter=pending
```
