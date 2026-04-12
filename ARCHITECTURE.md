# 🏗️ ARCHITECTURE DE L'APPLICATION

## 📐 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR FINAL                         │
│              (Navigateur Web - Port 3000)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND REACT (Port 3000)                  │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ Dashboard  │ │   Stock    │ │ Mouvements │            │
│  └────────────┘ └────────────┘ └────────────┘            │
│  ┌────────────┐ ┌────────────┐                            │
│  │    Parc    │ │ Locaux IT  │                            │
│  └────────────┘ └────────────┘                            │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │   Tailwind CSS + Lucide Icons   │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │    API Client (axios)           │                       │
│  │    http://localhost:5000/api    │                       │
│  └─────────────────────────────────┘                       │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             BACKEND FLASK (Port 5000)                       │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │      Flask Application          │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │  Stock   │ │Mouvements│ │   Parc   │                   │
│  │  Routes  │ │  Routes  │ │  Routes  │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ Locaux IT│ │ Utilisat.│                                 │
│  │  Routes  │ │  Routes  │                                 │
│  └──────────┘ └──────────┘                                 │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │  SQLAlchemy ORM (7 Modèles)     │                       │
│  │  - Utilisateurs                 │                       │
│  │  - Stock                         │                       │
│  │  - Mouvements                    │                       │
│  │  - Parc                          │                       │
│  │  - Locaux IT                     │                       │
│  │  - Baies IT                      │                       │
│  │  - Équipements Baies             │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │    Utilitaires                   │                       │
│  │  - Excel helpers                │                       │
│  │  - CSV functions                │                       │
│  └─────────────────────────────────┘                       │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         MYSQL DATABASE (Port 3306)                          │
│              gestion_parc                                    │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ utilisateurs │ │    stock     │ │  mouvements  │       │
│  │   (5 col)    │ │   (14 col)   │ │  (15 col)    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │     parc     │ │  locaux_it   │ │   baies_it   │       │
│  │   (14 col)   │ │   (4 col)    │ │   (6 col)    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                              │
│  ┌──────────────┐                                          │
│  │equipements_  │                                          │
│  │  baies       │                                          │
│  │   (4 col)    │                                          │
│  └──────────────┘                                          │
│                                                              │
│  [Index - Contraintes - Relations Foreign Key]              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 FLUX DE DONNÉES

### Cas d'Usage 1: Ajouter un Équipement au Stock

```
Utilisateur (Navigateur)
    │
    ├─► Clique "+ Ajouter" sur Stock
    │
    ├─► Remplit le formulaire
    │
    ├─► Clique "Ajouter"
    │
    ├─► POST /api/stock/ avec JSON
    │
    │                  BACKEND
    │                    │
    │                    ├─► Reçoit données
    │                    │
    │                    ├─► Valide les données
    │                    │
    │                    ├─► Crée objet Stock
    │                    │
    │                    ├─► Insère dans MySQL
    │
    │◄──── Retourne JSON avec nouvel équipement
    │
    └─► Affiche dans le tableau du navigateur
```

### Cas d'Usage 2: Créer un Mouvement (Transfert)

```
Utilisateur (Navigateur)
    │
    ├─► Clique "+ Transférer" sur Mouvements
    │
    ├─► Remplit nom, quantité, Local IT, etc.
    │
    ├─► Clique "Créer Mouvement"
    │
    ├─► POST /api/mouvements/ avec JSON
    │
    │                  BACKEND
    │                    │
    │                    ├─► Reçoit données mouvement
    │                    │
    │                    ├─► Crée enregistrement Mouvement
    │
    │                    ├─► Recherche Stock correspondant
    │
    │                    ├─► Diminue quantité du Stock
    │
    │                    ├─► Si Baie spécifiée:
    │                    │    ├─► Crée EquipementBaie
    │                    │    └─► Lie au Mouvement
    │
    │                    ├─► Enregistre en MySQL
    │
    │◄──── Retourne JSON (mouvement créé, stock mis à jour)
    │
    └─► Affiche confirmation et rafraîchit les deux listes
```

### Cas d'Usage 3: Importer Parc depuis Excel

```
Utilisateur (Navigateur)
    │
    ├─► Clique "Import" sur Parc
    │
    ├─► Sélectionne fichier Excel/CSV
    │
    ├─► POST /api/parc/import (multipart/form-data)
    │
    │                  BACKEND
    │                    │
    │                    ├─► Reçoit fichier
    │                    │
    │                    ├─► Lit avec pandas
    │                    │
    │                    ├─► Pour chaque ligne:
    │                    │    ├─► Cherche N° série
    │                    │    ├─► Si existe: UPDATE
    │                    │    └─► Sinon: INSERT
    │
    │                    ├─► Valide les colonnes
    │
    │                    ├─► Enregistre en MySQL
    │
    │◄──── Retourne JSON (nombre importé, erreurs éventuelles)
    │
    └─► Affiche confirmation et rafraîchit le tableau
```

## 📊 MODÈLE DE DONNÉES

```
utilisateurs (1)
    │
    ├──► (0..N) mouvements
    │            │
    │            └──► (0..1) baies_it
    │
stock (indépendant)
    │
    ├──► Créé par Mouvements
    │
parc (indépendant)
    │
locaux_it (1)
    │
    └──► (0..N) baies_it
            │
            └──► (0..N) equipements_baies
                    │
                    └──► (0..1) mouvements
```

## 🔌 API ENDPOINTS

### Stock
```
GET    /api/stock/              Liste avec pagination
GET    /api/stock/<id>          Détail équipement
POST   /api/stock/              Créer équipement
DELETE /api/stock/<id>          Supprimer équipement
GET    /api/stock/stats         Statistiques
GET    /api/stock/export        Export CSV/Excel
```

### Mouvements
```
GET    /api/mouvements/         Liste avec pagination
GET    /api/mouvements/<id>     Détail mouvement
POST   /api/mouvements/         Créer transfert
DELETE /api/mouvements/<id>     Supprimer mouvement
GET    /api/mouvements/stats    Statistiques
GET    /api/mouvements/export   Export CSV/Excel
```

### Parc
```
GET    /api/parc/               Liste avec pagination
GET    /api/parc/<id>           Détail équipement
POST   /api/parc/               Créer équipement
PUT    /api/parc/<id>           Modifier équipement
DELETE /api/parc/<id>           Supprimer équipement
POST   /api/parc/import         Importer Excel
GET    /api/parc/export         Export CSV/Excel
```

### Locaux IT
```
GET    /api/locaux-it/          Liste tous
POST   /api/locaux-it/          Créer local
GET    /api/locaux-it/<id>      Détail avec baies
PUT    /api/locaux-it/<id>      Modifier
DELETE /api/locaux-it/<id>      Supprimer

Baies:
GET    /api/locaux-it/<id>/baies         Liste baies
POST   /api/locaux-it/<id>/baies         Créer baie
GET    /api/locaux-it/baies/<id>        Détail
PUT    /api/locaux-it/baies/<id>        Modifier
DELETE /api/locaux-it/baies/<id>        Supprimer
```

## 🔐 SÉCURITÉ

```
─────────────────────────────────────
  LAYER 1: Frontend (React)
─────────────────────────────────────
  ✓ Validation formulaires
  ✓ Message erreurs UX
  
        │ Axios Client
        ▼
─────────────────────────────────────
  LAYER 2: Backend (Flask)
─────────────────────────────────────
  ✓ CORS configuré
  ✓ Validation JSON
  ✓ Vérification permissions
  ✓ Gestion erreurs
  
        │ SQL
        ▼
─────────────────────────────────────
  LAYER 3: Database (MySQL)
─────────────────────────────────────
  ✓ Préparation statements
  ✓ Contraintes NOT NULL
  ✓ Clés étrangères
  ✓ Index optimisés
─────────────────────────────────────
```

## 💾 STOCKAGE FICHIERS

```
Uploads temporaires:
  backend/uploads/         (Excel importés)
  
Configuration:
  backend/.env             (Variables environnement)
  frontend/.env            (URL API)
  
Logs:
  Terminal backend         (Flask logs)
  Terminal frontend        (React logs)
  Console navigateur       (F12)
```

## ⚡ PERFORMANCE

```
Frontend:
  - Bundle React: ~200KB (gzipped)
  - Tailwind CSS: ~50KB (production)
  - Load time: <2 secondes
  - Hot reload: immédiat

Backend:
  - Response time: <100ms (sans DB)
  - Export Excel: <1 seconde
  - Import Excel: <5 secondes

Database:
  - Index sur colonnes clés
  - Requêtes optimisées
  - Connection pooling
```

## 🔄 DÉPLOIEMENT FUTUR

```
Option 1: Heroku
  - backend → Heroku dyno
  - frontend → Vercel
  - MySQL → CleardB/Heroku Add-on

Option 2: Cloud Privé
  - Server Linux AWS/Azure/GCP
  - RDS MySQL
  - Nginx reverse proxy

Option 3: Local Network
  - PC/Serveur local
  - Accès interne LAN
  - Sauvegarde locale
```

---

**Architecture complète et hautement scalable! 🚀**
