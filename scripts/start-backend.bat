@echo off
cd "C:\Users\steve\Downloads\paylesscars\carnegotiate"
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
) else (
    echo "Python venv not found! Run fresh-setup.ps1"
    pause
)
