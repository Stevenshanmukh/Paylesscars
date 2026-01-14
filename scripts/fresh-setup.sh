#!/bin/bash

set -e  # Exit on any error

echo "=========================================="
echo "  Payless Cars Fresh Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: Killing any existing processes...${NC}"
pkill -f "next" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "python.*runserver" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Processes killed${NC}"

echo -e "${YELLOW}Step 2: Setting up Backend...${NC}"
cd "$PROJECT_ROOT/backend"

# Create virtual environment if not exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements/development.txt --quiet

# Run migrations
echo "Running database migrations..."
python manage.py migrate --no-input

# Create test data if needed
if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.count())" | grep -q "^0$"; then
    echo "Seeding test data..."
    python manage.py seed_test_data 2>/dev/null || echo "No seed command found"
fi

echo -e "${GREEN}✓ Backend ready${NC}"

echo -e "${YELLOW}Step 3: Setting up Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"

# Check if node_modules is corrupted or missing
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing npm dependencies (this may take a few minutes)..."
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install
else
    echo "node_modules exists, checking for updates..."
    npm install
fi

echo -e "${GREEN}✓ Frontend ready${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "To start the app, run:"
echo "  ./scripts/start-app.sh"
echo ""
echo "Or manually:"
echo "  Terminal 1: cd carnegotiate && source venv/bin/activate && python manage.py runserver"
echo "  Terminal 2: cd frontend && npm run dev"
