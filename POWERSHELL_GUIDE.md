# 🚀 INSTALLATION POWERSHELL - Commandes Exactes

## ⚙️ FIX REQUIREMENTS.TXT

La première étape: j'ai corrigé `requirements.txt` pour ajouter `setuptools`:

```
setuptools>=65.0.0
Flask==2.3.2
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
PyMySQL==1.1.0              # ← Changé de mysql-connector-python
openpyxl==3.1.2
pandas>=1.5.0               # ← Changé de pandas==2.0.3 (version flexible)
python-dotenv==1.0.0
```

---

## 📍 ÉTAPE 1: CRÉER LA BASE DE DONNÉES

### Option A: MySQL CLI

```powershell
# Naveguer au bon dossier
cd 'C:\Users\Ghita\Desktop\gs parc'

# Importer le schéma (remplacer root par votre utilisateur MySQL)
mysql -u root -p gestion_parc < database\schema.sql

# Il va vous demander le mot de passe MySQL, entrez-le
```

### Option B: MySQL Workbench

1. Ouvrir **MySQL Workbench**
2. **File** → **Open SQL Script**
3. Sélectionner: `C:\Users\Ghita\Desktop\gs parc\database\schema.sql`
4. **Execute** (Ctrl+Shift+Enter)

---

## 📍 ÉTAPE 2: BACKEND (Terminal 1)

```powershell
# Naviguer au bon dossier (avec guillemets!)
cd 'C:\Users\Ghita\Desktop\gs parc\backend'

# Créer l'environnement virtuel
# IMPORTANT: Utiliser Python 3.12 ou 3.11 si possible.
# Python 3.14 peut provoquer des erreurs de compatibilité avec Flask.
py -3.12 -m venv venv

# Activer l'environnement virtuel
venv\Scripts\activate

# Installer les dépendances (NOUVELLE VERSION CORRIGÉE)
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Si pandas échoue encore, essayer:
pip install pandas --no-build-isolation
```

### Éditer le fichier .env

```powershell
# Ouvrir le fichier .env avec Notepad ++
notepad .env
```

Remplace les valeurs:
```
MYSQL_HOST=localhost
MYSQL_USER=root                  # ← Votre user MySQL
MYSQL_PASSWORD=                  # ← Votre password MySQL
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

### Démarrer le backend

```powershell
# Toujours depuis C:\Users\Ghita\Desktop\gs parc\backend
# Et avec (venv) activé

python app.py
```

**Vous devez voir:**
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

---

## 📍 ÉTAPE 3: FRONTEND (Terminal 2)

```powershell
# NOUVEAU TERMINAL PowerShell!
# Naviguer au bon dossier (avec guillemets!)
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'

# Installer les dépendances Node.js
npm install

# Démarrer l'application React
npm start
```

**Vous devez voir:**
```
Compiled successfully!
You can now view the app in your browser at: http://localhost:3000
```

---

## 🌐 ÉTAPE 4: ACCÉDER À L'APPLICATION

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000/api
```

### Premiers identifiants (utilisateur admin):

```
Email:    admin@hutchinson.com
Password: admin123
```

---

## 🐛 DÉPANNAGE

### ❌ Erreur: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```powershell
# Vérifier que (venv) est activé (voir le (venv) au début de la ligne)
# Sinon réactiver:
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
venv\Scripts\activate

# Réinstaller
pip install -r requirements.txt
```

### ❌ Erreur: "pandas ... subprocess-exited-with-error"

**Solution:**
```powershell
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
venv\Scripts\activate

# Installer sans build
pip install pandas --no-build-isolation
```

### ❌ Erreur MySQL: "Can't connect to MySQL"

**Vérifications:**
```powershell
# 1. MySQL est-il en cours d'exécution?
# Ctrl+R → services.msc → Chercher MySQL

# 2. Vérifier les credentials dans backend\.env
# MYSQL_USER et MYSQL_PASSWORD corrects?

# 3. Tester la connexion:
mysql -u root -p
# (doit demander le password)
```

### ❌ Erreur: "Port 3000 already in use"

**Solution:**
```powershell
# Tuer le processus Node.js
npx kill-port 3000

# Réessayer npm start
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'
npm start
```

### ❌ Erreur: "Port 5000 already in use"

**Solution:**
```powershell
# Tuer le processus Flask
# Ctrl+C dans le terminal backend

# Attendre 5 secondes et réessayer
python app.py
```

---

## ✅ VÉRIFICATIONS RAPIDES

### Backend actif?

```powershell
# Dans une nouvelle PowerShell
curl http://localhost:5000/api/stock
# Doit retourner du JSON (ou erreur 401 si pas authentifié)
```

### Frontend actif?

```powershell
# Ouvrir le navigateur
Start-Process http://localhost:3000

# Ou manuellement: http://localhost:3000
```

### MySQL connecté?

```powershell
# Dans PowerShell, vérifier les logs du backend
# Doit dire: "MySQL connection successful"
```

---

## 📋 CHECKLIST D'INSTALLATION

```
□ requirements.txt mis à jour
□ Environnement virtuel créé (venv)
□ Dépôts Python installés
□ Base de données créée (schema.sql)
□ .env du backend configuré (credentials MySQL)
□ .env du frontend créé
□ Backend démarré (python app.py)
□ Frontend démarré (npm start)
□ Accessible sur http://localhost:3000
□ Login avec admin@hutchinson.com / admin123
```

---

## 🎯 COMMANDES RAPIDES
Copier-coller vers PowerShell:

```powershell
# 1. Backend
cd 'C:\Users\Ghita\Desktop\gs parc\backend'
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python app.py

# 2. Frontend (AUTRE TERMINAL)
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'
npm install
npm start

# 3. Database (UNE FOIS SEULEMENT)
cd 'C:\Users\Ghita\Desktop\gs parc'
mysql -u root -p gestion_parc < database\schema.sql
```

---

**L'application devrait être 100% fonctionnelle après ça! 🎊**
