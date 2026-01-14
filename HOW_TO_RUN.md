# How to Run Payless Cars - Step by Step

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18 or higher (`node --version`)
- [ ] npm 9 or higher (`npm --version`)
- [ ] Python 3.10 or higher (`python --version`)
- [ ] Git (`git --version`)

---

## Method 1: Using Scripts (Recommended)

### Step 1: Open Terminal
Open your terminal/command prompt in the project root folder.

### Step 2: Run Fresh Setup (First Time Only)
This installs dependencies, runs migrations, and seeds test data.

**Windows (PowerShell):**
```powershell
.\scripts\fresh-setup.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/*.sh
./scripts/fresh-setup.sh
```

### Step 3: Start the App
This opens new windows for Backend and Frontend.

**Windows (PowerShell):**
```powershell
.\scripts\start-app.ps1
```

**Mac/Linux:**
```bash
./scripts/start-app.sh
```

### Step 4: Open Browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/

> [!IMPORTANT]
> The script opens two new terminal windows (one for Backend, one for Frontend). **DO NOT CLOSE THESE WINDOWS**. Closing them stops the server.

### Step 5: Stop the App
Close the two terminal windows created by the script.

---

## Method 2: Manual Startup

### Step 1: Open TWO Terminal Windows

You need two separate terminals - one for backend, one for frontend.

### Step 2: Start Backend (Terminal 1)

```bash
# Navigate to backend
cd backend

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Run migrations (first time or after model changes)
python manage.py migrate

# Start server
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 3: Start Frontend (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Start development server
npm run dev
```

You should see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

## Port Reference

| Port | Service | URL |
|------|---------|-----|
| 3000 | Frontend (Next.js) | http://localhost:3000 |
| 8000 | Backend (Django) | http://localhost:8000 |

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer1@email.com | pass1234 |
| Dealer | dealer1@premierauto.com | pass1234 |
| Admin | admin@paylesscars.com | admin |

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start everything | `.\scripts\start-app.ps1` |
| Fresh setup | `.\scripts\fresh-setup.ps1` |
| Install frontend deps | `cd frontend; npm install` |
| Install backend deps | `cd carnegotiate; pip install -r requirements/development.txt` |
| Run migrations | `cd carnegotiate; python manage.py migrate` |
