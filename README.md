# CarNegotiate

A modern car marketplace with buyer-dealer negotiation system.

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- npm or yarn

### First Time Setup

```bash
# Clone and enter directory
git clone <repo-url>
cd carnegotiate

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
cd carnegotiate
source venv/bin/activate
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
├── carnegotiate/        # Django REST API (Backend)
│   ├── apps/            # Django apps
│   ├── config/          # Django settings
│   └── manage.py
├── frontend/            # Next.js React app
│   ├── src/
│   │   ├── app/        # Pages (App Router)
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities & API
│   └── package.json
└── scripts/             # Utility scripts
    ├── fresh-setup.ps1  # Windows setup
    ├── start-app.ps1    # Windows startup
    └── ...              # Mac/Linux scripts
```
