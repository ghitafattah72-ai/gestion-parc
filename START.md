# Application de Gestion du Parc Informatique - Hutchinson

Application web complète pour la gestion centralisée du parc informatique incluant:
- Gestion du stock
- Suivi des mouvements d'équipements
- Gestion du parc utilisateurs
- Gestion des locaux IT et baies
- Import/Export Excel

## 🚀 Démarrage Rapide

### 1. Créer la base de données
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env
# Éditer .env avec vos infos MySQL
python app.py
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

Accéder à `http://localhost:3000`

## 📖 Documentation

- [README.md](README.md) - Aperçu complet
- [INSTALLATION.md](INSTALLATION.md) - Guide d'installation détaillé
- [USER_GUIDE.md](USER_GUIDE.md) - Guide d'utilisation

## 🔗 Architecture

```
Frontend (React + Tailwind) ←→ Backend (Flask) ←→ MySQL
   Port 3000                     Port 5000        gestion_parc
```

## 📊 Modules Principaux

1. **Stock** - Inventaire avec export
2. **Mouvements** - Transferts avec suivi automatique
3. **Parc** - Équipements utilisateurs avec import/export
4. **Locaux IT** - Gestion des locaux et baies

## 🔑 Utilisateur par Défaut

- Email: admin@hutchinson.com
- Password: admin123

---

Développé pour Hutchinson - Gestion centralisée du parc informatique (2026)
