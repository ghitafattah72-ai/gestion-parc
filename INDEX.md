# 📚 INDEX COMPLET - Gestion Parc Informatique Hutchinson

## 🏗️ STRUCTURE DU PROJET

```
C:\Users\Ghita\Desktop\gs parc\
│
├── 📄 START.md                          ← ⭐ LIRE EN PREMIER
├── 📄 README.md                         ← Vue d'ensemble
├── 📄 INSTALLATION.md                   ← Installation détaillée
├── 📄 USER_GUIDE.md                     ← Guide d'utilisation
├── 📄 PROJECT_SUMMARY.md                ← Résumé complet
├── 📄 ALL_CODES.md                      ← Index des codes
├── 📄 ENV_VARS.md                       ← Variables environnement
├── 📄 setup.bat                         ← Installation Windows
├── 📄 setup.sh                          ← Installation Linux/Mac
├── 📄 .gitignore                        ← Fichiers ignorés
│
├── 📁 backend/                          # API Flask (Python)
│   ├── 📄 app.py                        # Démarrage app
│   ├── 📄 config.py                     # Configuration
│   ├── 📄 models.py                     # 7 modèles SQLAlchemy
│   ├── 📄 requirements.txt               # 8 dépendances Python
│   ├── 📄 .env                          # Variables (à créer)
│   ├── 📄 .env.example                  # Template env
│   │
│   ├── 📁 routes/                       # 5 modules API
│   │   ├── 📄 stock.py                  # Stock (CRUD, export)
│   │   ├── 📄 mouvements.py             # Mouvements (transferts)
│   │   ├── 📄 parc.py                   # Parc (import/export)
│   │   ├── 📄 locaux_it.py              # Locaux IT & Baies
│   │   ├── 📄 utilisateurs.py           # Permissions utilisateurs
│   │   └── 📄 __init__.py               # Package init
│   │
│   ├── 📁 utils/                        # Utilitaires
│   │   ├── 📄 excel_helpers.py          # Fonctions Excel
│   │   └── 📄 __init__.py               # Package init
│   │
│   └── 📁 uploads/                      # Fichiers uploadés
│
├── 📁 frontend/                         # Application React
│   ├── 📄 package.json                  # 5 dépendances
│   ├── 📄 tailwind.config.js            # Config Tailwind
│   ├── 📄 postcss.config.js             # Config PostCSS
│   ├── 📄 .env.example                  # Template env
│   │
│   ├── 📁 public/
│   │   └── 📄 index.html                # HTML principal
│   │
│   └── 📁 src/
│       ├── 📄 App.jsx                   # Navigation principale
│       ├── 📄 api.js                    # Client API (Axios)
│       ├── 📄 index.js                  # Point entrée
│       ├── 📄 index.jsx                 # ReactDOM render
│       ├── 📄 index.css                 # Styles globaux
│       │
│       ├── 📁 pages/                    # 5 pages principales
│       │   ├── 📄 Dashboard.jsx         # Tableau de bord
│       │   ├── 📄 Stock.jsx             # Module Stock
│       │   ├── 📄 Mouvements.jsx        # Module Mouvements
│       │   ├── 📄 Parc.jsx              # Module Parc
│       │   └── 📄 LocalsIT.jsx          # Module Locaux IT
│       │
│       ├── 📁 components/               # Composants réutilisables
│       │   ├── 📄 Alerts.jsx            # Alertes UI
│       │   └── ... (autres composants)
│       │
│       └── 📁 utils/
│           └── 📄 apiClient.js          # Config API
│
├── 📁 database/                         # Scripts SQL
│   └── 📄 schema.sql                    # Schéma complet MySQL
│
└── 📁 venv/ (après installation)        # Environnement Python
```

## 🔢 STATISTIQUES DU PROJET

| Catégorie | Nombre |
|-----------|--------|
| **Fichiers Python** | 13 |
| **Fichiers React/JS** | 8 |
| **Fichiers Config** | 7 |
| **Documentation** | 8 |
| **Tests/Exemples** | 2 |
| **TOTAL** | **38 fichiers** |

## 🗄️ BASE DE DONNÉES MySQL

**Nom**: `gestion_parc`

### Tables (7)
1. `utilisateurs` - 5 colonnes, auto-création
2. `stock` - 14 colonnes
3. `mouvements` - 15 colonnes
4. `parc` - 14 colonnes
5. `locaux_it` - 4 colonnes
6. `baies_it` - 6 colonnes
7. `equipements_baies` - 4 colonnes

**Total: 62 colonnes**

### Données Pré-Insérées
- 5 Locaux IT (CIM2, CIM6, CIM7, CIM4H1, CIM4H2)
- 4 Baies pour CIM6
- 1 Utilisateur admin par défaut

## 🔗 API ENDPOINTS

### Stock
- `GET /api/stock/` - Liste (pagination)
- `POST /api/stock/` - Créer
- `DELETE /api/stock/<id>` - Supprimer
- `GET /api/stock/stats` - Statistiques
- `GET /api/stock/export` - Export CSV/XLSX

### Mouvements
- `GET /api/mouvements/` - Liste
- `POST /api/mouvements/` - Créer transfert
- `DELETE /api/mouvements/<id>` - Supprimer
- `GET /api/mouvements/stats` - Stats
- `GET /api/mouvements/export` - Export

### Parc
- `GET /api/parc/` - Liste
- `POST /api/parc/` - Créer
- `PUT /api/parc/<id>` - Modifier
- `DELETE /api/parc/<id>` - Supprimer
- `POST /api/parc/import` - Importer Excel
- `GET /api/parc/export` - Exporter

### Locaux IT
- `GET /api/locaux-it/` - Liste locaux
- `POST /api/locaux-it/` - Créer local
- `PUT /api/locaux-it/<id>` - Modifier local
- `GET /api/locaux-it/<id>/baies` - Baies
- `POST /api/locaux-it/<id>/baies` - Ajouter baie
- `PUT /api/locaux-it/baies/<id>` - Modifier baie
- `DELETE /api/locaux-it/baies/<id>` - Supprimer baie

## 🎯 FONCTIONNALITÉS PAR MODULE

### ✨ Stock
- ✅ Affichage listage
- ✅ Ajout (avec détails PC si applicable)
- ✅ Suppression
- ✅ Recherche & filtrage
- ✅ Export CSV/Excel
- ✅ Gestion états équipements
- ❌ Modification (volontairement supprimée)
- ❌ Import (volontairement supprimé)

### ✨ Mouvements
- ✅ Transfert Stock → Local IT
- ✅ Mise à jour quantité auto
- ✅ Historique suivi
- ✅ Suppression avec restauration stock
- ✅ Export CSV/Excel
- ✅ Sélection Baie destination

### ✨ Parc
- ✅ Ajout équipements
- ✅ Modification équipements
- ✅ Suppression
- ✅ Recherche avancée
- ✅ Import Excel/CSV en masse
- ✅ Export CSV/Excel
- ✅ 13 colonnes de données

### ✨ Locaux IT
- ✅ 5 locaux pré-configurés
- ✅ Ajout/modification locaux
- ✅ Gestion baies dynamique
- ✅ Ajout équipement via bouton local
- ✅ Transfert vers baies

### ✨ Dashboard
- ✅ Statistiques globales
- ✅ Graphique quantités/stock
- ✅ Indicateurs clés

## 🔐 SÉCURITÉ

- Permissions utilisateur (export/import)
- Rôles (admin, user, manager)
- Validation backend
- CORS configuré
- Contraintes DB

## 🚀 PORTS

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5000 | http://localhost:5000 |
| MySQL | 3306 | localhost:3306 |

## 📦 DÉPENDANCES

### Backend (8)
```
Flask==2.3.2
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
mysql-connector-python==8.0.33
openpyxl==3.1.2
pandas==2.0.3
python-dotenv==1.0.0
PyMySQL==1.1.0
```

### Frontend (5 + build tools)
```
react==18.2.0
react-dom==18.2.0
axios==1.4.0
react-router-dom==6.12.0
lucide-react==0.263.0
```

## 🎓 APPRENTISSAGE

Pour comprendre le projet, lire dans cet ordre:
1. `START.md` - 5 min
2. `PROJECT_SUMMARY.md` - 10 min
3. `INSTALLATION.md` - 10 min
4. `backend/app.py` - 5 min
5. `frontend/src/App.jsx` - 5 min
6. `backend/models.py` - 10 min
7. `database/schema.sql` - 10 min

**Temps total estimé**: 55 minutes

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] MySQL installé et en cours d'exécution
- [ ] Python 3.8+ installé
- [ ] Node.js 14+ installé
- [ ] Base `gestion_parc` créée
- [ ] Backend env configuré
- [ ] Frontend env configuré
- [ ] Backend dépendances installées
- [ ] Frontend dépendances installées
- [ ] Backend démarre (port 5000)
- [ ] Frontend démarre (port 3000)
- [ ] Navigation fonctionne
- [ ] Test d'ajout équipement
- [ ] Test de mouvement
- [ ] Test d'export
- [ ] Test d'import Parc

## 🐛 SUPPORT

### Erreurs Courantes
- Port déjà utilisé → Changer dans config
- MySQL non accessible → Vérifier .env
- Import échoue → Vérifier colonnes Excel
- API non trouvée → Vérifier CORS

Voir `INSTALLATION.md` pour solutions détaillées.

## 📊 Schéma Relationnel

```
utilisateurs (1) ──→ (0..N) mouvements
                
stock ←─── mouvements ──→ locaux_it
                              ↓
                            baies_it
                              ↓
                        equipements_baies
                              
parc (indépendant)
```

## 🎨 Design System

- **Couleur primaire**: Bleu #3B82F6 (Hutchinson)
- **Palette**: Gris, vert, rouge, orange (alertes)
- **Typography**: System-ui, sans-serif
- **Spacing**: Tailwind (12px base)

## 📝 CONVENTIONS

- **Python**: PEP 8 (snake_case)
- **JavaScript**: camelCase pour variables
- **Components**: PascalCase
- **SQL**: snake_case lowercase
- **Routes**: kebab-case

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Installation complète
2. ✅ Test des fonctionnalités
3. ✅ Ajuster les permissions utilisateurs
4. ✅ Ajouter données réelles
5. ✅ Configurer sauvegardes MySQL
6. ✅ Mettre en production

---

**Application prête pour utilisation!**
Consultez les guides pour démarrer.
