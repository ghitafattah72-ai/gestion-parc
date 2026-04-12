# 🗺️ GUIDE DE NAVIGATION - Fichiers et Répertoires

```
C:\Users\Ghita\Desktop\gs parc\
```

## 📄 FICHIERS DOCUMENTATION (Racine)

| Fichier | Contenu | Lecture |
|---------|---------|---------|
| **START.md** | ⭐ Démarrage rapide | 1ère |
| **README.md** | Vue d'ensemble | 2ème |
| **INSTALLATION.md** | Étapes détaillées | 3ème |
| **USER_GUIDE.md** | Mode d'emploi complet | 4ème |
| **PROJECT_SUMMARY.md** | Résumé technique | 5ème |
| **INDEX.md** | Structure du projet | Référence |
| **ALL_CODES.md** | Index des codes | Référence |
| **ENV_VARS.md** | Variables environnement | Référence |
| **FINAL_CHECKLIST.md** | Résumé final | Validation |
| **GUIDE_NAVIGATION.md** | Ce fichier | Référence |

## 📁 BACKEND - C:\Users\Ghita\Desktop\gs parc\backend\

### Fichiers Principaux
```
backend/
├── app.py                 ← Démarrage application Flask
├── models.py              ← 7 modèles SQLAlchemy
├── config.py              ← Configuration (MySQL, etc.)
├── requirements.txt       ← 8 dépendances Python
├── .env.example           ← Template variables
└── .env                   ← Variables actuelles (à créer)
```

### Routes API (5 modules)
```
backend/routes/
├── stock.py               ← Gestion du stock
├── mouvements.py          ← Transferts équipements
├── parc.py                ← Équipements parc
├── locaux_it.py           ← Locaux IT et baies
├── utilisateurs.py        ← Gestion utilisateurs
└── __init__.py            ← Package init
```

### Utilitaires
```
backend/utils/
├── excel_helpers.py       ← Fonctions Excel/CSV
└── __init__.py            ← Package init
```

### Dossier Upload (créé automatiquement)
```
backend/
└── uploads/               ← Fichiers uploadés

### Environnement Python (après installation)
```
backend/
└── venv/                  ← Environnement virtuel Python
```

## 📁 FRONTEND - C:\Users\Ghita\Desktop\gs parc\frontend\

### Fichiers Configuration
```
frontend/
├── package.json           ← Dépendances Node.js
├── tailwind.config.js     ← Config Tailwind CSS
├── tailwind.config.full.js ← Config Tailwind avancée
├── postcss.config.js      ← Config PostCSS
└── .env.example           ← Template environnement
```

### Dossier Public
```
frontend/public/
└── index.html             ← HTML principale
```

### Code Source React
```
frontend/src/
├── App.jsx                ← Composant principal (navigation)
├── api.js                 ← Client API Axios
├── index.js               ← Point d'entrée
├── index.jsx              ← ReactDOM render
└── index.css              ← Styles globaux
```

### Pages (Modules Principaux)
```
frontend/src/pages/
├── Dashboard.jsx          ← Tableau de bord
├── Stock.jsx              ← Gestion du stock
├── Mouvements.jsx         ← Transferts d'équipements
├── Parc.jsx               ← Équipements parc
└── LocalsIT.jsx           ← Locaux IT et baies
```

### Composants Réutilisables
```
frontend/src/components/
└── Alerts.jsx             ← Alertes et notifications
```

### Utilitaires Frontend
```
frontend/src/utils/
└── apiClient.js           ← Configuration API client
```

### Node Modules (après installation)
```
frontend/
└── node_modules/          ← Dépendances npm
```

## 📁 BASE DE DONNÉES - C:\Users\Ghita\Desktop\gs parc\database\

```
database/
└── schema.sql             ← Schéma MySQL complet
```

## ⚙️ FICHIERS DE CONFIGURATION

```
C:\Users\Ghita\Desktop\gs parc\
├── setup.bat              ← Installation Windows
├── setup.sh               ← Installation Linux/Mac
└── .gitignore             ← Fichiers ignorés par Git
```

## 🔄 FLUX DE NAVIGATION

### Pour INSTALLER:
1. Lire: **START.md**
2. Suivre: **INSTALLATION.md**
3. Exécuter: **setup.bat** (Windows)
4. Créer: `.env` fichier dans backend/

### Pour UTILISER:
1. Lire: **START.md**
2. Consulter: **USER_GUIDE.md**
3. Accéder: `http://localhost:3000`

### Pour COMPRENDRE:
1. Lire: **PROJECT_SUMMARY.md**
2. Consulter: **INDEX.md**
3. Voir: **backend/models.py**
4. Voir: **frontend/src/App.jsx**

### Pour MODIFIER:
1. Backend routes: `backend/routes/*.py`
2. Frontend pages: `frontend/src/pages/*.jsx`
3. Modèles: `backend/models.py`
4. Styles: `frontend/src/index.css`

## 📊 CHEMINS D'ACCÈS

### En Développement

| Service | URL | Config |
|---------|-----|--------|
| Frontend | http://localhost:3000 | `frontend/.env` |
| Backend | http://localhost:5000 | `backend/.env` |
| MySQL | localhost:3306 | `backend/.env` |
| PhpMyAdmin | http://localhost/phpmyadmin | MySQL GUI |

### Base de Données

```
MySQL Serveur: localhost
Port: 3306
Utilisateur: root
Base: gestion_parc
```

Accès via:
- MySQL Workbench
- PhpMyAdmin
- Command line: `mysql -u root -p`

## 📝 FICHIERS À CRÉER/MODIFIER

### Avant de Démarrer

1. **backend/.env** (copier de .env.example)
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

2. **frontend/.env** (copier de .env.example)
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. Database (exécuter schema.sql)
```bash
mysql -u root -p < C:\Users\Ghita\Desktop\gs parc\database\schema.sql
```

## 🎯 POINTS DE DÉMARRAGE

### Point d'Entrée Backend
```python
# Fichier: backend/app.py
# Commande: python app.py
# Démarre sur: http://localhost:5000
```

### Point d'Entrée Frontend
```jsx
// Fichier: frontend/src/index.js
// Commande: npm start
// Démarre sur: http://localhost:3000
```

### Point d'Entrée BD
```sql
-- Fichier: database/schema.sql
-- Commande: mysql -u root -p < schema.sql
-- Crée: Base de données gestion_parc
```

## 🔗 DÉPENDANCES

### Dossier Python
`backend/requirements.txt` → à installer avec: `pip install -r requirements.txt`

### Dossier Node
`frontend/package.json` → à installer avec: `npm install`

## 📦 STRUCTURE RAPIDE

```
Backend (Python Flask)     Frontend (React)         Database (MySQL)
────────────────────       ────────────────        ─────────────────
  app.py                     App.jsx                  schema.sql
  models.py                  pages/                   gestion_parc DB
  routes/                    components/
  utils/                     api.js
  uploads/                   index.css
  venv/
```

## ✅ CHECKLIST DE PREMIÈRE UTILISATION

- [ ] Lire START.md
- [ ] Exécuter INSTALLATION.md étape par étape
- [ ] Créer `.env` fichier
- [ ] Importer schema.sql
- [ ] `pip install -r requirements.txt`
- [ ] `npm install`
- [ ] Démarrer backend (`python app.py`)
- [ ] Démarrer frontend (`npm start`)
- [ ] Vérifier http://localhost:3000
- [ ] Tester un ajout d'équipement
- [ ] Consulter USER_GUIDE.md

## 🚨 Si Problème

1. Vérifier **INSTALLATION.md** (section dépannage)
2. Vérifier fichiers `.env`
3. Vérifier MySQL `gestion_parc` base existe
4. Vérifier ports 3000 et 5000 libres
5. Vérifier logs dans terminal

## 📞 DOCUMENTATION LIÉE

- Backend API: Voir `backend/routes/` docstrings
- Frontend Composants: Voir `frontend/src/pages/` JSDoc
- Base de Données: Voir `database/schema.sql` commentaires
- Configuration: Voir `backend/config.py` commentaires

---

**Naviguez facilement dans le projet avec ce guide!**

Mise à jour: 2026-04-11
