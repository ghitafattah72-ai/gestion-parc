# Guide d'Installation Complète

## 📋 Prérequis

- Python 3.8+
- Node.js 14+
- MySQL 5.7+
- Git (optionnel)

## 🔧 Étapes d'Installation

### 1️⃣ Installation de MySQL et Création de la Base de Données

```bash
# Accéder à MySQL
mysql -u root -p

# Exécuter le script de création
mysql -u root -p < C:\Users\Ghita\Desktop\gs parc\database\schema.sql
```

Ou copier-coller le contenu de `schema.sql` dans MySQL Workbench.

### 2️⃣ Configuration du Backend

```bash
# Naviguer vers le dossier backend
cd C:\Users\Ghita\Desktop\gs parc\backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer un fichier .env
# Copier .env.example en .env
copy .env.example .env

# Éditer .env avec vos paramètres MySQL
notepad .env
```

**Contenu du fichier .env**:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

### 3️⃣ Démarrage du Backend

```bash
# Depuis le dossier backend avec l'environnement activé
python app.py
```

Le serveur démarre sur `http://localhost:5000`

### 4️⃣ Configuration du Frontend

```bash
# Naviguer vers le dossier frontend
cd C:\Users\Ghita\Desktop\gs parc\frontend

# Installer les dépendances
npm install
```

### 5️⃣ Démarrage du Frontend

```bash
# Depuis le dossier frontend
npm start
```

L'application démarre sur `http://localhost:3000`

## ✅ Vérification

- Ouvrir `http://localhost:3000` dans le navigateur
- Vérifier que la navigation fonctionne
- Tester chaque module (Stock, Mouvements, Parc, Locaux IT)

## 📦 Premier Test

1. **Tableau de Bord**: Affiche les statistiques
2. **Ajouter un équipement**: Stock → Ajouter
3. **Créer un mouvement**: Mouvements → Transférer
4. **Importer le parc**: Parc → Import Excel

## 🔒 Utilisateur par Défaut

- **Email**: admin@hutchinson.com
- **Password**: admin123
- **Role**: admin
- **Permissions**: Export/Import activées

## 📊 Export de Données

Tous les modules supportent l'export en:
- CSV (compatible avec Excel)
- XLSX (Excel moderne)

## 🐛 Résolution de Problèmes

### Port 3000 déjà utilisé
```bash
npm start -- --port 3001
```

### Port 5000 déjà utilisé
Modifier dans `backend/app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Erreur de connexion MySQL
- Vérifier que MySQL est en cours d'exécution
- Vérifier les identifiants dans `.env`
- Créer manuellement la base de données et les tables

### Modules manquants Python
```bash
pip install --upgrade -r requirements.txt
```

## 📚 Ressources Additionnelles

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
