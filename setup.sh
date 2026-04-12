#!/bin/bash

# Configuration automatique du projet

echo "=== Installation Gestion Parc Informatique ==="

# Backend
echo -e "\n[1/4] Configuration du Backend..."
cd backend

# Vérifier Python
if ! command -v python &> /dev/null
then
    echo "Python n'est pas installé. Veuillez installer Python 3.8+"
    exit 1
fi

# Créer environnement virtuel
python -m venv venv

# Activer l'environnement
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Fichier .env créé. Veuillez le personnaliser avec vos paramètres MySQL."
fi

cd ..

# Frontend
echo -e "\n[2/4] Configuration du Frontend..."
cd frontend

# Vérifier Node.js
if ! command -v npm &> /dev/null
then
    echo "Node.js/npm n'est pas installé. Veuillez installer Node.js 14+"
    exit 1
fi

# Installer les dépendances
npm install

cd ..

# Base de données
echo -e "\n[3/4] Configuration de la Base de Données..."
echo "Créer la base de données 'gestion_parc' avec:"
echo "mysql -u root -p < database/schema.sql"

echo -e "\n[4/4] ✓ Installation complète!"
echo -e "\nPour démarrer l'application:"
echo "  Terminal 1 - Backend:"
echo "    cd backend && source venv/bin/activate && python app.py"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd frontend && npm start"
