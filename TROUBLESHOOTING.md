# 🔧 DÉPANNAGE - Solutions aux Erreurs Courantes

## 🔴 Erreur 1: "ModuleNotFoundError: No module named 'pkg_resources'"

### Cause
La pandas 2.0.3 installe depuis les sources et nécessite setuptools.

### ✅ Solution (APPLIQUÉE)
```
Je J'ai mis à jour requirements.txt:
- Ajout de setuptools>=65.0.0 en première ligne
- Changement de pandas==2.0.3 vers pandas>=1.5.0
- Changement de mysql-connector vers PyMySQL (plus léger)
```

### Commande de Fix
```powershell
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
venv\Scripts\activate

# Réinstaller setuptools s'il manque
pip install --upgrade setuptools wheel

# Réinstaller requirements
pip install -r requirements.txt
```

---

## 🔴 Erreur 2: "Impossible de trouver le chemin d'accès, car il n'existe pas"

### Cause
PowerShell n'aime pas les chemins avec espaces non guillemets.

### ❌ Mauvais
```powershell
cd C:\Users\Ghita\Desktop\gs parc\backend
cd C:\Users\Ghita\Desktop\gs parc\frontend
```

### ✅ Correct (Avec guillemets)
```powershell
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'

# OU avec guillemets doubles
cd "C:\Users\Ghita\Desktop\gs parc\backend"
cd "C:\Users\Ghita\Desktop\gs parc\frontend"
```

---

## 🔴 Erreur 3: "npm error enoent package.json"

### Cause  
npm cherche package.json dans le mauvais dossier (backend au lieu de frontend).

### ❌ Mauvais
```powershell
# Depuis\backend
npm install
npm start
```

### ✅ Correct
```powershell
# Frontend: frontend/
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'
npm install
npm start

# Backend: backend/
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
python app.py
```

---

## 🔴 Erreur 4: "Au caractère Ligne:1 : 18" (MySQL)

### Cause
PowerShell ne reconnaît pas la redirection `<` correctement pour MySQL.

### ✅ Solutions

**Option A: Utiliser le vrai CMD**
```powershell
cmd
cd C:\Users\Ghita\Desktop\gs parc
mysql -u root -p < database\schema.sql
```

**Option B: PowerShell avec guillemets**
```powershell
mysql -u root -p gestion_parc < 'database\schema.sql'
```

**Option C: MySQL Workbench (Plus facile)**
1. Ouvrir MySQL Workbench
2. File → Open SQL Script
3. Sélectionner `database\schema.sql`
4. Execute (Ctrl+Shift+Enter)

---

## 🔴 Erreur 5: "MYSQL access denied for user"

### Cause
Credentials MySQL incorrects dans .env

### ✅ Solution
```powershell
# Éditer le fichier .env
notepad 'C:\Users\Ghita\Desktop\gs parc\backend\.env'
```

Vérifier et corriger:
```
MYSQL_HOST=localhost        # ← localhost ou 127.0.0.1
MYSQL_USER=root             # ← votre user MySQL
MYSQL_PASSWORD=             # ← votre password (laisser vide si pas de password)
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
```

### Test de Connexion
```powershell
# Tester manually
mysql -u root -p
# Entrer le password

# Si erreur, vérifier:
# - MySQL service running (Services.msc)
# - User et password corrects
```

---

## 🔴 Erreur 6: "Flask development server is not running"

### Cause
Backend pas démarré ou a crashé.

### ✅ Solution
```powershell
# Terminal 1 - Backend
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
venv\Scripts\activate

# Réessayer
python app.py

# Si crash, voir les erreurs dans le terminal
```

### Erreurs Courantes à Voir
```
ModuleNotFoundError: Flask not found
→ pip install -r requirements.txt

ConnectionError: Can't connect to MySQL
→ MySQL pas running ou bad credentials

FileNotFoundError: app.py
→ Vérifier le chemin (doit être dans /backend)
```

---

## 🔴 Erreur 7: "localhost:3000 Refused to connect"

### Cause
Frontend pas démarré ou a un erreur.

### ✅ Solution
```powershell
# Terminal 2 - Frontend
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'

# Si npm install pas fait
npm install

# Réessayer
npm start

# Si ça échoue, voir les erreurs
```

### Erreurs Courantes
```
Module not found
→ npm install

Port 3000 already in use
→ npx kill-port 3000
→ npm start

REACT_APP_API_URL not set
→ Créer frontend\.env:
   REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🔴 Erreur 8: "Port 3000/5000 already in use"

### Cause
Un autre processus utilise les ports.

### ✅ Solutions

**Pour Port 3000 (Frontend):**
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou facile
npx kill-port 3000
```

**Pour Port 5000 (Backend):**
```powershell
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Ou simplement
Ctrl+C dans le terminal backend
```

**Changer le port (si conflit):**
```python
# backend/app.py
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Port différent
```

```bash
# frontend
PORT=3001 npm start
```

---

## ✨ SCRIPT DE RÉPARATION COMPLÈTE

Si tout échoue, exécuter ceci:

```powershell
# Aller au bon dossier
cd 'C:\Users\Ghita\Desktop\gs parc\backend'

# Supprimer l'ancien venv
Remove-Item -Recurse -Force venv

# Recréer neuf
# Si vous avez Python 3.12 installé, utilisez py -3.12 ; sinon py -3.11
py -3.12 -m venv venv || py -3.11 -m venv venv
venv\Scripts\activate

# Fresh install
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Vérifier que ça marche
python -c "import flask; import pandas; print('OK')"
```

---

## 📋 CHECKLIST DE DIAGNOSTIC

```
☐ Python 3.8+ installé?
   python --version

☐ Node.js 14+ installé?
   node --version
   npm --version

☐ MySQL running?
   mysql -u root -p (doit refuser si pas bon password, mais pas d'erreur "can't connect")

☐ Backend .env correct?
   cat 'C:\Users\Ghita\Desktop\gs parc\backend\.env'

☐ Frontend .env existe?
   Test: notepad 'C:\Users\Ghita\Desktop\gs parc\frontend\.env'

☐ venv activé dans backend?
   (venv) doit apparaître au début de la ligne

☐ Database schema importé?
   mysql -u root -p gestion_parc
   SHOW TABLES; (doit montrer 7 tables)

☐ Flask démarre?
   python app.py (doit dire "Running on http://127.0.0.1:5000")

☐ npm packages installés?
   ls 'C:\Users\Ghita\Desktop\gs parc\frontend\node_modules' (doit être gros)

☐ React démarre?
   npm start (doit dire "Compiled successfully")
```

---

## 🎯 SI VOUS ÊTES BLOQUÉ

**OPTION 1: Utiliser setup_windows.bat** (Automatisé)
```powershell
cd 'C:\Users\Ghita\Desktop\gs parc'
.\setup_windows.bat
```

**OPTION 2: Utiliser CMD au lieu de PowerShell** (Plus stable)
```cmd
cd C:\Users\Ghita\Desktop\gs parc\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**OPTION 3: Docker** (Si vous avez Docker)
```
Je peux créer un Dockerfile si vous voulez
```

---

## 📞 BESOIN D'AIDE?

Vérifiez dans cet ordre:
1. Les chemins avec guillemets
2. Que (venv) est activé (backend)
3. Que vous êtes dans le bon dossier
4. Les ports 3000 et 5000 disponibles
5. MySQL running avec bons credentials

**Puis regénérez les commandes du POWERSHELL_GUIDE.md**

---

Bonne chance! 🚀
