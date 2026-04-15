##  DÉMARRAGE application
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

### Ou via PhpMyAdmin
1. Aller sur localhost/phpmyadmin
2. Importer (Import tab)
3. Sélectionner schema.sql
4. Cliquer Go

## ACCÈS APPLICATION

Une fois démarrée:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MySQL**: localhost:3306 (gestion_parc)
### 1. backend/.env
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```