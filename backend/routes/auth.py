from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Utilisateur
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _get_current_user_id():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

# Login endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    nom = data.get('nom')
    password = data.get('password')

    if not nom or not password:
        return jsonify({'message': 'Nom d\'utilisateur et mot de passe requis'}), 400

    # Require existing users only
    user = Utilisateur.query.filter_by(nom=nom).first()
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    if not check_password_hash(user.password, password):
        return jsonify({'message': 'Mot de passe incorrect'}), 401

    access_token = create_access_token(identity=str(user.id))
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


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401

    user = Utilisateur.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    data = request.json or {}
    current_password = (data.get('current_password') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if not current_password or not new_password:
        return jsonify({'message': 'Mot de passe actuel et nouveau mot de passe requis'}), 400

    if len(new_password) < 8:
        return jsonify({'message': 'Le nouveau mot de passe doit contenir au moins 8 caractères'}), 400

    if not check_password_hash(user.password, current_password):
        return jsonify({'message': 'Mot de passe actuel incorrect'}), 401

    if check_password_hash(user.password, new_password):
        return jsonify({'message': 'Le nouveau mot de passe doit être différent de l\'ancien'}), 400

    try:
        user.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': 'Mot de passe modifié avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Register endpoint (only accessible by admin)
@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
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
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
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
