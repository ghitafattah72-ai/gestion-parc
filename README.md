Application web de gestion du parc informatique, du stock, des mouvements, des dechets et des locaux IT.

## Architecture

### Backend
- **Framework**: Flask (Python)
- **Base de donnees**: SQLite par defaut, MySQL en option
- **API**: RESTful avec Flask-CORS
- **Authentification**: JWT avec Flask-JWT-Extended
- **ORM**: SQLAlchemy

### Frontend
- **Framework**: React 18
- **CSS**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts

## Langages de Programmation

- **Python**: logique backend, API Flask, securite JWT et acces base de donnees
- **JavaScript**: frontend React, appels API Axios, routage et interactions UI
- **SQL**: modelisation et manipulation des donnees (SQLite par defaut, MySQL en option)
- **HTML/CSS**: structure et presentation de l'interface utilisateur (avec Tailwind CSS)

## Structure du Projet

```text
gs parc/
├── backend/                    # API Flask
│   ├── routes/                 # Routes API par module
│   ├── utils/                  # Helpers backend
│   ├── uploads/                # Fichiers importes/exportes
│   ├── app.py                  # Point d'entree de l'application
│   ├── config.py               # Configuration base de donnees / environnement
│   ├── decorators.py           # Permissions et protection JWT
│   ├── export_utils.py         # Export CSV / Excel
│   ├── models.py               # Modeles SQLAlchemy
│   ├── requirements.txt        # Dependances Python
│   └── gestion_parc.db         # Base SQLite locale
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/         # Composants reutilisables
│   │   ├── context/            # Gestion d'authentification
│   │   ├── pages/              # Pages principales
│   │   ├── utils/              # Helpers frontend
│   │   ├── api.js              # Client API Axios
│   │   └── App.jsx             # Shell principal + navigation
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
│
└── database/                   # Script SQL optionnel pour MySQL
    └── schema.sql
```

## Installation et Demarrage

### 1. Backend (Python/Flask)

```bash
cd backend

# Creer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows
venv\Scripts\activate

# Installer les dependances
pip install -r requirements.txt

# Creer le fichier .env si necessaire
copy .env.example .env

# Demarrer le serveur
python app.py
```

Le serveur Flask demarre sur `http://localhost:5000`.

### 2. Frontend (React)

```bash
cd frontend

# Installer les dependances
npm install

# Demarrer le serveur de developpement
npm start
```

L'application React demarre sur `http://localhost:3000`.

### 3. Base de donnees

#### Mode par defaut: SQLite
Aucune installation supplementaire n'est necessaire. Le fichier `backend/gestion_parc.db` est utilise automatiquement.

#### Mode optionnel: MySQL
Si vous souhaitez utiliser MySQL, ajoutez `DB_TYPE=mysql` dans le fichier `.env` puis configurez les variables suivantes:

```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
```

Vous pouvez ensuite initialiser la base avec:

```bash
mysql -u root -p < database/schema.sql
```

## Fonctionnalites Implementees

### 1. Gestion du Stock
- Affichage des materiels et quantites
- Ajout, modification et suppression d'equipements
- Recherche et filtrage par type de stock
- Export en CSV / Excel
- Gestion des details techniques des PC
- Gestion de l'etat des equipements

### 2. Gestion des Mouvements
- Entrees et sorties de stock
- Sortie du stock vers le parc
- Sortie du stock vers dechet
- Mise a jour automatique des quantites
- Historique et restauration de mouvements supprimes
- Export en CSV / Excel
- Description libre pour chaque mouvement

### 3. Gestion du Parc
- Ajout et modification d'equipements du parc
- Colonnes detaillees: Name, Alternate username, OS Name, OS Version, Type, Model, Version, Manufacturer, Numero de serie, Processeur, RAM, Disque dur, Emplacement, Service, Activite
- Import depuis Excel / CSV
- Export en CSV / Excel
- Recherche par nom, modele ou numero de serie

### 4. Gestion des Dechets
- Page dediee pour consulter les sorties vers dechet
- Recherche et pagination
- Tracabilite des equipements sortis du stock vers dechet

### 5. Gestion des Locaux IT
- Locaux IT preconfigures
- Ajout et modification de locaux IT
- Gestion dynamique des baies IT
- Gestion du materiel IT reseau
- Export des locaux et des baies

### 6. Tableau de Bord
- Statistiques globales
- Graphiques de quantites par type de stock
- Vue synthetique du parc et du stock
- Mise a jour automatique

### 7. Authentification et Comptes
- Connexion securisee par JWT
- Compte administrateur par defaut
- Changement de mot de passe
- Verification des permissions import / export

## Securite

- Authentification JWT
- Endpoint utilisateur courant (`/api/auth/me`)
- Changement de mot de passe securise
- Permissions utilisateur pour l'import et l'export
- Role administrateur pour les operations sensibles

## Types d'Equipements Supportes

- pc portable
- pc fixe
- imprimante
- etiquette
- imprimante A4
- imprimante location
- imprimante traceur
- ecran
- cable
- souris filaire
- clavier filaire
- souris sans fil
- clavier et souris filaire
- douchettes
- casque
- autre

## Types de Stock

- FSS
- IMS
- C2S
- Commun

## Base de Donnees

### Base par defaut
- `SQLite` avec le fichier `backend/gestion_parc.db`

### Base optionnelle
- `MySQL` si `DB_TYPE=mysql` est configure

### Tables principales
- `utilisateurs` - Gestion des utilisateurs et permissions
- `stock` - Inventaire des equipements
- `mouvements` - Historique des entrees et sorties
- `mouvements_historique` - Historique des mouvements supprimes
- `parc` - Equipements du parc utilisateur
- `locaux_it` - Locaux informatiques
- `baies_it` - Baies techniques
- `equipements_baies` - Liaison equipements / baies
- `materiel_it` - Materiel IT reseau

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/me` - Recuperer l'utilisateur connecte
- `PUT /api/auth/change-password` - Modifier le mot de passe

### Stock
- `GET /api/stock/` - Lister les stocks
- `POST /api/stock/` - Creer un stock
- `PUT /api/stock/<id>` - Modifier un stock
- `DELETE /api/stock/<id>` - Supprimer un stock
- `GET /api/stock/stats` - Statistiques stock
- `GET /api/stock/export` - Exporter les donnees
- `POST /api/stock/import` - Importer un fichier

### Mouvements
- `GET /api/mouvements/` - Lister les mouvements
- `GET /api/mouvements/dechets` - Lister les sorties vers dechet
- `POST /api/mouvements/` - Creer un mouvement
- `PUT /api/mouvements/<id>` - Modifier un mouvement
- `DELETE /api/mouvements/<id>` - Supprimer un mouvement
- `GET /api/mouvements/stats` - Statistiques mouvements
- `GET /api/mouvements/export` - Exporter les mouvements
- `GET /api/mouvements/sources/stock` - Sources disponibles depuis le stock
- `GET /api/mouvements/sources/parc` - Sources disponibles depuis le parc

### Parc
- `GET /api/parc/` - Lister le parc
- `POST /api/parc/` - Creer un equipement
- `PUT /api/parc/<id>` - Modifier un equipement
- `DELETE /api/parc/<id>` - Supprimer un equipement
- `POST /api/parc/import` - Importer un fichier Excel / CSV
- `GET /api/parc/export` - Exporter le parc

### Locaux IT
- `GET /api/locaux-it/` - Lister les locaux
- `POST /api/locaux-it/` - Creer un local
- `PUT /api/locaux-it/<id>` - Modifier un local
- `GET /api/locaux-it/<id>/baies` - Lister les baies d'un local
- `POST /api/locaux-it/<id>/baies` - Ajouter une baie

## Interface Utilisateur

- Navigation principale: Dashboard, Parc, Stock, Locaux IT, Mouvements, Dechets
- Interface responsive
- Formulaires dynamiques
- Tables avec pagination et recherche
- Tableau de bord avec statistiques et graphiques

## Fichiers Excel Supportes

- `.xlsx` - Fichiers Excel modernes
- `.xls` - Fichiers Excel classiques
- `.csv` - Fichiers CSV

## Configuration Environnement

Exemple de configuration:

```env
FLASK_ENV=development
FLASK_DEBUG=True
JWT_SECRET_KEY=change-me-in-production

# Optionnel: activer MySQL
# DB_TYPE=mysql
# MYSQL_HOST=localhost
# MYSQL_USER=root
# MYSQL_PASSWORD=
# MYSQL_DB=gestion_parc
# MYSQL_PORT=3306
```

## Depannage

### Probleme de base de donnees
- En SQLite: verifier que le dossier `backend/` est accessible en ecriture
- En MySQL: verifier que MySQL est demarre et que les identifiants sont corrects
- Verifier le type de base configure dans `backend/config.py`

### Erreur CORS
- La configuration CORS est activee cote backend
- Verifier l'URL du backend dans `frontend/src/api.js`

### Probleme d'import Excel
- Verifier le format du fichier
- S'assurer que les colonnes correspondent aux champs attendus

### Probleme d'authentification
- Verifier la presence du token JWT
- Se reconnecter si le token a expire

## Support

Pour toute question concernant l'application, veuillez contacter l'equipe IT de Hutchinson.

---

**Developpe pour Hutchinson** - Gestion du parc informatique centralisee
