# CarNegotiate - Backend Architecture

## 1. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Django | 4.2+ |
| API Framework | Django REST Framework | 3.14+ |
| Authentication | SimpleJWT | 5.x |
| Database | SQLite (dev) / PostgreSQL (prod) | - |
| Python | Python | 3.10+ |

## 2. Project Structure

```
carnegotiate/
├── apps/                       # Django Applications
│   ├── __init__.py
│   ├── accounts/               # User authentication & profiles
│   │   ├── models.py           # CustomUser, UserProfile
│   │   ├── views.py            # Auth views
│   │   ├── serializers.py      # User serializers
│   │   ├── urls.py             # Auth routes
│   │   └── admin.py
│   ├── dealers/                # Dealer management
│   │   ├── models.py           # Dealer, DealerDocument
│   │   ├── views.py            # DealerViewSet
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── vehicles/               # Vehicle listings
│   │   ├── models.py           # Vehicle, VehicleImage, SavedVehicle
│   │   ├── views.py            # VehicleViewSet
│   │   ├── serializers.py
│   │   ├── filters.py          # VehicleFilterSet
│   │   └── urls.py
│   ├── negotiations/           # Offer system
│   │   ├── models.py           # Negotiation, Offer
│   │   ├── views.py            # NegotiationViewSet
│   │   ├── serializers.py
│   │   ├── services.py         # Business logic
│   │   └── urls.py
│   ├── notifications/          # Alert system
│   │   ├── models.py           # Notification
│   │   ├── views.py
│   │   └── urls.py
│   └── analytics/              # Dashboard stats
│       ├── views.py
│       └── urls.py
├── config/                     # Django Configuration
│   ├── __init__.py
│   ├── settings.py             # Main settings
│   ├── urls.py                 # Root URL config
│   └── wsgi.py
├── core/                       # Shared Utilities
│   ├── models.py               # TimeStampedModel base
│   ├── permissions.py          # Custom permissions
│   └── views.py                # Health check
├── media/                      # Uploaded files
├── templates/                  # HTML templates (minimal)
├── requirements/               # Dependencies
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
└── manage.py                   # Django CLI
```

## 3. Layered Architecture

### 3.1 Request-Response Flow
```
HTTP Request
    │
    ▼
┌─────────────────┐
│   URL Router    │  config/urls.py → apps/*/urls.py
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Middleware     │  Auth, CORS, Session, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Auth Check    │  SimpleJWT validates token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Permission Check│  IsAuthenticated, IsDealerOwner, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View/ViewSet   │  Handle request, call services
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Serializer    │  Validate input, serialize output
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  Business logic (optional layer)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Model/ORM     │  Database operations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │  SQLite / PostgreSQL
└─────────────────┘
```

### 3.2 Layer Responsibilities

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **URL Router** | Map URLs to views | `urls.py` |
| **Views/ViewSets** | Handle HTTP, call services, return responses | `views.py` |
| **Serializers** | Validate input, format output | `serializers.py` |
| **Services** | Complex business logic | `services.py` |
| **Models** | Data structure, DB operations | `models.py` |
| **Permissions** | Access control | `permissions.py` |

## 4. Django Apps Detail

### 4.1 accounts
**Purpose**: User authentication and profiles

**Models**:
- `CustomUser` - Email-based auth with user_type
- `UserProfile` - Extended profile (name, phone, location)

**Views**:
- `RegisterView` - User registration
- `LoginView` - JWT token generation
- `LogoutView` - Token blacklisting
- `UserProfileView` - Get/update current user
- `ChangePasswordView` - Password update

### 4.2 dealers
**Purpose**: Dealer business entities

**Models**:
- `Dealer` - Business info, verification status
- `DealerDocument` - Verification documents

**ViewSet Actions**:
- `list/retrieve` - Public dealer info
- `register` - Create dealer profile
- `me` - Get/update own profile
- `stats` - Dashboard statistics
- `pending_offers` - Offers awaiting response
- `inventory_summary` - Vehicle counts by status

### 4.3 vehicles
**Purpose**: Vehicle listings and images

**Models**:
- `Vehicle` - Main vehicle listing
- `VehicleImage` - Associated images
- `SavedVehicle` - User favorites

**ViewSet Actions**:
- CRUD operations
- `my_inventory` - Dealer's own vehicles
- `featured` - Homepage carousel
- `makes` - Available makes list
- `similar` - Similar vehicles
- `saved` - User's saved list
- `bulk_upload` - CSV import
- `bulk_upload_template` - Download template

### 4.4 negotiations
**Purpose**: Offer management

**Models**:
- `Negotiation` - Conversation container
- `Offer` - Individual price offers

**ViewSet Actions**:
- `list/retrieve/create` - Basic CRUD
- `submit_offer` - Add counter-offer
- `accept` - Accept current offer
- `reject` - Dealer rejects
- `cancel` - Buyer cancels
- `active` - Filter active only
- `stats` - Negotiation statistics

### 4.5 notifications
**Purpose**: In-app alerts

**Models**:
- `Notification` - User notifications

**ViewSet Actions**:
- `list` - User's notifications
- `mark_read` - Mark as read
- `mark_all_read` - Bulk mark read

### 4.6 analytics
**Purpose**: Dashboard metrics (minimal)

## 5. Authentication System

### 5.1 JWT Configuration (SimpleJWT)
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 5.2 Auth Flow
1. **Login**: `POST /auth/login/` → Returns access + refresh tokens
2. **Request**: `Authorization: Bearer <access_token>`
3. **Refresh**: `POST /auth/token/refresh/` → New access token
4. **Logout**: `POST /auth/logout/` → Blacklist refresh token

### 5.3 Permission Classes

| Permission | Description | Used For |
|------------|-------------|----------|
| `AllowAny` | No auth required | Public endpoints |
| `IsAuthenticated` | Valid JWT required | Protected endpoints |
| `IsDealerOwner` | Must be dealer and own resource | Dealer inventory |
| `IsBuyerOrDealer` | Participant in negotiation | Negotiation actions |

## 6. Request Processing

### 6.1 ViewSet Pattern
```python
class VehicleViewSet(viewsets.ModelViewSet):
    """
    Vehicle CRUD operations.
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VehicleFilterSet
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'makes']:
            return [AllowAny()]
        return [IsAuthenticated(), IsDealerOwner()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VehicleCreateSerializer
        return VehicleSerializer
    
    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            return Vehicle.objects.filter(status='active')
        return Vehicle.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(dealer=self.request.user.dealer_profile)
    
    @action(detail=False, methods=['get'])
    def my_inventory(self, request):
        vehicles = Vehicle.objects.filter(dealer=request.user.dealer_profile)
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)
```

### 6.2 Serializer Pattern
```python
class VehicleSerializer(serializers.ModelSerializer):
    dealer = DealerPublicSerializer(read_only=True)
    images = VehicleImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'dealer', 'vin', 'make', 'model', 'year',
            'asking_price', 'msrp', 'images', 'primary_image', ...
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_primary_image(self, obj):
        primary = obj.primary_image
        if primary:
            return primary.image.url
        return None
```

## 7. Error Handling

### 7.1 Standard Error Responses
```python
# 400 Bad Request - Validation errors
{
    "field_name": ["Error message"],
    "non_field_errors": ["General error"]
}

# 401 Unauthorized
{
    "detail": "Authentication credentials were not provided."
}

# 403 Forbidden
{
    "detail": "You do not have permission to perform this action."
}

# 404 Not Found
{
    "detail": "Not found."
}

# 500 Internal Server Error
{
    "detail": "Internal server error."
}
```

### 7.2 Custom Exception Handler
```python
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data['status_code'] = response.status_code
    return response
```

## 8. Database Configurations

### 8.1 Development (SQLite)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### 8.2 Production (PostgreSQL)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

## 9. Middleware Stack

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',           # CORS handling
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## 10. CORS Configuration

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
]
```

## 11. File Uploads

### 11.1 Media Configuration
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 11.2 Upload Directories
```
media/
├── vehicles/          # Vehicle photos
├── avatars/           # User profile pictures
└── dealer_documents/  # Verification documents
```

## 12. Background Tasks (Future)

Currently synchronous. Future enhancement:
- **Celery** for async tasks
- **Redis** as message broker
- Tasks: Email notifications, expired offer cleanup, analytics aggregation

## 13. API Versioning

API is versioned via URL prefix:
```
/api/v1/auth/...
/api/v1/vehicles/...
/api/v1/dealers/...
/api/v1/negotiations/...
```

Future versions would use `/api/v2/...`

## 14. Health Check Endpoint

```python
# core/views.py
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'database': 'connected',
        'timestamp': timezone.now().isoformat()
    })
```

URL: `GET /api/v1/health/`
