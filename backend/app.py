from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
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
        create_default_users()
    
    return app

def create_default_users():
    """Create default users if they don't exist"""
    try:
        # Check if admin user exists
        admin = Utilisateur.query.filter_by(nom='admin').first()
        if not admin:
            admin = Utilisateur(
                nom='admin',
                email='admin@hutchinson.fr',
                password=generate_password_hash('Admin@2026'),
                role='admin',
                permission_export=True,
                permission_import=True,
                date_creation=datetime.utcnow()
            )
            db.session.add(admin)
            print("✓ Admin user created: admin / Admin@2026")

        # Check if anass user exists
        anass = Utilisateur.query.filter_by(nom='anass').first()
        if not anass:
            anass = Utilisateur(
                nom='anass',
                email='anass@hutchinson.fr',
                password=generate_password_hash('Anass@2026'),
                role='admin',
                permission_export=True,
                permission_import=True,
                date_creation=datetime.utcnow()
            )
            db.session.add(anass)
            print("✓ Admin user created: anass / Anass@2026")
        else:
            anass.role = 'admin'
            anass.permission_export = True
            anass.permission_import = True
            # Do not recompute or re-check the hash on startup; keep existing password.
            if not anass.password or ':' not in anass.password:
                anass.password = generate_password_hash('Anass@2026')

        db.session.commit()
    except Exception as e:
        print(f"Error creating default users: {e}")
        db.session.rollback()

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
