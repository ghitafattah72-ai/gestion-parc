# Gestion du Parc Informatique Hutchinson

Application complète de gestion du parc informatique avec gestion de stock et des locaux IT.

## Architecture

### Backend
- **Framework**: Flask (Python)
- **Base de données**: MySQL
- **API**: RESTful avec Flask-CORS

### Frontend
- **Framework**: React 18
- **CSS**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

##  Structure du Projet

```
gs parc/
├── backend/                 # API Flask
│   ├── routes/             # Routes API pour chaque module
│   ├── app.py              # Main application
│   ├── config.py           # Configuration
│   ├── models.py           # Modèles SQLAlchemy
│   └── requirements.txt     # Dépendances Python
│
├── frontend/               # Application React
│   ├── src/
│   │   ├── pages/          # Pages principales
│   │   ├── components/     # Composants réutilisables
│   │   ├── api.js          # Client API
│   │   └── App.jsx         # Composant principal
│   ├── tailwind.config.js  # Configuration Tailwind
│   └── package.json        # Dépendances Node
│
└── database/               # Scripts SQL
    └── schema.sql          # Schéma de base de données
```

##  Installation et Démarrage

### 1. Configuration de la Base de Données

```bash
# Créer la base de données
mysql -u root -p < database/schema.sql
```

### 2. Backend (Python/Flask)

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows
venv\\Scripts\\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
copy .env.example .env
# Éditer .env avec vos infos MySQL

# Démarrer le serveur
python app.py
```

Le serveur Flask démarre sur `http://localhost:5000`

### 3. Frontend (React)

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

L'application React démarre sur `http://localhost:3000`

##  Fonctionnalités Implémentées

### 1. Gestion du Stock
- ✅ Affichage des matériels et quantités
- ✅ Ajout d'équipements
- ✅ Suppression d'équipements
- ✅ Recherche et filtrage par type de stock
- ✅ **Export en CSV/Excel**
- ✅ Détails PC (RAM, Stockage, Processeur, etc.)
- ✅ États des équipements (nouveau, occasion bon état, occasion mauvaise état, en panne)

### 2. Gestion des Mouvements
- ✅ Transfert d'équipements du stock vers Local IT
- ✅ Mise à jour automatique des quantités en stock
- ✅ Suivi des sorties de stock
- ✅ Détails des PC et accessoires
- ✅ **Export en CSV/Excel**
- ✅ Suppression de mouvements avec restauration du stock

### 3. Gestion du Parc
- ✅ Ajout et modification d'équipements parc
- ✅ Tableau avec colonnes: Name, Alternate username, OS Name, OS Version, Type, Model, Manufacturer, N° de série, Processeur, RAM, Disque dur, Emplacement, Service, ESU
- ✅ **Import depuis Excel/CSV**
- ✅ **Export en CSV/Excel**
- ✅ Recherche par nom ou N° de série

### 4. Gestion des Locaux IT
- ✅ 5 locaux IT pré-configurés (CIM2, CIM6, CIM7, CIM4H1, CIM4H2)
- ✅ Ajout et modification de locaux IT
- ✅ Gestion dynamique des baies IT
- ✅ Bouton pour ajouter du matériel à chaque local
- ✅ Transfert automatique vers les baies

### 5. Tableau de Bord
- ✅ Statistiques globales
- ✅ Graphiques de quantités par type de stock
- ✅ Mise à jour automatique

##  Sécurité

- Permissions utilisateur pour export/import
- Rôles (admin, user, manager)
- Structure de base de données sécurisée avec contraintes

##  Types d'Équipements Supportés

- pc portable
- pc fixe
- imprimante
- étiquette
- imprimante A4
- imprimante location
- imprimante traceur
- écran
- câble
- souris filaire
- clavier filaire
- souris sans fil
- clavier et souris filaire
- douchettes
- casque
- autre

##  Types de Stock

- FSS
- IMS
- C2S
- Commun

##  Base de Données MySQL

**Nom de la base**: `gestion_parc`

**Tables principales**:
- `utilisateurs` - Gestion des utilisateurs et permissions
- `stock` - Inventaire des équipements
- `mouvements` - Historique des transferts
- `parc` - Équipements utilisateur
- `locaux_it` - Locaux informatiques
- `baies_it` - Baies techniques
- `equipements_baies` - Liaison équipements-baies

##  API Endpoints

### Stock
- `GET /api/stock/` - Lister tous les stocks
- `POST /api/stock/` - Créer un stock
- `DELETE /api/stock/<id>` - Supprimer un stock
- `GET /api/stock/stats` - Statistiques
- `GET /api/stock/export` - Exporter (format: csv ou xlsx)

### Mouvements
- `GET /api/mouvements/` - Lister mouvements
- `POST /api/mouvements/` - Créer mouvement
- `DELETE /api/mouvements/<id>` - Supprimer mouvement
- `GET /api/mouvements/stats` - Statistiques
- `GET /api/mouvements/export` - Exporter

### Parc
- `GET /api/parc/` - Lister parc
- `POST /api/parc/` - Créer équipement
- `PUT /api/parc/<id>` - Modifier équipement
- `DELETE /api/parc/<id>` - Supprimer équipement
- `POST /api/parc/import` - Importer Excel
- `GET /api/parc/export` - Exporter

### Locaux IT
- `GET /api/locaux-it/` - Lister locaux
- `POST /api/locaux-it/` - Créer local
- `PUT /api/locaux-it/<id>` - Modifier local
- `GET /api/locaux-it/<id>/baies` - Baies d'un local
- `POST /api/locaux-it/<id>/baies` - Ajouter baie

##  Interface Utilisateur

- Navigation latérale intuitive
- Palette de couleurs professionnelle (bleu Hutchinson)
- Responsive design
- Formulaires dynamiques
- Tables avec pagination

##  Fichiers Excel Supportés

- `.xlsx` - Fichiers Excel modernes
- `.xls` - Fichiers Excel classiques
- `.csv` - Fichiers CSV

##  Configuration Environnement

Fichier `.env.example`:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

##  Dépannage

### Erreur de connexion à MySQL
- Vérifier que MySQL est en cours d'exécution
- Vérifier les identifiants dans le fichier `.env`
- S'assurer que la base de données est créée

### Erreur CORS
- La configuration CORS est activée côté backend
- Vérifier l'URL du backend dans `frontend/src/api.js`

### Problème d'import Excel
- Vérifier le format du fichier
- S'assurer que les colonnes correspondent aux champs attendus

##  Support

Pour toute question concernant l'application, veuillez contacter l'équipe IT de Hutchinson.

---

**Développé pour Hutchinson** - Gestion du parc informatique centralisée
