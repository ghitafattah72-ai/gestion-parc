from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Utilisateur
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Login endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    nom = data.get('nom')
    password = data.get('password')

    if not nom or not password:
        return jsonify({'message': 'Nom d\'utilisateur et mot de passe requis'}), 400

    # Special admin user: Anass peut tout faire
    if nom.lower() == 'anass' and password == 'Anass@2026':
        user = Utilisateur.query.filter_by(nom='anass').first()
        if not user:
            user = Utilisateur(
                nom='anass',
                email='anass@hutchinson.fr',
                password=generate_password_hash('Anass@2026'),
                role='admin',
                permission_export=True,
                permission_import=True,
                date_creation=datetime.utcnow()
            )
            db.session.add(user)
        else:
            # Ensure existing anass remains admin and has the correct password
            user.role = 'admin'
            user.permission_export = True
            user.permission_import = True
            if not check_password_hash(user.password, password):
                user.password = generate_password_hash(password)

        db.session.commit()
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'nom': user.nom,
                'email': user.email,
                'role': user.role,
                'permission_export': user.permission_export,
                'permission_import': user.permission_import
            }
        }), 200

    # Tous les autres utilisateurs peuvent se connecter en mode lecture seule
    user = Utilisateur.query.filter_by(nom=nom).first()
    if not user:
        user = Utilisateur(
            nom=nom,
            email=f'{nom}@guest.local',
            password=generate_password_hash(password),
            role='view_only',
            permission_export=False,
            permission_import=False,
            date_creation=datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
    elif not check_password_hash(user.password, password):
        return jsonify({'message': 'Mot de passe incorrect'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'token': access_token,
        'user': {
            'id': user.id,
            'nom': user.nom,
            'email': user.email,
            'role': user.role,
            'permission_export': user.permission_export,
            'permission_import': user.permission_import
        }
    }), 200

# Register endpoint (only accessible by admin)
@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    current_user_id = get_jwt_identity()
    current_user = Utilisateur.query.get(current_user_id)

    # Only admins can create users
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    data = request.json
    nom = data.get('nom')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not nom or not email or not password:
        return jsonify({'message': 'Tous les champs sont requis'}), 400

    # Check if user already exists
    if Utilisateur.query.filter_by(nom=nom).first():
        return jsonify({'message': 'Cet utilisateur existe déjà'}), 400

    if Utilisateur.query.filter_by(email=email).first():
        return jsonify({'message': 'Cet email est déjà utilisé'}), 400

    try:
        new_user = Utilisateur(
            nom=nom,
            email=email,
            password=generate_password_hash(password),
            role=role,
            date_creation=datetime.utcnow()
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'Utilisateur créé avec succès',
            'user': {
                'id': new_user.id,
                'nom': new_user.nom,
                'email': new_user.email,
                'role': new_user.role
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Get current user info
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = Utilisateur.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    return jsonify({
        'id': user.id,
        'nom': user.nom,
        'email': user.email,
        'role': user.role,
        'permission_export': user.permission_export,
        'permission_import': user.permission_import
    }), 200
