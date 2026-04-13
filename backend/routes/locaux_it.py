from flask import Blueprint, jsonify, request
from models import db, LocalIT, BaieIT
from datetime import datetime

locaux_it_bp = Blueprint('locaux_it', __name__, url_prefix='/api/locaux-it')

# GET all locaux IT
@locaux_it_bp.route('/', methods=['GET'])
def get_locaux_it():
    items = LocalIT.query.all()
    return jsonify([local_to_dict_with_baies(item) for item in items])

# GET single local IT with baies
@locaux_it_bp.route('/<int:id>', methods=['GET'])
def get_local_it(id):
    item = LocalIT.query.get_or_404(id)
    return jsonify(local_to_dict_with_baies(item))

# POST new local IT
@locaux_it_bp.route('/', methods=['POST'])
def create_local_it():
    data = request.json
    
    try:
        new_item = LocalIT(
            nom=data.get('nom'),
            description=data.get('description'),
            localisation=data.get('localisation')
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Local IT created successfully',
            'local': local_to_dict(new_item)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# PUT update local IT
@locaux_it_bp.route('/<int:id>', methods=['PUT'])
def update_local_it(id):
    item = LocalIT.query.get_or_404(id)
    data = request.json
    
    try:
        item.nom = data.get('nom', item.nom)
        item.description = data.get('description', item.description)
        item.localisation = data.get('localisation', item.localisation)
        item.date_modification = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Local IT updated successfully',
            'local': local_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE local IT
@locaux_it_bp.route('/<int:id>', methods=['DELETE'])
def delete_local_it(id):
    item = LocalIT.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Local IT deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# GET default locaux IT
@locaux_it_bp.route('/default/init', methods=['POST'])
def init_default_locaux():
    try:
        default_locaux = [
            {'nom': 'CIM2', 'description': 'Local informatique CIM2', 'localisation': 'bâtiment'},
            {'nom': 'CIM6', 'description': 'Local informatique CIM6', 'localisation': 'bâtiment'},
            {'nom': 'CIM7', 'description': 'Local informatique CIM7', 'localisation': 'bâtiment'},
            {'nom': 'CIM4H1', 'description': 'Local informatique CIM4H1', 'localisation': 'bâtiment'},
            {'nom': 'CIM4H2', 'description': 'Local informatique CIM4H2', 'localisation': 'bâtiment'}
        ]
        
        created = 0
        for local_data in default_locaux:
            existing = LocalIT.query.filter_by(nom=local_data['nom']).first()
            if not existing:
                new_local = LocalIT(**local_data)
                db.session.add(new_local)
                created += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{created} default locaux IT created',
            'created': created
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# GET init default baies for locaux IT
@locaux_it_bp.route('/default/init-baies', methods=['POST'])
def init_default_baies():
    try:
        baies_config = {
            'CIM2': ['Baie 1'],
            'CIM6': ['Baie 1', 'Baie 2', 'Baie 3', 'Baie 4'],
            'CIM7': ['Baie 1', 'Baie 2'],
            'CIM4H1': ['Baie 1'],
            'CIM4H2': ['Baie 1']
        }
        
        created = 0
        for local_nom, baies in baies_config.items():
            local = LocalIT.query.filter_by(nom=local_nom).first()
            if local:
                for baie_nom in baies:
                    existing = BaieIT.query.filter_by(nom=baie_nom, local_it_id=local.id).first()
                    if not existing:
                        new_baie = BaieIT(
                            nom=baie_nom,
                            local_it_id=local.id,
                            description=f'Baie {baie_nom} du local {local_nom}'
                        )
                        db.session.add(new_baie)
                        created += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{created} default baies IT created',
            'created': created
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# ========== BAIES IT ROUTES ==========

# GET all baies for a local IT
@locaux_it_bp.route('/<int:local_id>/baies', methods=['GET'])
def get_baies(local_id):
    local_it = LocalIT.query.get_or_404(local_id)
    items = BaieIT.query.filter_by(local_it_id=local_id).all()
    return jsonify([baie_to_dict(item) for item in items])

# GET single baie
@locaux_it_bp.route('/baies/<int:id>', methods=['GET'])
def get_baie(id):
    item = BaieIT.query.get_or_404(id)
    return jsonify(baie_to_dict(item))

# POST new baie
@locaux_it_bp.route('/<int:local_id>/baies', methods=['POST'])
def create_baie(local_id):
    local_it = LocalIT.query.get_or_404(local_id)
    data = request.json
    
    try:
        new_baie = BaieIT(
            nom=data.get('nom'),
            numero=data.get('numero'),
            local_it_id=local_id,
            description=data.get('description')
        )
        
        db.session.add(new_baie)
        db.session.commit()
        
        return jsonify({
            'message': 'Baie IT created successfully',
            'baie': baie_to_dict(new_baie)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# PUT update baie
@locaux_it_bp.route('/baies/<int:id>', methods=['PUT'])
def update_baie(id):
    item = BaieIT.query.get_or_404(id)
    data = request.json
    
    try:
        item.nom = data.get('nom', item.nom)
        item.numero = data.get('numero', item.numero)
        item.description = data.get('description', item.description)
        item.date_modification = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Baie IT updated successfully',
            'baie': baie_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE baie
@locaux_it_bp.route('/baies/<int:id>', methods=['DELETE'])
def delete_baie(id):
    item = BaieIT.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Baie IT deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def local_to_dict(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'description': item.description,
        'localisation': item.localisation,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }

def local_to_dict_with_baies(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'description': item.description,
        'localisation': item.localisation,
        'baies': [baie_to_dict(b) for b in item.baies],
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }

def baie_to_dict(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'numero': item.numero,
        'local_it_id': item.local_it_id,
        'description': item.description,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }
