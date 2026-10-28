@echo off
title FXEC Campus Events - Full Stack Web Portal (Backend + Frontend)
cd /d "%~dp0"

echo ====================================================================
echo   Francis Xavier Engineering College - Campus Event Portal
echo   Running Backend and Frontend concurrently in the same terminal
echo ====================================================================
echo.
echo   * Backend API : http://localhost:5000/api
echo   * Frontend Web: http://localhost:5173
echo.
echo   [Tip] Press Ctrl + C anytime to stop both servers safely.
echo ====================================================================
echo.

npm run dev:all
pause
