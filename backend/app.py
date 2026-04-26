from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from config import Config
from models import db, Utilisateur
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Add JWT configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt = JWTManager(app)

    # Register blueprints
    from routes.stock import stock_bp
    from routes.mouvements import mouvements_bp
    from routes.parc import parc_bp
    from routes.locaux_it import locaux_it_bp
    from routes.utilisateurs import utilisateurs_bp
    from routes.auth import auth_bp
    
    app.register_blueprint(stock_bp)
    app.register_blueprint(mouvements_bp)
    app.register_blueprint(parc_bp)
    app.register_blueprint(locaux_it_bp)
    app.register_blueprint(utilisateurs_bp)
    app.register_blueprint(auth_bp)
    
    # Create tables and default users
    with app.app_context():
        db.create_all()
        ensure_utilisateur_schema()
        ensure_parc_version_column()
        ensure_stock_extended_columns()
        ensure_materiel_it_extended_columns()
        create_default_users()
    
    return app

def create_default_users():
    """Create default users if they don't exist"""
    try:
        admin = Utilisateur.query.filter_by(nom='admin').first()
        legacy_anass = Utilisateur.query.filter_by(nom='anass').first()

        # Migrate legacy anass account to admin if admin is missing.
        if not admin and legacy_anass:
            legacy_anass.nom = 'admin'
            legacy_anass.role = 'admin'
            legacy_anass.permission_export = True
            legacy_anass.permission_import = True
            admin = legacy_anass

        # Create admin account if still missing.
        if not admin:
            admin = Utilisateur(
                nom='admin',
                password=generate_password_hash('Admin@hutchinson'),
                role='admin',
                permission_export=True,
                permission_import=True,
                date_creation=datetime.utcnow()
            )
            db.session.add(admin)

        # If both exist, remove legacy anass so it no longer appears/works.
        if legacy_anass and admin and legacy_anass.id != admin.id:
            db.session.delete(legacy_anass)

        # Keep admin privileges and migrate old defaults to new default password once.
        admin.role = 'admin'
        admin.nom = 'admin'
        admin.permission_export = True
        admin.permission_import = True
        if (not admin.password or ':' not in admin.password
                or check_password_hash(admin.password, 'Admin@2026')
                or check_password_hash(admin.password, 'Anass@2026')):
            admin.password = generate_password_hash('Admin@hutchinson')

        # Ensure a default visitor account exists for read-only access with export only.
        visiteur = Utilisateur.query.filter_by(nom='visiteur').first()
        if not visiteur:
            visiteur = Utilisateur(
                nom='visiteur',
                password=generate_password_hash('visiteur@hutchinson'),
                role='view_only',
                permission_export=True,
                permission_import=False,
                date_creation=datetime.utcnow()
            )
            db.session.add(visiteur)
        else:
            visiteur.nom = 'visiteur'
            visiteur.role = 'view_only'
            visiteur.permission_export = True
            visiteur.permission_import = False
            if not visiteur.password or ':' not in visiteur.password:
                visiteur.password = generate_password_hash('visiteur@hutchinson')

        print("✓ Admin user ready: admin / Admin@hutchinson")
        print("✓ Visiteur user ready: visiteur / visiteur@hutchinson")

        db.session.commit()
    except Exception as e:
        print(f"Error creating default users: {e}")
        db.session.rollback()


def ensure_utilisateur_schema():
    try:
        inspector = inspect(db.engine)
        if 'utilisateurs' not in inspector.get_table_names():
            return

        columns = {column['name'] for column in inspector.get_columns('utilisateurs')}
        if 'email' in columns:
            db.session.execute(text('ALTER TABLE utilisateurs DROP COLUMN email'))
            db.session.commit()
            print('✓ Colonne utilisateurs.email supprimée')
    except Exception as e:
        db.session.rollback()
        print(f"Error ensuring utilisateurs schema: {e}")


def ensure_parc_version_column():
    try:
        inspector = inspect(db.engine)
        if 'parc' not in inspector.get_table_names():
            return

        columns = {column['name'] for column in inspector.get_columns('parc')}
        
        # Add version if missing
        if 'version' not in columns:
            db.session.execute(text('ALTER TABLE parc ADD COLUMN version VARCHAR(100)'))
            print('✓ Colonne parc.version ajoutée')
        
        # Rename esu to activite and add quantite if needed
        if 'esu' in columns and 'activite' not in columns:
            db.session.execute(text('ALTER TABLE parc RENAME COLUMN esu TO activite'))
            print('✓ Colonne parc.esu renommée en activite')
        
        if 'activite' not in columns:
            db.session.execute(text('ALTER TABLE parc ADD COLUMN activite VARCHAR(50)'))
            print('✓ Colonne parc.activite ajoutée')
        
        if 'quantite' not in columns:
            db.session.execute(text('ALTER TABLE parc ADD COLUMN quantite INTEGER DEFAULT 0'))
            print('✓ Colonne parc.quantite ajoutée')
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error ensuring parc columns: {e}")


def ensure_stock_extended_columns():
    try:
        inspector = inspect(db.engine)
        if 'stock' not in inspector.get_table_names():
            return

        existing = {col['name'] for col in inspector.get_columns('stock')}
        new_cols = {
            'alternate_username': 'VARCHAR(255)',
            'os_version': 'VARCHAR(100)',
            'manufacturer': 'VARCHAR(100)',
            'disque_dur': 'VARCHAR(100)',
            'emplacement': 'VARCHAR(100)',
            'service': 'VARCHAR(100)',
        }
        for col, col_type in new_cols.items():
            if col not in existing:
                db.session.execute(text(f'ALTER TABLE stock ADD COLUMN {col} {col_type}'))
                print(f'✓ Colonne stock.{col} ajoutée')
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error ensuring stock extended columns: {e}")


def ensure_materiel_it_extended_columns():
    try:
        inspector = inspect(db.engine)
        if 'materiel_it' not in inspector.get_table_names():
            return

        existing = {col['name'] for col in inspector.get_columns('materiel_it')}
        new_cols = {
            'uc': 'VARCHAR(100)',
            'marque': 'VARCHAR(255)',
            'processeur': 'VARCHAR(255)',
            'ram': 'VARCHAR(100)',
            'stockage': 'VARCHAR(100)',
            'mac_wifi': 'VARCHAR(100)',
            'user_assigned': 'VARCHAR(255)',
            'id_user': 'VARCHAR(100)',
            'etat_materiel': 'VARCHAR(100)',
            'date_affectation': 'DATETIME',
            'baie_port': 'VARCHAR(100)',
            'mac_address': 'VARCHAR(100)',
            'douchette': 'VARCHAR(100)',
            'lecteur_badge': 'VARCHAR(100)',
            'autre_materiel': 'TEXT',
        }
        for col, col_type in new_cols.items():
            if col not in existing:
                db.session.execute(text(f'ALTER TABLE materiel_it ADD COLUMN {col} {col_type}'))
                print(f'✓ Colonne materiel_it.{col} ajoutée')
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error ensuring materiel_it extended columns: {e}")
                  
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
