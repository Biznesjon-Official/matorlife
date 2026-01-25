@echo off
echo Starting Mator Life Development Environment...
echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
echo.

REM Start backend and frontend concurrently
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Development servers are starting...
echo Backend will be available at: http://localhost:4000/api
echo Frontend will be available at: http://localhost:5173
echo.
pause