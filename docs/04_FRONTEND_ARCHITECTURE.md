# Payless Cars - Frontend Architecture

## 1. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State Management | Zustand | 4.x |
| HTTP Client | Axios | 1.x |
| UI Components | Radix UI Primitives | various |
| Icons | Lucide React | latest |

## 2. Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (pages)
│   │   ├── (routes)/           # Page routes
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── error.tsx           # Error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   └── loading.tsx         # Global loading
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (buttons, cards, etc.)
│   │   ├── layout/             # Layout components (Header, Footer, etc.)
│   │   ├── home/               # Home page sections
│   │   ├── vehicles/           # Vehicle-related components
│   │   ├── negotiations/       # Negotiation components
│   │   ├── dealers/            # Dealer components
│   │   └── auth/               # Authentication components
│   │
│   ├── lib/                    # Utilities and services
│   │   ├── api/                # API client and endpoints
│   │   ├── types/              # TypeScript interfaces
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   └── providers/          # React context providers
│   │
│   └── store/                  # Zustand state stores
│       ├── authStore.ts
│       ├── vehicleStore.ts
│       ├── negotiationStore.ts
│       └── notificationStore.ts
│
├── public/                     # Static assets
├── components.json             # shadcn/ui config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── tsconfig.json               # TypeScript config
```

## 3. Routing Strategy

### 3.1 App Router Structure
Next.js 14 App Router with file-based routing:

| Path Pattern | Directory | Description |
|-------------|-----------|-------------|
| `/` | `app/page.tsx` | Home page |
| `/login` | `app/login/page.tsx` | Login page |
| `/register` | `app/register/page.tsx` | Registration |
| `/vehicles` | `app/vehicles/page.tsx` | Vehicle listings |
| `/vehicles/[id]` | `app/vehicles/[id]/page.tsx` | Vehicle details |
| `/dashboard` | `app/dashboard/page.tsx` | User dashboard |
| `/saved` | `app/saved/page.tsx` | Saved vehicles |
| `/negotiations` | `app/negotiations/page.tsx` | Negotiations list |
| `/negotiations/[id]` | `app/negotiations/[id]/page.tsx` | Negotiation detail |
| `/dealer` | `app/dealer/page.tsx` | Dealer dashboard |
| `/dealer/inventory` | `app/dealer/inventory/page.tsx` | Inventory mgmt |
| `/dealer/inventory/new` | `app/dealer/inventory/new/page.tsx` | Add vehicle |
| `/dealer/offers` | `app/dealer/offers/page.tsx` | Pending offers |
| `/settings` | `app/settings/page.tsx` | User settings |
| `/how-it-works` | `app/how-it-works/page.tsx` | FAQ/Guide |
| `/for-dealers` | `app/for-dealers/page.tsx` | Dealer landing |

### 3.2 Route Protection Pattern
Routes are protected client-side using the auth store:

```typescript
// In page component
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
        // Dealer-only routes
        if (user?.user_type !== 'dealer') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, router]);
    
    if (!isAuthenticated) return null;
    
    return <PageContent />;
}
```

### 3.3 Public vs Protected Routes

| Route Type | Routes | Access |
|------------|--------|--------|
| **Public** | `/`, `/login`, `/register`, `/vehicles`, `/vehicles/[id]`, `/how-it-works`, `/for-dealers` | Anyone |
| **Buyer Protected** | `/dashboard`, `/saved`, `/negotiations`, `/negotiations/[id]`, `/settings` | Authenticated buyers |
| **Dealer Protected** | `/dealer/*` | Verified dealers only |

## 4. State Management

### 4.1 Zustand Stores

#### Auth Store (`authStore.ts`)
```typescript
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    checkAuth: () => void;
    clearError: () => void;
}
```
- **Persistence**: `localStorage` via Zustand persist middleware
- **Key**: `carnegotiate-auth`
- **Persisted Fields**: `user`, `isAuthenticated`

#### Vehicle Store (`vehicleStore.ts`)
```typescript
interface VehicleState {
    vehicles: Vehicle[];
    currentVehicle: Vehicle | null;
    savedVehicleIds: Set<string>;
    filters: VehicleFilters;
    pagination: PaginationState;
    isLoading: boolean;
    
    fetchVehicles: (filters?: VehicleFilters) => Promise<void>;
    fetchVehicle: (id: string) => Promise<void>;
    saveVehicle: (id: string) => Promise<void>;
    unsaveVehicle: (id: string) => Promise<void>;
    setFilters: (filters: VehicleFilters) => void;
}
```
- **Persistence**: None (fetched on demand)

#### Negotiation Store (`negotiationStore.ts`)
```typescript
interface NegotiationState {
    negotiations: Negotiation[];
    currentNegotiation: Negotiation | null;
    stats: NegotiationStats | null;
    isLoading: boolean;
    
    fetchNegotiations: (filters?: NegotiationFilters) => Promise<void>;
    fetchNegotiation: (id: string) => Promise<void>;
    createNegotiation: (data: CreateNegotiationData) => Promise<void>;
    submitOffer: (id: string, data: SubmitOfferData) => Promise<void>;
    acceptOffer: (id: string) => Promise<void>;
    rejectNegotiation: (id: string, reason?: string) => Promise<void>;
    cancelNegotiation: (id: string) => Promise<void>;
    fetchStats: () => Promise<void>;
}
```

#### Notification Store (`notificationStore.ts`)
```typescript
interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}
```

### 4.2 Global vs Local State

| State Type | When to Use | Example |
|------------|-------------|---------|
| **Global (Zustand)** | Shared across components, needs persistence | User auth, cart, notifications |
| **Server State** | Data from API that may be cached | Vehicle listings, negotiations |
| **Local (useState)** | Component-specific, ephemeral | Form inputs, UI toggles, modals |
| **URL State** | Should persist in URL | Filters, pagination, search |

## 5. API Communication Pattern

### 5.1 API Client Structure

```
src/lib/api/
├── client.ts           # Axios instance configuration
├── auth.ts             # Auth endpoints
├── vehicles.ts         # Vehicle endpoints
├── dealers.ts          # Dealer endpoints
├── negotiations.ts     # Negotiation endpoints
├── notifications.ts    # Notification endpoints
└── index.ts            # Export all
```

### 5.2 Axios Client Configuration

```typescript
// client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Request interceptor - attach JWT
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle based on endpoint type
            // Public endpoints: fail silently
            // Protected endpoints: redirect to login
        }
        return Promise.reject(error);
    }
);
```

### 5.3 API Module Pattern

```typescript
// Example: api/vehicles.ts
import { apiClient } from './client';
import type { Vehicle, VehicleFilters, VehicleListResponse } from '@/lib/types';

export const vehiclesApi = {
    getAll: async (filters?: VehicleFilters): Promise<VehicleListResponse> => {
        const params = new URLSearchParams();
        if (filters?.make) params.append('make', filters.make);
        // ... map other filters
        const response = await apiClient.get(`/vehicles/?${params}`);
        return response.data;
    },
    
    getById: async (id: string): Promise<Vehicle> => {
        const response = await apiClient.get(`/vehicles/${id}/`);
        return response.data;
    },
    
    create: async (data: CreateVehicleData): Promise<Vehicle> => {
        const response = await apiClient.post('/vehicles/', data);
        return response.data;
    },
    
    // ... other methods
};
```

### 5.4 Token Management

```typescript
// Token helpers in client.ts
export const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const getAccessToken = () => localStorage.getItem('access_token');
```

## 6. Error Handling Strategy

### 6.1 Error Boundaries
```typescript
// app/error.tsx - Page-level error boundary
'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="error-container">
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()}>Try again</button>
        </div>
    );
}
```

### 6.2 API Error Handling Pattern
```typescript
// In store actions
fetchVehicles: async (filters) => {
    set({ isLoading: true, error: null });
    try {
        const data = await vehiclesApi.getAll(filters);
        set({ vehicles: data.results, isLoading: false });
    } catch (error) {
        const message = error instanceof Error 
            ? error.message 
            : 'Failed to fetch vehicles';
        set({ error: message, isLoading: false });
    }
}

// In components - display errors
const { vehicles, isLoading, error } = useVehicleStore();

if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
}
```

### 6.3 Form Validation Errors
- Inline validation using form state
- API validation errors mapped to fields
- Generic errors displayed at form level

## 7. Component Architecture

### 7.1 Component Categories

| Category | Path | Purpose |
|----------|------|---------|
| UI | `components/ui/` | Primitive components (Button, Card, Input) |
| Layout | `components/layout/` | Page structure (Header, Footer, Sidebar) |
| Feature | `components/[feature]/` | Domain-specific components |

### 7.2 Component Naming Conventions
- PascalCase for component names
- Files match component name
- Index file for exports

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── index.ts         # export * from './Button'; etc.
├── vehicles/
│   ├── VehicleCard.tsx
│   ├── VehicleGrid.tsx
│   ├── VehicleFilters.tsx
│   └── index.ts
```

### 7.3 Component Patterns

#### Server vs Client Components
```typescript
// Server Component (default in App Router)
// components/vehicles/VehicleList.tsx
async function VehicleList() {
    const vehicles = await fetch('/api/vehicles').then(r => r.json());
    return <VehicleGrid vehicles={vehicles} />;
}

// Client Component (interactive)
// components/vehicles/VehicleFilters.tsx
'use client';

export function VehicleFilters() {
    const [filters, setFilters] = useState({});
    // ... interactive logic
}
```

## 8. TypeScript Types

### 8.1 Type Definitions Location
```
src/lib/types/
├── auth.ts          # User, LoginData, RegisterData
├── vehicle.ts       # Vehicle, VehicleFilters
├── negotiation.ts   # Negotiation, Offer
├── dealer.ts        # Dealer, DealerStats
└── index.ts         # Re-exports
```

### 8.2 Key Type Definitions

```typescript
// types/auth.ts
export interface User {
    id: string;
    email: string;
    user_type: 'buyer' | 'dealer' | 'admin';
    is_verified: boolean;
    profile?: UserProfile;
}

// types/vehicle.ts
export type VehicleStatus = 'draft' | 'active' | 'pending_sale' | 'sold' | 'inactive';
export type BodyType = 'sedan' | 'suv' | 'truck' | 'coupe' | 'hatchback' | 'convertible' | 'van' | 'wagon';

export interface Vehicle {
    id: string;
    dealer: VehicleDealer;
    vin: string;
    stock_number: string;
    make: string;
    model: string;
    year: number;
    // ... see full definition in types/vehicle.ts
}

// types/negotiation.ts
export type NegotiationStatus = 'active' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
export type OfferedBy = 'buyer' | 'dealer';
```

## 9. Environment Configuration

### 9.1 Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 9.2 Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
    images: {
        domains: ['localhost'],
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/media/**' }
        ],
    },
    // Enable app router
    experimental: {
        serverActions: true,
    },
};
```

## 10. Build & Development

### 10.1 Scripts
```json
{
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    }
}
```

### 10.2 Key Dependencies
```json
{
    "dependencies": {
        "next": "^14",
        "react": "^18",
        "react-dom": "^18",
        "axios": "^1",
        "zustand": "^4",
        "lucide-react": "latest",
        "@radix-ui/react-*": "various"
    },
    "devDependencies": {
        "typescript": "^5",
        "tailwindcss": "^4",
        "@types/react": "^18"
    }
}
```
