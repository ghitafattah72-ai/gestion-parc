# ⚡ COMMANDES RAPIDES - Démarrer l'Application

## 🚀 DÉMARRAGE WINDOWS (le plus simple)

### Option 1: Double-clic sur setup.bat
```
1. Accédez à: C:\Users\Ghita\Desktop\gs parc\
2. Double-clic sur: setup.bat
3. Suivez les instructions à l'écran
```

### Option 2: Commandes Manuelles

#### Terminal 1 - Backend
```bash
cd C:\Users\Ghita\Desktop\gs parc\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Créer/éditer .env avec vos paramètres MySQL
python app.py
```

#### Terminal 2 - Frontend
```bash
cd C:\Users\Ghita\Desktop\gs parc\frontend
npm install
npm start
```

## 💻 DÉMARRAGE LINUX/MAC

### Script Automatique
```bash
cd /chemin/vers/gs\ parc
chmod +x setup.sh
./setup.sh
```

### Manuellement

#### Terminal 1 - Backend
```bash
cd /chemin/vers/gs\ parc/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

#### Terminal 2 - Frontend
```bash
cd /chemin/vers/gs\ parc/frontend
npm install
npm start
```

## 🗄️ BASE DE DONNÉES (UNE SEULE FOIS)

### Importer le Schéma
```bash
# Windows
mysql -u root -p < C:\Users\Ghita\Desktop\gs parc\database\schema.sql

# Linux/Mac
mysql -u root -p < /chemin/vers/gs\ parc/database/schema.sql
```

### Ou via MySQL Workbench
1. Ouvrir MySQL Workbench
2. Fichier → Ouvrir Script SQL
3. Sélectionner: database/schema.sql
4. Exécuter (Ctrl+Shift+Enter)

### Ou via PhpMyAdmin
1. Aller sur localhost/phpmyadmin
2. Importer (Import tab)
3. Sélectionner schema.sql
4. Cliquer Go

## 🌐 ACCÈS APPLICATION

Une fois démarrée:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MySQL**: localhost:3306 (gestion_parc)

## 🔑 CONNEXION

**Premier accès** (utilisateur admin créé):
- Email: admin@hutchinson.com
- Password: admin123

## 📝 FICHIERS À CRÉER

Avant de démarrer, créer 2 fichiers:

### 1. backend/.env
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

### 2. frontend/.env
```
REACT_APP_API_URL=http://localhost:5000/api
```

## ✅ VÉRIFIER L'INSTALLATION

### Backend démarré?
- Vous devez voir: "Running on http://127.0.0.1:5000"
- Essayez: http://localhost:5000/api/stock (doit retourner JSON)

### Frontend démarré?
- Vous devez voir: "webpack compiled"
- Page doit s'ouvrir automatiquement sur http://localhost:3000

### MySQL connecté?
- Backend démarre sans erreur
- Vous pouvez accéder à gestion_parc depuis MySQL

## 🛠️ PORTS (Si déjà utilisés)

### Changer port Frontend (3000 → autre)
```bash
npm start -- --port 3001
```

### Changer port Backend (5000 → autre)
Éditer `backend/app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Changer port MySQL
Éditer `backend/.env`:
```
MYSQL_PORT=3307
```

## 🐛 DÉPANNAGE RAPIDE

### Erreur: "MySQL access denied"
→ Vérifier `.env` (user, password, port)
→ MySQL est-il en cours d'exécution?

### Erreur: "Port already in use"
→ Changer le port ou kill le processus
→ Ouvrir Task Manager (Windows) ou top (Linux)

### Erreur: "Module not found"
Backend:
```bash
pip install -r requirements.txt --upgrade
```

Frontend:
```bash
npm install
```

### L'application ne charge pas
→ Attendre 30 secondes
→ Actualiser la page (Ctrl+R)
→ Ouvrir la console (F12) pour voir les erreurs

## 📖 DOCUMENTATION

| Document | Temps |
|----------|-------|
| START.md | 5 min |
| INSTALLATION.md | 20 min |
| USER_GUIDE.md | 15 min |
| PROJECT_SUMMARY.md | 10 min |

**Total pour maîtriser: <1 heure**

## 🎯 ÉTAPES RÉSUMÉES

1. **Créer BD**: mysql < schema.sql
2. **Créer .env**: (2 fichiers)
3. **Backend**: python app.py
4. **Frontend**: npm start
5. **Accès**: http://localhost:3000
6. **Login**: admin@hutchinson.com / admin123

## 📱 TEST RAPIDE

Une fois l'appli en cours:
1. Aller à "Stock"
2. Cliquer "+ Ajouter"
3. Remplir les infos
4. Cliquer "Ajouter"
5. Vérifier que l'équipement apparaît

## 💡 ASTUCES

- Frontend hot reload automatique
- Backend redémarre si vous changez le code
- Ouvrir deux terminaux (un pour chaque)
- Ne pas fermer les terminaux = app active
- Ctrl+C pour arrêter

## 🎉 C'EST PARTI!

```
Configuration MySQL ✅
Backend démarré ✅
Frontend démarré ✅
Application accessible ✅
Prêt à utiliser! 🚀
```

---

## 📞 BESOIN D'AIDE?

1. Consulter **INSTALLATION.md** (dépannage)
2. Vérifier les **logs des terminaux**
3. Vérifier les fichiers **.env**
4. Redémarrer les services

---

**Bonne utilisation! L'application est prête! 🎊**
