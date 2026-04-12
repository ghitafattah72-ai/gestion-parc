@echo off
REM Configuration automatique du projet pour Windows

echo.
echo === Installation Gestion Parc Informatique ===
echo.

REM Backend
echo [1/4] Configuration du Backend...
cd backend

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python n'est pas installe. Veuillez installer Python 3.8+
    exit /b 1
)

REM Créer environnement virtuel
python -m venv venv

REM Activer l'environnement
call venv\Scripts\activate.bat

REM Installer les dépendances
pip install -r requirements.txt

REM Créer .env
if not exist .env (
    copy .env.example .env
    echo. F
    echo Fichier .env cree. Veuillez le personnaliser avec vos parametres MySQL.
)

cd ..

REM Frontend
echo.
echo [2/4] Configuration du Frontend...
cd frontend

REM Vérifier Node.js
npm --version >nul 2>&1
if errorlevel 1 (
    echo Node.js^/npm n'est pas installe. Veuillez installer Node.js 14+
    exit /b 1
)

REM Installer les dépendances
npm install

cd ..

REM Base de données
echo.
echo [3/4] Configuration de la Base de Donnees...
echo Creer la base de donnees 'gestion_parc' avec:
echo mysql -u root -p ^< database/schema.sql

echo.
echo [4/4] OK - Installation complete!
echo.
echo Pour demarrer l'application:
echo   Terminal 1 - Backend:
echo     cd backend
echo     venv\Scripts\activate.bat
echo     python app.py
echo.
echo   Terminal 2 - Frontend:
echo     cd frontend
echo     npm start
echo.
pause
