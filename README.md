# Payless Cars

A modern automotive marketplace with buyer-dealer negotiation system.

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- npm or yarn

### First Time Setup

```bash
# Clone and enter directory
git clone <repo-url>
cd paylesscars

# Run setup script
# Windows (PowerShell)
.\scripts\fresh-setup.ps1

# Mac/Linux
chmod +x scripts/fresh-setup.sh
./scripts/fresh-setup.sh
```

### Start the App

```bash
# Option 1: Use startup script (recommended)
# Windows (PowerShell)
.\scripts\start-app.ps1

# Mac/Linux
./scripts/start-app.sh

# Option 2: Manual startup (two terminals)
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1/ |
| Backend Health | http://localhost:8000/api/v1/health/ |
| Django Admin | http://localhost:8000/admin/ |

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer1@email.com | pass1234 |
| Dealer | dealer1@premierauto.com | pass1234 |

## Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common problems.

## Project Structure

```
paylesscars/
├── backend/             # Django REST API (Backend)
│   ├── apps/            # Django apps (accounts, dealers, vehicles, negotiations, etc.)
│   ├── config/          # Django settings
│   ├── core/            # Shared utilities
│   └── manage.py
├── frontend/            # Next.js React app
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # React components
│   │   ├── lib/         # API client, types, utilities
│   │   └── store/       # Zustand state management
│   └── package.json
├── docs/                # Technical documentation
└── scripts/             # Utility scripts
    ├── fresh-setup.ps1  # Windows setup
    ├── start-app.ps1    # Windows startup
    └── ...              # Mac/Linux scripts
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | SQLite (dev) / PostgreSQL (prod) |

## Documentation

See the [docs/](./docs/) folder for detailed technical documentation including:
- Application overview and features
- Frontend/backend architecture
- API documentation
- Database schema
- Authentication and security
