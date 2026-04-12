"""
Decorators for common backend functionality
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur


def check_permission(permission_name):
    """
    Decorator to check user permissions
    Usage: @check_permission('export') or @check_permission('import')
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            current_user = Utilisateur.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'message': 'Utilisateur non trouvé'}), 404
            
            # Check specific permission
            if permission_name == 'export':
                has_permission = current_user.permission_export
            elif permission_name == 'import':
                has_permission = current_user.permission_import
            else:
                has_permission = True
            
            if not has_permission:
                permission_msg = f'Vous n\'avez pas la permission d\'{"exporter" if permission_name == "export" else "importer"} des données'
                return jsonify({'message': permission_msg}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_auth(fn):
    """
    Simple decorator to require JWT authentication
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper
