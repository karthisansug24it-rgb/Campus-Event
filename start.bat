@echo off
set "PATH=C:\Program Files\nodejs;C:\Program Files\MySQL\MySQL Server 8.4\bin;%PATH%"
echo ========================================================
echo   Launching FXEC Campus Event Management System
echo ========================================================

:: Check if MySQL is running on port 3306 or 3307
netstat -ano | findstr :3306 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [1/3] MySQL Server is running on port 3306 [MySQL80 service].
) else (
    netstat -ano | findstr :3307 | findstr LISTENING >nul
    if %errorlevel% neq 0 (
        echo [1/3] Starting MySQL Server on port 3307...
        start /b "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="%~dp0mysql-data" --port=3307
        timeout /t 3 /nobreak >nul
    ) else (
        echo [1/3] MySQL Server is already running on port 3307.
    )
)

:: Start Backend API
echo [2/3] Starting Backend API Server on Port 5000...
start "Campus Event Backend" cmd /k "cd /d "%~dp0server" && npm start"

:: Start Frontend Client
echo [3/3] Starting Frontend Dev Server on Port 5173...
start "Campus Event Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Application launched!
echo Open http://localhost:5173 in your browser.

