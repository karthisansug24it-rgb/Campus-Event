@echo off
:: Ensure script is run with Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo =========================================================
    echo ERROR: Administrator privileges required!
    echo.
    echo Please RIGHT-CLICK this file and select "Run as administrator".
    echo =========================================================
    pause
    exit /b 1
)

echo =========================================================
echo Fixing MySQL80 Windows Service Path
echo =========================================================
echo.

:: Step 1: Create directory junction so both paths work
if not exist "C:\Program Files\MySQL\MySQL Server 8.0" (
    echo [1/3] Creating directory junction: "MySQL Server 8.0" -> "MySQL Server"...
    mklink /J "C:\Program Files\MySQL\MySQL Server 8.0" "C:\Program Files\MySQL\MySQL Server"
) else (
    echo [1/3] Path already linked.
)

:: Step 2: Update the Windows Service ImagePath in Registry
echo [2/3] Updating MySQL80 Service registry ImagePath...
reg add "HKLM\SYSTEM\CurrentControlSet\Services\MySQL80" /v ImagePath /t REG_EXPAND_SZ /d "\"C:\Program Files\MySQL\MySQL Server\bin\mysqld.exe\" --defaults-file=\"C:\ProgramData\MySQL\MySQL Server 8.0\my.ini\" MySQL80" /f

:: Step 3: Start the MySQL80 service
echo [3/3] Starting MySQL80 Service...
net start MySQL80

echo.
echo =========================================================
echo SUCCESS: MySQL Server is now running on port 3306!
echo You can now connect in MySQL Workbench.
echo =========================================================
pause

