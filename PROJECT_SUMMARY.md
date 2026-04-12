# Application de Gestion du Parc Informatique - Summar

## 📦 Contenu du Projet

Ce projet contient une application complète de gestion du parc informatique développée pour Hutchinson.

### Structure des Dossiers

```
gs parc/
├── .gitignore              # Fichiers à ignorer
├── START.md                # Guide rapide
├── README.md               # Documentation principale
├── INSTALLATION.md         # Guide d'installation détaillé
├── USER_GUIDE.md          # Guide d'utilisation
│
├── backend/               # API Flask (Python)
│   ├── routes/            # Routes (stock, mouvements, parc, locaux_it, utilisateurs)
│   ├── uploads/           # Dossier pour les fichiers uploadés
│   ├── venv/              # Environnement virtuel Python
│   ├── app.py             # Point d'entrée de l'application Flask
│   ├── config.py          # Configuration (base données, etc.)
│   ├── models.py          # Modèles de données SQLAlchemy
│   ├── requirements.txt    # Dépendances Python
│   ├── .env               # Variables d'environnement
│   └── .env.example       # Exemple de configuration
│
├── frontend/              # Application React
│   ├── public/            # Fichiers publics (index.html)
│   ├── src/
│   │   ├── pages/         # Pages (Dashboard, Stock, Mouvements, Parc, LocalsIT)
│   │   ├── components/    # Composants réutilisables (Alerts)
│   │   ├── api.js         # Client API (axios)
│   │   ├── App.jsx        # Composant principal avec routing
│   │   ├── index.js       # Point d'entrée React
│   │   └── index.css      # Styles globaux
│   ├── .env.example       # Configuration exemple
│   ├── tailwind.config.js # Configuration Tailwind CSS
│   ├── postcss.config.js  # Configuration PostCSS
│   └── package.json       # Dépendances Node.js
│
└── database/              # Scripts SQL
    └── schema.sql         # Schéma complet de la base de données (MySQL)
```

## 🎯 Fonctionnalités Principales

### 1. **Stock** 📦
- [x] Affichage liste des équipements
- [x] Ajout d'équipements
- [x] Suppression d'équipements
- [x] Filtrage par type de stock
- [x] Recherche
- [x] Export CSV/Excel
- [x] Détails PC (RAM, Stockage, Processeur, N° série, etc.)
- [x] Gestion des états (nouveau, occasion, en panne)

### 2. **Mouvements** 🔄
- [x] Transfert de matériel stock → Local IT
- [x] Mise à jour automatique des quantités
- [x] Suivi des sorties
- [x] Historique des mouvements
- [x] Suppression avec restauration du stock
- [x] Export CSV/Excel

### 3. **Parc** 💻
- [x] Ajout d'équipements parc
- [x] Modification d'équipements
- [x] Suppression
- [x] Import Excel/CSV (en masse)
- [x] Export CSV/Excel
- [x] 13 colonnes de données (Name, User, OS, Type, Model, RAM, Disque, Service, etc.)

### 4. **Locaux IT** 🏢
- [x] 5 locaux préconfigurés (CIM2, CIM6, CIM7, CIM4H1, CIM4H2)
- [x] Ajout/modification de locaux
- [x] Gestion dynamique des baies
- [x] Ajout d'équipement à chaque local
- [x] Transfert automatique vers baies

### 5. **Tableau de Bord** 📊
- [x] Statistiques globales
- [x] Graphiques de quantités par stock
- [x] Indicateurs clés

## 🔧 Technologies Utilisées

- **Frontend**: React 18 + Tailwind CSS + Lucide Icons
- **Backend**: Python Flask + SQLAlchemy
- **Base de données**: MySQL
- **API**: RESTful avec Flask-CORS
- **Import/Export**: Python pandas, openpyxl, CSV

## 📋 Spécifications Implémentées

### Types d'Équipements
- pc portable, pc fixe, imprimante, étiquette
- imprimante A4, location, traceur
- écran, câble, souris (filaire/sans fil)
- clavier, douchettes, casque, autre

### Types de Stock
- FSS, IMS, C2S, Commun

### États des Équipements
- nouveau, occasion bon état, occasion mauvaise état, en panne

## 🗄️ Base de Données (MySQL)

**Tables créées automatiquement**:
- `utilisateurs` - Gestion utilisateurs
- `stock` - Inventaire
- `mouvements` - Historique transferts
- `parc` - Équipements parc
- `locaux_it` - Locaux informatiques
- `baies_it` - Baies techniques
- `equipements_baies` - Liaisons baies-équipements

## 🚀 Installation Rapide

### 1. Base de Données
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py  # Démarre sur http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start  # Démarre sur http://localhost:3000
```

## 🔑 Accès par Défaut
- **Email**: admin@hutchinson.com
- **Password**: admin123
- **Permissions**: Export/Import activées

## 📝 Fichiers Importants

| Fichier | Description |
|---------|------------|
| `backend/models.py` | 7 modèles de données |
| `backend/routes/*.py` | 5 modules (stock, mouvements, parc, locaux_it, utilisateurs) |
| `frontend/src/api.js` | Configuration API client |
| `frontend/src/App.jsx` | Navigation principale avec sidebar |
| `database/schema.sql` | Structure complète MySQL |

## 🎨 Design & UX

- **Sidebar** collapsible pour paginaison optimale
- **Couleurs** professionnelles (Bleu Hutchinson #3B82F6)
- **Responsive** design (mobile-friendly)
- **Tables** paginées avec recherche
- **Formulaires** dynamiques (affichage conditionnel)
- **Alertes** visuelles pour feedback utilisateur

## 🔒 Sécurité

- Système de permissions (export/import)
- Rôles utilisateurs (admin, user, manager)
- Validation côté backend
- Contraintes de base de données
- CORS configuré

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| `README.md` | Vue d'ensemble et architecture |
| `INSTALLATION.md` | Étapes détaillées d'installation |
| `USER_GUIDE.md` | Guide d'utilisation complet |
| `START.md` | Démarrage rapide |

## ✅ Points Clés

✓ **Cahier des charges respecté** - Toutes les fonctionnalités demandées
✓ **Export systématique** - Sauf Stock (pas de modification)
✓ **Import Parc** - Support Excel/CSV
✓ **Auto-sync** - Mouvements mettent à jour le stock
✓ **UI Intuitive** - Navigation facile et claire
✓ **Base MySQL** - Nommée `gestion_parc`
✓ **Archit modulaire** - Facile à maintenir et étendre

## 🔄 Flux de Données

```
Frontend React
    ↓↑
  API Flask (Port 5000)
    ↓↑
  MySQL Database (gestion_parc)
```

## 📞 Support et Dépannage

Voir **INSTALLATION.md** pour la résolution de problèmes courants.

---

**Application développée pour Hutchinson** 
Gestion centralisée du parc informatique 2026
