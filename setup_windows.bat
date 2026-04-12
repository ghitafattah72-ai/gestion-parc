@echo off
REM Setup script for gs parc application
REM Windows installation script

echo.
echo ========================================
echo  GS PARC - Installation Script
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python found
python --version

REM Warn if Python 3.14 is used, because Flask may be incompatible
python --version 2>nul | findstr /R "3\.14" >nul 2>&1
if %errorlevel%==0 (
    echo WARNING: Python 3.14 may be incompatible with Flask.
    echo Prefer installing Python 3.11 or Python 3.12 if possible.
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version

REM Create backend venv
echo.
echo [1/4] Creating Python virtual environment...
cd /d "%~dp0backend"
py -3.12 --version >nul 2>&1
if %errorlevel%==0 (
    echo Using Python 3.12 for virtual environment
    py -3.12 -m venv venv
) else (
    py -3.11 --version >nul 2>&1
    if %errorlevel%==0 (
        echo Using Python 3.11 for virtual environment
        py -3.11 -m venv venv
    ) else (
        echo Using default Python for virtual environment
        python -m venv venv
    )
)
call venv\Scripts\activate.bat

REM Install backend dependencies
echo [2/4] Installing Python dependencies (this may take a few minutes)...
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo [OK] Python dependencies installed

cd /d "%~dp0"

REM Setup frontend
echo.
echo [3/4] Installing Node.js dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo [OK] Node.js dependencies installed

cd /d "%~dp0"

REM Create .env files if they don't exist
echo.
echo [4/4] Creating configuration files...
if not exist "backend\.env" (
    echo Creating backend\.env...
    (
        echo MYSQL_HOST=localhost
        echo MYSQL_USER=root
        echo MYSQL_PASSWORD=
        echo MYSQL_DB=gestion_parc
        echo MYSQL_PORT=3306
        echo FLASK_ENV=development
        echo FLASK_DEBUG=True
    ) > backend\.env
    echo [INFO] Please edit backend\.env with your MySQL credentials
)

if not exist "frontend\.env" (
    echo Creating frontend\.env...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
    ) > frontend\.env
    echo [OK] frontend\.env created
)

REM Database setup info
echo.
echo ========================================
echo  INSTALLATION COMPLETE!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. CREATE DATABASE (RUN ONCE):
echo    ===========================
echo    Open PowerShell/CMD and run:
echo    mysql -u root -p gestion_parc ^< "database\schema.sql"
echo    (Enter your MySQL password when prompted)
echo.
echo 2. CONFIGURE CREDENTIALS:
echo    =========================
echo    Edit this file: backend\.env
echo    Set your MySQL username and password
echo.
echo 3. START BACKEND:
echo    ===============
echo    Terminal 1 - Run these commands:
echo    cd "C:\Users\Ghita\Desktop\gs parc\backend"
echo    venv\Scripts\activate
echo    python app.py
echo.
echo 4. START FRONTEND:
echo    ================
echo    Terminal 2 - Run these commands:
echo    cd "C:\Users\Ghita\Desktop\gs parc\frontend"
echo    npm start
echo.
echo 5. ACCESS APPLICATION:
echo    ====================
echo    Browser: http://localhost:3000
echo    Login: admin@hutchinson.com
echo    Password: admin123
echo.
echo ========================================
pause
