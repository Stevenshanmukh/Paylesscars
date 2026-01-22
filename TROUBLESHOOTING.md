# Troubleshooting Guide

## Issue: App won't start on localhost:3000

### Symptom
- Browser shows "This site can't be reached"
- Terminal shows no output or errors

### Solutions

#### 1. Check if port is in use
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Kill it
# Windows: taskkill /PID <PID> /F
# Mac/Linux: kill -9 <PID>
```

#### 2. Restart with clean slate
```bash
# Run the fresh setup script
.\scripts\fresh-setup.ps1
```

or manually:
```bash
# Clear cache and restart
cd frontend
rm -rf .next
npm run dev
```

#### 3. Reinstall dependencies
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Issue: "Connection refused" or "Network Error"

### Symptom
- Frontend loads but shows API errors
- "Failed to fetch" messages
- CORS errors in console

### Solutions

#### 1. Ensure backend is running
```bash
# Check if backend is running (Health Check)
curl http://localhost:8000/api/v1/health/

# If not, start it
cd backend
venv\Scripts\activate
python manage.py runserver
```

#### 2. Check Database Settings
The application defaults to **SQLite** for stable local development (no Docker required).
Ensure `.env` contains:
```ini
DATABASE_URL=sqlite:///db.sqlite3
```
If you wish to use PostgreSQL, update this value in `.env` and start your database container.

---

#### 3. Check environment variables
```bash
# Frontend should have this in .env.local
cat frontend/.env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Issue: "Module not found" errors

### Symptom
- Error messages about missing modules
- Import errors in terminal

### Solutions

#### Frontend
```bash
cd frontend
rm -rf node_modules
npm install
```

#### Backend
```bash
cd backend
venv\Scripts\activate
pip install -r requirements/development.txt
```

---

## Issue: Database connection failure

### Symptom
- "OperationalError"
- "Is the server running on host..."

### Solutions

The application uses standard connection settings defined in `.env`.
If using Docker, ensure `docker-compose up` is running.
If running locally without Docker, ensure Postgres is installed and running on port 5432 or 5433.

The `.env` file should be in the root `paylesscars/` directory.

---

## Issue: Authentication not working

### Symptom
- Can't login
- Keeps redirecting to login
- Token errors

### Solutions

```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()

# Restart frontend
cd frontend
npm run dev
```

---

## Still Having Issues?

1. Check the terminal output for specific error messages.
2. Check `http://localhost:8000/api/v1/health/` (Returns JSON status).
3. `http://localhost:3000` should load the app.
