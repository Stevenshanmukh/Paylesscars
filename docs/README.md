# Payless Cars Documentation

## Overview

This documentation provides a complete, replication-grade blueprint of the Payless Cars full-stack application. It is designed to be AI-readable and comprehensive enough for another agent to rebuild the application exactly as it exists.

## Documentation Index

### A. Product & Brand Layer

| # | Document | Description |
|---|----------|-------------|
| 01 | [App Overview](./01_APP_OVERVIEW.md) | Application purpose, users, use cases, scope, and constraints |
| 02 | [Branding & Design System](./02_BRANDING_DESIGN_SYSTEM.md) | Colors, typography, spacing, shadows, animations |
| 03 | [Features & Business Logic](./03_FEATURES_BUSINESS.md) | All 15 features with user actions, API calls, and edge cases |

### B. Frontend Layer

| # | Document | Description |
|---|----------|-------------|
| 04 | [Frontend Architecture](./04_FRONTEND_ARCHITECTURE.md) | Next.js structure, routing, state management, API patterns |
| 05 | [Page UI Documentation](./05_PAGE_UI_DOCUMENTATION.md) | Page-by-page layouts, components, and interactions |
| 06 | [Component Documentation](./06_COMPONENT_DOCUMENTATION.md) | Props, state, styling for all major components |
| 07 | [User Flow & Navigation](./07_USER_FLOWS.md) | Complete navigation flows for all user roles |

### C. Backend Layer

| # | Document | Description |
|---|----------|-------------|
| 08 | [Backend Architecture](./08_BACKEND_ARCHITECTURE.md) | Django structure, request flow, middleware, configuration |
| 09 | [API Documentation](./09_API_DOCUMENTATION.md) | All endpoints with request/response schemas |
| 10 | [Business Logic & Services](./10_BUSINESS_LOGIC.md) | Validation rules, calculations, state transitions, services |

### D. Data Layer

| # | Document | Description |
|---|----------|-------------|
| 11 | [Database Documentation](./11_DATABASE_DOCUMENTATION.md) | ERD, table definitions, relationships, sample data |
| 12 | [Auth, Security & Permissions](./12_AUTH_SECURITY.md) | JWT flow, roles, permission matrix, protected routes |

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | SQLite (dev) / PostgreSQL (prod) |

## Quick Reference

### API Base URL
```
http://localhost:8000/api/v1/
```

### Frontend URL
```
http://localhost:3000/
```

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer1@email.com | pass1234 |
| Dealer | dealer1@premierauto.com | pass1234 |

## How to Use This Documentation

### For Replication
1. Start with **01_APP_OVERVIEW** to understand the application scope
2. Review **11_DATABASE_DOCUMENTATION** to create the data layer
3. Build backend following **08_BACKEND_ARCHITECTURE** and **09_API_DOCUMENTATION**
4. Implement frontend using **04_FRONTEND_ARCHITECTURE** and **06_COMPONENT_DOCUMENTATION**
5. Apply styling from **02_BRANDING_DESIGN_SYSTEM**
6. Verify flows match **07_USER_FLOWS**

### For Understanding
- Features: Start with **03_FEATURES_BUSINESS**
- UI/UX: Read **05_PAGE_UI_DOCUMENTATION**
- Security: Review **12_AUTH_SECURITY**

## Document Statistics

| Document | Size | Lines (approx) |
|----------|------|----------------|
| 01_APP_OVERVIEW | 10 KB | ~280 |
| 02_BRANDING_DESIGN_SYSTEM | 11 KB | ~350 |
| 03_FEATURES_BUSINESS | 19 KB | ~550 |
| 04_FRONTEND_ARCHITECTURE | 16 KB | ~500 |
| 05_PAGE_UI_DOCUMENTATION | 39 KB | ~1,100 |
| 06_COMPONENT_DOCUMENTATION | 15 KB | ~450 |
| 07_USER_FLOWS | 18 KB | ~550 |
| 08_BACKEND_ARCHITECTURE | 13 KB | ~420 |
| 09_API_DOCUMENTATION | 16 KB | ~500 |
| 10_BUSINESS_LOGIC | 19 KB | ~550 |
| 11_DATABASE_DOCUMENTATION | 19 KB | ~550 |
| 12_AUTH_SECURITY | 17 KB | ~500 |
| **Total** | **~212 KB** | **~6,300 lines** |
