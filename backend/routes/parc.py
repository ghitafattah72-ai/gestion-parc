from flask import Blueprint, jsonify, request, send_file
from models import db, Parc
from datetime import datetime
import csv
import io
import pandas as pd
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur

parc_bp = Blueprint('parc', __name__, url_prefix='/api/parc')

# GET all parc items
@parc_bp.route('/', methods=['GET'])
def get_parc():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = Parc.query
    
    if search:
        query = query.filter(
            (Parc.name.ilike(f'%{search}%')) |
            (Parc.numero_serie.ilike(f'%{search}%')) |
            (Parc.alternate_username.ilike(f'%{search}%'))
        )
    
    items = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [parc_to_dict(item) for item in items.items],
        'total': items.total,
        'pages': items.pages,
        'current_page': page
    })

# GET single parc item
@parc_bp.route('/<int:id>', methods=['GET'])
def get_parc_item(id):
    item = Parc.query.get_or_404(id)
    return jsonify(parc_to_dict(item))

# POST new parc item
@parc_bp.route('/', methods=['POST'])
def create_parc_item():
    data = request.json
    
    try:
        new_item = Parc(
            name=data.get('name'),
            alternate_username=data.get('alternate_username'),
            os_name=data.get('os_name'),
            os_version=data.get('os_version'),
            type=data.get('type'),
            model=data.get('model'),
            manufacturer=data.get('manufacturer'),
            numero_serie=data.get('numero_serie'),
            processeur=data.get('processeur'),
            ram=data.get('ram'),
            disque_dur=data.get('disque_dur'),
            emplacement=data.get('emplacement'),
            service=data.get('service'),
            esu=data.get('esu')
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Parc item created successfully',
            'item': parc_to_dict(new_item)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# PUT update parc item
@parc_bp.route('/<int:id>', methods=['PUT'])
def update_parc_item(id):
    item = Parc.query.get_or_404(id)
    data = request.json
    
    try:
        item.name = data.get('name', item.name)
        item.alternate_username = data.get('alternate_username', item.alternate_username)
        item.os_name = data.get('os_name', item.os_name)
        item.os_version = data.get('os_version', item.os_version)
        item.type = data.get('type', item.type)
        item.model = data.get('model', item.model)
        item.manufacturer = data.get('manufacturer', item.manufacturer)
        item.numero_serie = data.get('numero_serie', item.numero_serie)
        item.processeur = data.get('processeur', item.processeur)
        item.ram = data.get('ram', item.ram)
        item.disque_dur = data.get('disque_dur', item.disque_dur)
        item.emplacement = data.get('emplacement', item.emplacement)
        item.service = data.get('service', item.service)
        item.esu = data.get('esu', item.esu)
        item.date_modification = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Parc item updated successfully',
            'item': parc_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE parc item
@parc_bp.route('/<int:id>', methods=['DELETE'])
def delete_parc_item(id):
    item = Parc.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Parc item deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# IMPORT parc from Excel/CSV
@parc_bp.route('/import', methods=['POST'])
@jwt_required()
def import_parc():
    current_user_id = get_jwt_identity()
    current_user = Utilisateur.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Check import permission
    if not current_user.permission_import:
        return jsonify({'message': 'Vous n\'avez pas la permission d\'importer des données'}), 403
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file
        if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'File format not supported'}), 400
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Check if serial number already exists
                existing = Parc.query.filter_by(numero_serie=row.get('N° de série')).first()
                
                if existing:
                    # Update
                    existing.name = row.get('Name', existing.name)
                    existing.alternate_username = row.get('Alternate username', existing.alternate_username)
                    existing.os_name = row.get('Operating System - Name', existing.os_name)
                    existing.os_version = row.get('Operating System - Version', existing.os_version)
                    existing.type = row.get('Type', existing.type)
                    existing.model = row.get('Model', existing.model)
                    existing.manufacturer = row.get('Manufacturer', existing.manufacturer)
                    existing.processeur = row.get('Processeur', existing.processeur)
                    existing.ram = row.get('RAM', existing.ram)
                    existing.disque_dur = row.get('Disque dur', existing.disque_dur)
                    existing.emplacement = row.get('Emplacement', existing.emplacement)
                    existing.service = row.get('Service', existing.service)
                    existing.esu = row.get('ESU', existing.esu)
                    existing.date_modification = datetime.utcnow()
                else:
                    # Create new
                    new_item = Parc(
                        name=row.get('Name'),
                        alternate_username=row.get('Alternate username'),
                        os_name=row.get('Operating System - Name'),
                        os_version=row.get('Operating System - Version'),
                        type=row.get('Type'),
                        model=row.get('Model'),
                        manufacturer=row.get('Manufacturer'),
                        numero_serie=row.get('N° de série'),
                        processeur=row.get('Processeur'),
                        ram=row.get('RAM'),
                        disque_dur=row.get('Disque dur'),
                        emplacement=row.get('Emplacement'),
                        service=row.get('Service'),
                        esu=row.get('ESU')
                    )
                    db.session.add(new_item)
                
                imported_count += 1
            except Exception as e:
                errors.append(f'Row {index + 1}: {str(e)}')
        
        db.session.commit()
        
        return jsonify({
            'message': f'{imported_count} items imported successfully',
            'imported_count': imported_count,
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# GET parc statistics
@parc_bp.route('/stats', methods=['GET'])
def get_parc_stats():
    # Count by type
    stats = db.session.query(
        Parc.type,
        db.func.count(Parc.id).label('count')
    ).group_by(Parc.type).all()
    
    # Specific counts requested - case insensitive search
    pc_portable_count = Parc.query.filter(Parc.type.ilike('%pc portable%')).count()
    pc_fixe_count = Parc.query.filter(Parc.type.ilike('%pc fixe%')).count()
    imprimante_count = Parc.query.filter(Parc.type.ilike('%imprimante%')).count()
    
    return jsonify({
        'stats': [
            {
                'type': s[0],
                'count': s[1]
            } for s in stats
        ],
        'pc_portable': pc_portable_count,
        'pc_fixe': pc_fixe_count,
        'imprimante': imprimante_count,
        'total': Parc.query.count()
    })
    format_type = request.args.get('format', 'csv')
    
    items = Parc.query.all()
    
    if format_type == 'xlsx':
        # Export to Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Parc"
        
        headers = ['Name', 'Alternate username', 'Operating System - Name', 'Operating System - Version',
                   'Type', 'Model', 'Manufacturer', 'N° de série', 'Processeur', 'RAM', 'Disque dur',
                   'Emplacement', 'Service', 'ESU']
        ws.append(headers)
        
        for item in items:
            ws.append([
                item.name, item.alternate_username, item.os_name, item.os_version,
                item.type, item.model, item.manufacturer, item.numero_serie,
                item.processeur, item.ram, item.disque_dur, item.emplacement,
                item.service, item.esu
            ])
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'parc_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    else:
        # Export to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Name', 'Alternate username', 'Operating System - Name', 'Operating System - Version',
                        'Type', 'Model', 'Manufacturer', 'N° de série', 'Processeur', 'RAM', 'Disque dur',
                        'Emplacement', 'Service', 'ESU'])
        
        for item in items:
            writer.writerow([
                item.name, item.alternate_username, item.os_name, item.os_version,
                item.type, item.model, item.manufacturer, item.numero_serie,
                item.processeur, item.ram, item.disque_dur, item.emplacement,
                item.service, item.esu
            ])
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'parc_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )

def parc_to_dict(item):
    return {
        'id': item.id,
        'name': item.name,
        'alternate_username': item.alternate_username,
        'os_name': item.os_name,
        'os_version': item.os_version,
        'type': item.type,
        'model': item.model,
        'manufacturer': item.manufacturer,
        'numero_serie': item.numero_serie,
        'processeur': item.processeur,
        'ram': item.ram,
        'disque_dur': item.disque_dur,
        'emplacement': item.emplacement,
        'service': item.service,
        'esu': item.esu,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }
