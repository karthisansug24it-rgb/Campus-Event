@echo off
set "PATH=C:\Program Files\nodejs;C:\Program Files\MySQL\MySQL Server 8.4\bin;%PATH%"
echo ========================================================
echo   Launching FXEC Campus Event Management System
echo ========================================================

:: Detect MySQL executable
set "MYSQLD_BIN="
if exist "C:\Program Files\MySQL\MySQL Server\bin\mysqld.exe" (
    set "MYSQLD_BIN=C:\Program Files\MySQL\MySQL Server\bin\mysqld.exe"
    set "PATH=C:\Program Files\MySQL\MySQL Server\bin;%PATH%"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" (
    set "MYSQLD_BIN=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
    set "PATH=C:\Program Files\MySQL\MySQL Server 8.4\bin;%PATH%"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
    set "MYSQLD_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
    set "PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin;%PATH%"
)

:: Check if MySQL is running on port 3306
netstat -ano | findstr :3306 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [1/3] MySQL Server is running on port 3306.
) else (
    if defined MYSQLD_BIN (
        echo [1/3] Starting MySQL Server on port 3306...
        start /b "" "%MYSQLD_BIN%" --datadir="%~dp0mysql-data" --port=3306
        timeout /t 3 /nobreak >nul
    ) else (
        echo [1/3] WARNING: mysqld.exe not found. Please ensure MySQL is running on port 3306.
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

