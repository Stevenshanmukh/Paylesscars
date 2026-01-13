# CarNegotiate - Authentication, Security & Permissions

## 1. Authentication Overview

| Aspect | Implementation |
|--------|---------------|
| **Method** | JWT (JSON Web Tokens) |
| **Library** | djangorestframework-simplejwt |
| **Token Type** | Bearer tokens |
| **Token Storage** | localStorage (frontend) |
| **User Model** | Custom email-based auth |

## 2. JWT Token Configuration

### 2.1 Token Settings
```python
# config/settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

### 2.2 Token Payload Structure
```json
{
    "token_type": "access",
    "exp": 1704931200,
    "iat": 1704927600,
    "jti": "unique-token-id",
    "user_id": "uuid-of-user"
}
```

## 3. Authentication Flow

### 3.1 Registration Flow
```
User submits registration form
         │
         ▼
┌─────────────────────────┐
│ POST /auth/register/    │
│ { email, password,      │
│   password_confirm,     │
│   user_type }           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Validate input          │
│ - Email unique          │
│ - Passwords match       │
│ - Min 8 characters      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Create User             │
│ - Hash password         │
│ - Set user_type         │
│ - Create profile        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Generate JWT tokens     │
│ - Access token          │
│ - Refresh token         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Return to frontend      │
│ { user, access, refresh}│
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ Frontend stores tokens  │
│ localStorage            │
└─────────────────────────┘
```

### 3.2 Login Flow
```
User submits login form
         │
         ▼
┌─────────────────────────┐
│ POST /auth/login/       │
│ { email, password }     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Authenticate            │
│ - Find user by email    │
│ - Verify password       │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ Valid           ▼ Invalid
┌──────────┐    ┌───────────────┐
│ Generate │    │ Return 401    │
│ tokens   │    │ Invalid creds │
└────┬─────┘    └───────────────┘
     │
     ▼
┌─────────────────────────┐
│ Return tokens + user    │
└─────────────────────────┘
```

### 3.3 Token Refresh Flow
```
Access token expired (401)
         │
         ▼
┌─────────────────────────┐
│ POST /auth/token/refresh│
│ { refresh: <token> }    │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ Valid           ▼ Invalid/Expired
┌──────────────┐    ┌────────────────┐
│ Return new   │    │ Return 401     │
│ access token │    │ Redirect login │
└──────────────┘    └────────────────┘
```

### 3.4 Logout Flow
```
User clicks logout
         │
         ▼
┌─────────────────────────┐
│ POST /auth/logout/      │
│ { refresh: <token> }    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Blacklist refresh token │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Frontend clears tokens  │
│ localStorage.clear()    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Redirect to home/login  │
└─────────────────────────┘
```

## 4. User Roles

### 4.1 Role Definitions
| Role | user_type Value | Description |
|------|-----------------|-------------|
| Buyer | `buyer` | End consumers browsing/buying vehicles |
| Dealer | `dealer` | Dealership accounts listing vehicles |
| Admin | `admin` | System administrators |

### 4.2 Role Properties
```python
class CustomUser(AbstractBaseUser):
    class UserType(models.TextChoices):
        BUYER = 'buyer', 'Buyer'
        DEALER = 'dealer', 'Dealer'
        ADMIN = 'admin', 'Admin'
    
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.BUYER
    )
    
    @property
    def is_buyer(self):
        return self.user_type == self.UserType.BUYER
    
    @property
    def is_dealer(self):
        return self.user_type == self.UserType.DEALER
    
    @property
    def is_admin(self):
        return self.user_type == self.UserType.ADMIN
```

## 5. Permission Matrix

### 5.1 API Endpoints by Permission

| Endpoint | Allow Any | Auth Required | Buyer Only | Dealer Only | Admin Only |
|----------|-----------|---------------|------------|-------------|------------|
| `GET /vehicles/` | ✓ | - | - | - | - |
| `GET /vehicles/{id}/` | ✓ | - | - | - | - |
| `GET /vehicles/featured/` | ✓ | - | - | - | - |
| `GET /vehicles/makes/` | ✓ | - | - | - | - |
| `POST /vehicles/` | - | ✓ | - | ✓ | - |
| `PATCH /vehicles/{id}/` | - | ✓ | - | Owner | - |
| `DELETE /vehicles/{id}/` | - | ✓ | - | Owner | - |
| `GET /vehicles/my-inventory/` | - | ✓ | - | ✓ | - |
| `POST /vehicles/bulk_upload/` | - | ✓ | - | ✓ | - |
| `GET /vehicles/saved/` | - | ✓ | ✓ | ✓ | - |
| `POST /vehicles/saved/` | - | ✓ | ✓ | ✓ | - |
| `GET /dealers/` | ✓ | - | - | - | - |
| `GET /dealers/{id}/` | ✓ | - | - | - | - |
| `POST /dealers/register/` | - | ✓ | - | ✓ | - |
| `GET /dealers/me/` | - | ✓ | - | ✓ | - |
| `GET /dealers/me/stats/` | - | ✓ | - | ✓ | - |
| `GET /negotiations/` | - | ✓ | ✓ | ✓ | - |
| `POST /negotiations/` | - | ✓ | ✓ | - | - |
| `POST /.../submit-offer/` | - | ✓ | Participant | Participant | - |
| `POST /.../accept/` | - | ✓ | Participant | Participant | - |
| `POST /.../reject/` | - | ✓ | - | Participant | - |
| `POST /.../cancel/` | - | ✓ | Participant | - | - |
| Django Admin | - | - | - | - | ✓ |

### 5.2 Permission Classes

```python
# core/permissions.py

class IsDealer(permissions.BasePermission):
    """Only allow dealer users."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.user_type == 'dealer'
        )

class IsVerifiedDealer(permissions.BasePermission):
    """Only allow verified dealers."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.user_type != 'dealer':
            return False
        try:
            return request.user.dealer_profile.is_verified
        except:
            return False

class IsDealerOwner(permissions.BasePermission):
    """Dealer must own the object."""
    def has_object_permission(self, request, view, obj):
        # obj is Vehicle
        return obj.dealer.user == request.user

class IsBuyer(permissions.BasePermission):
    """Only allow buyer users."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.user_type == 'buyer'
        )

class IsNegotiationParticipant(permissions.BasePermission):
    """User must be buyer or dealer in negotiation."""
    def has_object_permission(self, request, view, obj):
        # obj is Negotiation
        user = request.user
        return (
            obj.buyer == user or 
            obj.vehicle.dealer.user == user
        )
```

## 6. Protected Routes (Frontend)

### 6.1 Route Protection Logic

```typescript
// Pattern used in protected pages
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedPage() {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuthStore();
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);
    
    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return null;
    
    return <ActualPageContent />;
}
```

### 6.2 Route Classification

| Route | Protection Level | Allowed Roles |
|-------|-----------------|---------------|
| `/` | Public | Anyone |
| `/login` | Public | Anyone |
| `/register` | Public | Anyone |
| `/vehicles` | Public | Anyone |
| `/vehicles/[id]` | Public | Anyone |
| `/how-it-works` | Public | Anyone |
| `/for-dealers` | Public | Anyone |
| `/dashboard` | Auth + Buyer | buyer |
| `/saved` | Auth + Buyer | buyer |
| `/negotiations` | Auth | buyer, dealer |
| `/negotiations/[id]` | Auth + Participant | buyer, dealer |
| `/dealer` | Auth + Dealer | dealer |
| `/dealer/*` | Auth + Verified Dealer | verified dealer |
| `/settings` | Auth | buyer, dealer |

## 7. API Security Rules

### 7.1 Request Validation
- All input validated via DRF serializers
- Request body size limits applied
- Content-Type must match expected format

### 7.2 CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'authorization', 'content-type', 'origin',
]
```

### 7.3 Rate Limiting (Future)
Not currently implemented. Recommended:
- 60 requests/minute for authenticated
- 20 requests/minute for anonymous
- Stricter limits for auth endpoints

### 7.4 Password Security
```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

## 8. Token Lifecycle

### 8.1 Token Expiration
| Token Type | Lifetime | Refresh Behavior |
|------------|----------|------------------|
| Access | 60 minutes | Obtain new via refresh |
| Refresh | 7 days | Rotates on use, invalidates old |

### 8.2 Token Invalidation Scenarios
| Scenario | Behavior |
|----------|----------|
| Logout | Refresh token blacklisted |
| Password change | All tokens remain valid (current impl) |
| Token refresh | Old refresh token blacklisted |
| Admin disable user | Tokens still work until expiry |

### 8.3 Frontend Token Handling
```typescript
// Axios interceptor for 401 handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh token
                const refresh = localStorage.getItem('refresh_token');
                const response = await axios.post('/auth/token/refresh/', { refresh });
                const { access } = response.data;
                
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;
                
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);
```

## 9. Data Access Rules

### 9.1 Vehicle Data
| Field | Buyer Access | Dealer Access (Own) | Public Access |
|-------|--------------|---------------------|---------------|
| id, vin, make, model | ✓ | ✓ | ✓ |
| msrp, asking_price | ✓ | ✓ | ✓ |
| **floor_price** | ✗ | ✓ | ✗ |
| specifications | ✓ | ✓ | ✓ |
| status | ✓ | ✓ | active only |

### 9.2 Negotiation Data
| Field | Buyer Access | Dealer Access | Other Users |
|-------|--------------|---------------|-------------|
| Full negotiation | If participant | If participant | ✗ |
| Offers history | If participant | If participant | ✗ |
| Accepted price | If participant | If participant | ✗ |

### 9.3 Dealer Data
| Field | Public | Own Dealer | Admin |
|-------|--------|------------|-------|
| business_name, city | ✓ | ✓ | ✓ |
| phone (public) | ✓ | ✓ | ✓ |
| tax_id | ✗ | ✓ | ✓ |
| verification_notes | ✗ | ✗ | ✓ |

## 10. Security Headers

Currently minimal. Recommended additions:
```python
# Middleware additions
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # Production only
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True  # Production only
```

## 11. Error Response Security

### 11.1 Information Disclosure Prevention
```python
# Login error - don't reveal if email exists
return Response(
    {"detail": "Invalid credentials"},  # Not "User not found"
    status=401
)

# Password reset - always success message
return Response(
    {"detail": "If email exists, reset link sent"},
    status=200
)
```

### 11.2 Stack Traces
- DEBUG=True: Full tracebacks (development only)
- DEBUG=False: Generic error messages (production)

## 12. Audit & Logging (Recommended)

Currently minimal. Recommended:
```python
# Log authentication events
LOGGING = {
    'handlers': {
        'auth_file': {
            'class': 'logging.FileHandler',
            'filename': 'auth.log',
        },
    },
    'loggers': {
        'auth': {
            'handlers': ['auth_file'],
            'level': 'INFO',
        },
    },
}

# Events to log:
# - Login success/failure
# - Registration
# - Password changes
# - Token refresh
# - Permission denied
```
