# 📸 GUIDE VISUEL - Pas à Pas (Screenshots)

## 🎯 Vue d'ensemble

```
Étape 1: Database ────→ Étape 2: Backend ────→ Étape 3: Frontend ────→ Étape 4: Navigateur
```

---

## 🌀 ÉTAPE 1: CREATE DATABASE

### Avant de commencer:
- MySQL doit être installé
- MySQL doit être running (Services.msc)

### Méthode 1: CMD (Le Plus Simple)

```
┌─────────────────────────────────────────────────────────────┐
│ EXÉCUTER → cmd                                              │
└─────────────────────────────────────────────────────────────┘

C:\Users\Ghita\Desktop\gs parc> 
cd database

C:\Users\Ghita\Desktop\gs parc\database> 
cd ..

C:\Users\Ghita\Desktop\gs parc> 
mysql -u root -p gestion_parc < database\schema.sql

Enter password: [votre password MySQL]

[Pas de message = Succès!]
```

### Vérifier l'import:

```powershell
mysql -u root -p
# (Entrer password)

mysql> USE gestion_parc;
mysql> SHOW TABLES;
```

Vous devez voir:
```
+--------------------+
| Tables_in_gestion_parc |
+--------------------+
| baies_it           |
| equipements_baies  |
| locaux_it          |
| mouvements         |
| parc               |
| stock              |
| utilisateurs       |
+--------------------+
```

---

## 🐍 ÉTAPE 2: BACKEND (Terminal 1)

### Copier-coller ces commandes:

```powershell
# 1. Ouvrir PowerShell
# (Clic droit → "Open PowerShell window here" dans C:\Users\Ghita\Desktop\gs parc)

# 2. Copier-coller:
cd 'C:\Users\Ghita\Desktop\gs parc\backend'

# 3. Créer environnement virtuel
python -m venv venv

# 4. Activer venv (attendez quelques secondes)
venv\Scripts\activate

# Vous devez voir (venv) au début:
# (venv) PS C:\Users\Ghita\Desktop\gs parc\backend>

# 5. Installer dépendances
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Attendez que ça finisse... (2-3 minutes)
```

### Éditer les credentials MySQL:

```powershell
# Ouvrir le fichier .env
notepad .env
```

**Contenu à mettre (exemple):**
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=monpassword
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

Sauvegarder (Ctrl+S) et fermer.

### Démarrer Flask:

```powershell
python app.py
```

**Vous devez voir (exactement):**
```
 * Serving Flask app 'app'
 * Debug mode: on
 * WARNING in app.run (This is a development server.
 * Running on http://127.0.0.1:5000
```

✅ **BACKEND OK!** → Ne pas fermer ce terminal!

---

## ⚛️ ÉTAPE 3: FRONTEND (Terminal 2)

### Ouvrir un NOUVEAU terminal PowerShell

```powershell
# NOUVEAU TERMINAL!
cd 'C:\Users\Ghita\Desktop\gs parc\frontend'

# Installer Node packages
npm install

# Attendre que ça finisse (2-3 minutes)
# Vous verrez: "added XX packages"

# Démarrer React
npm start
```

**Vous devez voir:**
```
Compiled successfully!

You can now view the app in your browser at:
  Local:            http://localhost:3000
```

✅ **FRONTEND OK!** Se ouvre automatiquement dans navigateur!

---

## 🌐 ÉTAPE 4: UTILISER L'APPLICATION

### Dans le Navigateur

```
URL: http://localhost:3000
```

Vous verrez une page de login.

### Connexion:

```
Email:    admin@hutchinson.com
Password: admin123

[Se connecter]
```

### Vous verrez le Dashboard:

```
┌──────────────────────────────────────┐
│ Sidebar                               │
│ ├─ • Dashboard        (Page d'accueil)│
│ ├─ • Stock            (Inventory)     │
│ ├─ • Mouvements       (Transfers)     │
│ ├─ • Parc             (Equipment List)│
│ └─ • Locaux IT        (Locations)     │
├──────────────────────────────────────┤
│                                       │
│   Bienvenue au Tableau de Bord!       │
│                                       │
│   ┌─────────┐ ┌─────────┐            │
│   │ Stock   │ │Mouvements            │
│   │  250    │ │   42     │            │
│   └─────────┘ └─────────┘            │
│                                       │
│   [Graphique des statistiques]        │
│                                       │
└──────────────────────────────────────┘
```

---

## ✅ TEST RAPIDE

### Tester le Stock:

1. Cliquer sur **"Stock"** dans la sidebar
2. Cliquer **"+ Ajouter"**
3. Remplir:
   ```
   Nom: Test Équipement
   Type Stock: Commun
   Type Équipement: Imprimante
   Quantité: 5
   ```
4. Cliquer **"Ajouter"**

Vous devez voir l'équipement dans le tableau! ✅

### Tester le Parc:

1. Cliquer sur **"Parc"**
2. Cliquer **"+ Ajouter"**
3. Remplir quelques infos
4. Cliquer **"Ajouter"**

C'est parti! 🎉

---

## 🎨 ÉLÉMENTS DE L'INTERFACE

```
Header
┌────────────────────────────────────┐
│ [≡] Gestion Parc IT                │
└────────────────────────────────────┘
         ↓
Sidebar                    Content
┌──────────┐           ┌──────────────────┐
│ Dashboard│           │  Dashboard Page  │
│ Stock    │           │                  │
│Mouvements│───────→   │ Contenu varié   │
│ Parc     │           │                  │
│ Locaux IT│           │                  │
└──────────┘           └──────────────────┘
```

---

## 📊 MODULE STOCK

### Page Stock:

```
┌─────────────────────────────────────────────┐
│ Stock Management                             │
├─────────────────────────────────────────────┤
│ [+ Ajouter] [⬇ Exporter]                    │
├─────────────────────────────────────────────┤
│ Rechercher... [Filter par Type]              │
├─────────────────────────────────────────────┤
│ ID │ Nom │ Type │ Équipement │ Qty │ Action│
├────┼─────┼──────┼────────────┼─────┼───────┤
│ 1  │ PC1 │ FSS  │ PC Fixe    │ 10  │ [🗑]  │
│ 2  │ ... │      │            │     │       │
└─────────────────────────────────────────────┘
```

---

## 📋 MODULE MOUVEMENTS

```
├─────────────────────────────────────────────┐
│ Mouvements Management                       │
├─────────────────────────────────────────────┤
│ [+ Créer] [⬇ Exporter]                     │
├─────────────────────────────────────────────┤
│ ID │ Date │ Stock │ Local │ Quantité │ 🗑   │
├────┼──────┼───────┼───────┼──────────┼──────┤
│ 1  │ 2026 │ PC1   │ CIM2  │ 5        │ [🗑]  │
│ 2  │ ...  │       │       │          │      │
└─────────────────────────────────────────────┘
```

---

## 📦 MODULE PARC

```
├─────────────────────────────────────────────┐
│ Parc Management                             │
├─────────────────────────────────────────────┤
│ [+ Ajouter] [📤 Import] [📥 Exporter]      │
├─────────────────────────────────────────────┤
│ Num Série │ Nom │ OS │ RAM │ Stockage │🗑  │
├───────────┼─────┼────┼─────┼──────────┼────┤
│ SN001     │ PC1 │ W11│ 8GB │ 256GB    │[🗑]│
│ ...       │     │    │     │          │    │
└─────────────────────────────────────────────┘
```

**Import Excel:**
1. Cliquer **"📤 Import"**
2. Sélectionner fichier Excel
3. Cliquer **"Importer"**

---

## 🏢 MODULE LOCAUX IT

```
├─────────────────────────────────────────────┐
│ Locaux IT Management                        │
├─────────────────────────────────────────────┤
│                                              │
│ ▼ CIM2 (5 équipements)                     │
│   Baies:                                    │
│   ├─ Baie 1: [+ Ajouter]                   │
│   └─ Baie 2: [+ Ajouter]                   │
│   [+ Ajouter Équipement] [🗑 Supprimer]    │
│                                              │
│ ▼ CIM6 (3 équipements)                     │
│   ...                                       │
└─────────────────────────────────────────────┘
```

---

## 💾 EXPORT DONNÉES

**Bouton depuis chaque page:**
```
[⬇ Exporter CSV] [⬇ Exporter Excel]
```

**Fichiers générés dans:**
```
C:\Users\Ghita\Desktop\gs parc\backend\downloads\
```

---

## 🔄 WORKFLOW TYPIQUE

```
1. AJOUTER AU STOCK
   Stock → [+ Ajouter] → Remplir → [Ajouter]
   
2. CRÉER UN MOUVEMENT
   Mouvements → [+ Créer] → Stock → Local → Quantité → [Créer]
   → Stock automatiquement mis à jour!
   
3. AJOUTER AU PARC
   Parc → [+ Ajouter] → N° Série → Infos → [Ajouter]
   
4. IMPORT FICHIER
   Parc → [📤 Import] → Sélectionner Excel → [Importer]
   
5. EXPORTER
   Chaque page → [⬇ Exporter CSV/Excel]
```

---

## 🎊 VOUS ÊTES PRÊT!

```
Terminal 1 (Backend): python app.py     ✅ En cours
Terminal 2 (Frontend): npm start         ✅ En cours
Navigateur: http://localhost:3000       ✅ Accès

Situation: 100% FONCTIONNEL
```

Félicitations! 🎉

---

**Besoin d'aide? Consulter TROUBLESHOOTING.md**
