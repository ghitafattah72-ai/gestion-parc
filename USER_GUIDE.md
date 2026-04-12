# Guide d'Utilisation de l'Application

## 🎯 Navigation Principale

L'application dispose d'une barre latérale avec 5 modules principaux:
1. **Tableau de Bord** - Vue d'ensemble
2. **Stock** - Gestion de l'inventaire
3. **Mouvements** - Transferts d'équipements
4. **Parc** - Équipements utilisateurs
5. **Locaux IT** - Gestion des locaux et baies

## 📦 Module Stock

### Affichage
- Voir tous les équipements du stock
- Filtrer par type de stock (FSS, IMS, C2S, Commun)
- Rechercher par nom

### Ajouter un Équipement
1. Cliquer sur **+ Ajouter**
2. Remplir les informations obligatoires:
   - Nom équipement
   - Type équipement (liste déroulante)
   - Quantité
   - Type Stock

3. **Important**: Si le type est "pc portable" ou "pc fixe", des champs supplémentaires apparaissent:
   - RAM
   - Stockage
   - Processeur
   - N° de série
   - Activité
   - Système
   - Accessoires

4. Cliquer sur **Ajouter**

### Supprimer un Équipement
- Cliquer sur l'icône poubelle
- Confirmer la suppression

### Exporter
- **CSV**: Format texte (Excel compatible)
- **Excel**: Format .xlsx

## 🔄 Module Mouvements

### C'est quoi?
Transférer des équipements du stock vers un Local IT (ex: CIM6)

### Créer un Mouvement
1. Cliquer sur **+ Transférer**
2. Remplir les informations:
   - Nom équipement (doit être dans le stock)
   - Type équipement
   - Quantité à transférer
   - Type Stock
   - **Local IT Destination** (obligatoire): CIM2, CIM6, CIM7, etc.
   - Baie Destination (optionnel): Si le local a des baies

3. **Note**: Si PC/Portable, les détails peuvent être remplis
4. Cliquer sur **Créer Mouvement**
5. **Résultat**: 
   - Mouvement créé dans l'historique
   - Quantité automatiquement réduite dans le stock

### Affichage
- Voir l'historique de tous les transferts
- Voir la date du mouvement
- Local IT et Baie destination

### Exporter
- Voir les mouvements en CSV ou Excel

## 💻 Module Parc

### C'est quoi?
Inventaire des équipements utilisateurs (PC, périphériques, etc.)

### Ajouter un Équipement
1. Cliquer sur **+ Ajouter**
2. Remplir le formulaire avec:
   - Name
   - Alternate username (utilisateur)
   - OS Name (Windows, Linux, etc.)
   - OS Version
   - Type
   - Model
   - Manufacturer
   - N° de série (UNIQUE)
   - Processeur
   - RAM
   - Disque dur
   - Emplacement (bureau, etc.)
   - Service (département)
   - ESU (optionnel)

3. Cliquer sur **Enregistrer**

### Modifier un Équipement
1. Cliquer sur l'icône **✏️** (Edit)
2. Modifier les informations
3. Cliquer sur **Enregistrer**

### Importer depuis Excel
1. Préparer un fichier Excel avec les colonnes:
   - Name
   - Alternate username
   - Operating System - Name
   - Operating System - Version
   - Type
   - Model
   - Manufacturer
   - N° de série
   - Processeur
   - RAM
   - Disque dur
   - Emplacement
   - Service
   - ESU

2. Cliquer sur **Import**
3. Sélectionner le fichier (.xlsx, .xls ou .csv)
4. **Résultat**: Les équipements sont importés ou mis à jour

### Exporter
- Exporter la liste complète en CSV ou Excel

## 🏢 Module Locaux IT

### Affichage
Les 5 locaux IT par défaut:
- CIM2
- CIM6
- CIM7
- CIM4H1
- CIM4H2

Chaque local peut être expandu (cliquer dessus) pour voir:
- Les baies IT existantes
- Ajouter une baie
- Ajouter du matériel au local

### Ajouter un Local IT
1. Cliquer sur **+ Ajouter Local IT**
2. Remplir:
   - Nom du local (unique)
   - Localisation
   - Description

3. Cliquer sur **Ajouter**

### Ajouter une Baie
1. Développer (cliquer sur) le local
2. Cliquer sur **+ Baie**
3. Remplir:
   - Nom de la baie
   - Numéro
   - Description

4. Cliquer sur **Ajouter**

### Ajouter du Matériel au Local
1. Développer le local
2. Cliquer sur **+ Équipement**
3. Remplir:
   - Nom équipement
   - Type équipement
   - Quantité
   - Type Stock (FSS, IMS, C2S, Commun)

4. Cliquer sur **Ajouter**
5. **Résultat**: Un mouvement est créé et le matériel est transféré du stock

## 📊 Tableau de Bord

Affiche:
- **Nombre de Stocks**: Total des types de stock
- **Mouvements Actifs**: Nombre de transferts
- **Locaux IT**: Nombre de locaux configurés
- **Graphique**: Quantités par type de stock

## 🔍 Recherche et Filtrage

Chaque module dispose de:
- **Barre de recherche**: Pour chercher un équipement
- **Filtres**: Pour filtrer par type ou catégorie

## 💾 Types d'Équipements

L'application reconnait ces types:
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

**Important**: Pour "pc portable" et "pc fixe", des champs supplémentaires (RAM, Processeur, etc.) sont affichés.

## 📤 Exportation et Importation

### Export
- Disponible dans: Stock, Mouvements, Parc
- Formats: CSV ou Excel
- **Permet**: Sauvegarder les données, analyser ailleurs

### Import
- Disponible dans: Parc
- Formats: Excel (.xlsx, .xls) ou CSV
- **Permet**: Charger des données en masse

## 🔐 Permissions

- **Export**: Peut exporter les données
- **Import**: Peut importer des données
- **Admin**: Accès complet

## ⚠️ Points Important

1. **Stock**: La modification est supprimée, ajout/suppression seulement
2. **Stock + Mouvements**: Quand on crée un mouvement, le stock diminue automatiquement
3. **Parc**: Permet de remplir manuellement comme un fichier Excel
4. **Locaux IT**: Chaque local peut avoir plusieurs baies, chaque baie peut contenir du matériel
5. **Tous les exports**: Disponibles pour tous les modules excepté Stock qui n'a pas d'import
