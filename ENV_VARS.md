# Configuration des Variables d'Environnement

## Backend (.env)

Créez un fichier `backend/.env` avec:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DB=gestion_parc
MYSQL_PORT=3306
FLASK_ENV=development
FLASK_DEBUG=True
```

## Frontend (.env)

Créez un fichier `frontend/.env` avec:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Variables Importantes

| Variable | Description | Défaut |
|----------|------------|--------|
| MYSQL_HOST | Hôte MySQL | localhost |
| MYSQL_USER | Utilisateur MySQL | root |
| MYSQL_PASSWORD | Mot de passe MySQL | (vide) |
| MYSQL_DB | Nom base données | gestion_parc |
| MYSQL_PORT | Port MySQL | 3306 |
| FLASK_ENV | Environnement Flask | development |
| FLASK_DEBUG | Mode debug Flask | True |
| REACT_APP_API_URL | URL de l'API | http://localhost:5000/api |

## Notes

- Les fichiers `.env` ne doivent **jamais** être commités sur Git
- Ils sont dans `.gitignore`
- Chaque développeur doit avoir sa propre copie
- Utiliser `.env.example` comme modèle
