from flask import Blueprint, jsonify, request
from models import db, LocalIT, BaieIT, MaterielIT
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
            {'nom': 'CIM2'},
            {'nom': 'CIM6'},
            {'nom': 'CIM7'},
            {'nom': 'CIM4H1'},
            {'nom': 'CIM4H2'}
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
        'localisation': item.localisation,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }

def local_to_dict_with_baies(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'localisation': item.localisation,
        'baies': [baie_to_dict_with_materiels(b) for b in item.baies],
        'materiels': [materiel_to_dict(m) for m in MaterielIT.query.filter_by(local_it_id=item.id, baie_id=None).all()],
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

def baie_to_dict_with_materiels(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'numero': item.numero,
        'local_it_id': item.local_it_id,
        'description': item.description,
        'materiels': [materiel_to_dict(m) for m in MaterielIT.query.filter_by(baie_id=item.id).all()],
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }

def materiel_to_dict(item):
    return {
        'id': item.id,
        'type_materiel': item.type_materiel,
        'nom': item.nom,
        'modele': item.modele,
        'version': item.version,
        'os_firmware': item.os_firmware,
        'numero_serie': item.numero_serie,
        'stack_role': item.stack_role,
        'stack_ip': item.stack_ip,
        'description': item.description,
        'baie_id': item.baie_id,
        'local_it_id': item.local_it_id,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }


# ========== MATERIEL IT ROUTES ==========

@locaux_it_bp.route('/materiels', methods=['POST'])
def create_materiel():
    data = request.json
    try:
        new_m = MaterielIT(
            type_materiel=data.get('type_materiel'),
            nom=data.get('nom'),
            modele=data.get('modele'),
            version=data.get('version'),
            os_firmware=data.get('os_firmware'),
            numero_serie=data.get('numero_serie'),
            stack_role=data.get('stack_role'),
            stack_ip=data.get('stack_ip'),
            description=data.get('description'),
            baie_id=data.get('baie_id') or None,
            local_it_id=data.get('local_it_id') or None,
        )
        db.session.add(new_m)
        db.session.commit()
        return jsonify({'message': 'Matériel ajouté', 'materiel': materiel_to_dict(new_m)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@locaux_it_bp.route('/materiels/<int:id>', methods=['DELETE'])
def delete_materiel(id):
    item = MaterielIT.query.get_or_404(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Matériel supprimé'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
