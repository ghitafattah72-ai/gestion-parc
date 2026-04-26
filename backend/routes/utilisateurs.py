from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Utilisateur
from werkzeug.security import generate_password_hash
from datetime import datetime

utilisateurs_bp = Blueprint('utilisateurs', __name__, url_prefix='/api/utilisateurs')


def _get_current_user_id():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

# GET all users (admin only)
@utilisateurs_bp.route('/', methods=['GET'])
@jwt_required()
def get_utilisateurs():
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    current_user = Utilisateur.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    items = Utilisateur.query.all()
    return jsonify([user_to_dict(item) for item in items])

# GET single user
@utilisateurs_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_utilisateur(id):
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    user = Utilisateur.query.get_or_404(id)

    # Users can only view their own profile, admins can view anyone
    if current_user_id != id:
        current_user = Utilisateur.query.get(current_user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Accès refusé'}), 403

    return jsonify(user_to_dict(user))

# POST new user (admin only)
@utilisateurs_bp.route('/', methods=['POST'])
@jwt_required()
def create_utilisateur():
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    current_user = Utilisateur.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    data = request.json
    
    try:
        # Hash password if provided
        password = data.get('password')
        nom = (data.get('nom') or '').strip()
        if not nom or not password:
            return jsonify({'message': 'Nom d\'utilisateur et mot de passe sont requis'}), 400

        if Utilisateur.query.filter_by(nom=nom).first():
            return jsonify({'message': 'Cet utilisateur existe déjà'}), 400

        new_user = Utilisateur(
            nom=nom,
            password=generate_password_hash(password),
            role=data.get('role', 'user'),
            permission_export=data.get('permission_export', False),
            permission_import=data.get('permission_import', False),
            date_creation=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Utilisateur créé avec succès',
            'user': user_to_dict(new_user)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la création de l'utilisateur : {str(e)}"}), 400

# PUT update user (admin only)
@utilisateurs_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_utilisateur(id):
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    current_user = Utilisateur.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    item = Utilisateur.query.get_or_404(id)
    data = request.json
    
    try:
        if 'nom' in data:
            item.nom = (data['nom'] or '').strip()
        if 'password' in data and data['password']:
            item.password = generate_password_hash(data['password'])
        if 'role' in data:
            item.role = data['role']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Utilisateur mis à jour',
            'user': user_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la mise à jour de l'utilisateur : {str(e)}"}), 400

# DELETE user (admin only)
@utilisateurs_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_utilisateur(id):
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    current_user = Utilisateur.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    # Prevent deleting yourself
    if current_user_id == id:
        return jsonify({'message': 'Vous ne pouvez pas vous supprimer vous-même'}), 400

    item = Utilisateur.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Utilisateur supprimé'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression de l'utilisateur : {str(e)}"}), 400

# PUT update user permissions
@utilisateurs_bp.route('/<int:id>/permissions', methods=['PUT'])
@jwt_required()
def update_permissions(id):
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401
    current_user = Utilisateur.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    item = Utilisateur.query.get_or_404(id)
    data = request.json
    
    try:
        item.permission_export = data.get('permission_export', item.permission_export)
        item.permission_import = data.get('permission_import', item.permission_import)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Permissions mises à jour',
            'user': user_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la mise à jour des permissions : {str(e)}"}), 400


@utilisateurs_bp.route('/<int:id>/reset-password', methods=['PUT'])
@jwt_required()
def reset_utilisateur_password(id):
    current_user_id = _get_current_user_id()
    if current_user_id is None:
        return jsonify({'message': 'Token invalide'}), 401

    current_user = Utilisateur.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403

    item = Utilisateur.query.get_or_404(id)
    data = request.json or {}
    new_password = (data.get('new_password') or '').strip()

    if not new_password:
        return jsonify({'message': 'Nouveau mot de passe requis'}), 400

    if len(new_password) < 8:
        return jsonify({'message': 'Le nouveau mot de passe doit contenir au moins 8 caractères'}), 400

    try:
        item.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': f"Mot de passe de {item.nom} modifié avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la réinitialisation du mot de passe : {str(e)}"}), 400

def user_to_dict(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'role': item.role,
        'permission_export': item.permission_export,
        'permission_import': item.permission_import,
        'date_creation': item.date_creation.isoformat()
    }
