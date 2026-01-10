#!/bin/bash

set -e

echo "=========================================="
echo "  Starting CarNegotiate"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    pkill -P $$ # Kill child processes
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "next" 2>/dev/null || true
pkill -f "python.*runserver" 2>/dev/null || true
sleep 2

# Check if ports are free
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        echo -e "${RED}Port $1 is still in use!${NC}"
        echo "Run: lsof -i :$1 | awk 'NR>1 {print \$2}' | xargs kill -9"
        exit 1
    fi
}

# On Windows (Git Bash), lsof might not exist
if command -v lsof >/dev/null; then
    check_port 3000
    check_port 8000
fi

# Start Backend
echo -e "${CYAN}Starting Backend on http://localhost:8000 ...${NC}"
cd "$PROJECT_ROOT/carnegotiate"

if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v1/health/ >/dev/null 2>&1 || curl -s http://localhost:8000/admin/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend check timed out (it might still be starting)${NC}"
    fi
    sleep 1
done

# Start Frontend
echo -e "${CYAN}Starting Frontend on http://localhost:3000 ...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}Frontend is still compiling... please wait${NC}"
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}=========================================="
echo "  CarNegotiate is Running!"
echo "==========================================${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC} http://localhost:3000"
echo -e "  ${CYAN}Backend:${NC}  http://localhost:8000"
echo -e "  ${CYAN}API Check:${NC} http://localhost:8000/api/v1/health/"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Keep script running
wait
