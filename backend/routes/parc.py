from flask import Blueprint, jsonify, request
from models import db, Parc
from datetime import datetime
import pandas as pd
from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, get_export_filename

parc_bp = Blueprint('parc', __name__, url_prefix='/api/parc')

PARC_IMPORT_TEMPLATE_HEADERS = [
    'Name',
    'Alternate username',
    'Operating System - Name',
    'Operating System - Version',
    'Type',
    'Model',
    'Manufacturer',
    'Processeur',
    'N° de Série',
    'RAM',
    'Disque Dur',
    'Emplacement',
    'Activité',
    'Service',
    'Quantité',
]

PARC_EXPORT_HEADERS = [
    'Name',
    'Alternate username',
    'Operating System - Name',
    'Operating System - Version',
    'Type',
    'Model',
    'Manufacturer',
    'Processeur',
    'N° de Série',
    'RAM',
    'Disque Dur',
    'Emplacement',
    'Activité',
    'Service',
    'Quantité',
]


def _clean_value(value):
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    return str(value).strip()


def _first_value(row, aliases):
    for alias in aliases:
        if alias in row:
            value = _clean_value(row.get(alias))
            if value is not None:
                return value
    return None


def _payload_value(data, key):
    if not data:
        return None
    return _clean_value(data.get(key))


def _normalize_headers(columns):
    return [(str(col).strip().lower() if col is not None else '') for col in columns]


def _validate_template_headers(df_columns, expected_headers):
    current = _normalize_headers(df_columns)
    expected = _normalize_headers(expected_headers)
    missing = [expected_headers[i] for i, h in enumerate(expected) if h not in current]
    return missing

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
            (Parc.alternate_username.ilike(f'%{search}%')) |
            (Parc.type.ilike(f'%{search}%')) |
            (Parc.model.ilike(f'%{search}%'))
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
    data = request.json or {}
    
    try:
        payload = {
            'name': _payload_value(data, 'name'),
            'alternate_username': _payload_value(data, 'alternate_username'),
            'os_name': _payload_value(data, 'os_name'),
            'os_version': _payload_value(data, 'os_version'),
            'type': _payload_value(data, 'type'),
            'model': _payload_value(data, 'model'),
            'version': _payload_value(data, 'version'),
            'manufacturer': _payload_value(data, 'manufacturer'),
            'numero_serie': _payload_value(data, 'numero_serie'),
            'processeur': _payload_value(data, 'processeur'),
            'ram': _payload_value(data, 'ram'),
            'disque_dur': _payload_value(data, 'disque_dur'),
            'emplacement': _payload_value(data, 'emplacement'),
            'service': _payload_value(data, 'service'),
            'esu': _payload_value(data, 'esu'),
        }

        if not payload['name']:
            return jsonify({'error': 'Le champ Name est obligatoire'}), 400
        if not payload['type']:
            return jsonify({'error': 'Le champ Type est obligatoire'}), 400
        if payload['numero_serie']:
            existing_serial = Parc.query.filter_by(numero_serie=payload['numero_serie']).first()
            if existing_serial:
                return jsonify({'error': 'Ce numéro de série existe déjà'}), 400

        new_item = Parc(
            name=payload['name'],
            alternate_username=payload['alternate_username'],
            os_name=payload['os_name'],
            os_version=payload['os_version'],
            type=payload['type'],
            model=payload['model'],
            version=payload['version'],
            manufacturer=payload['manufacturer'],
            numero_serie=payload['numero_serie'],
            processeur=payload['processeur'],
            ram=payload['ram'],
            disque_dur=payload['disque_dur'],
            emplacement=payload['emplacement'],
            service=payload['service'],
            esu=payload['esu']
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
    data = request.json or {}
    
    try:
        next_name = _payload_value(data, 'name')
        next_type = _payload_value(data, 'type')
        next_serial = _payload_value(data, 'numero_serie')

        if not next_name:
            return jsonify({'error': 'Le champ Name est obligatoire'}), 400
        if not next_type:
            return jsonify({'error': 'Le champ Type est obligatoire'}), 400

        if next_serial:
            serial_owner = Parc.query.filter_by(numero_serie=next_serial).first()
            if serial_owner and serial_owner.id != item.id:
                return jsonify({'error': 'Ce numéro de série existe déjà'}), 400

        item.name = next_name
        item.alternate_username = _payload_value(data, 'alternate_username')
        item.os_name = _payload_value(data, 'os_name')
        item.os_version = _payload_value(data, 'os_version')
        item.type = next_type
        item.model = _payload_value(data, 'model')
        item.version = _payload_value(data, 'version')
        item.manufacturer = _payload_value(data, 'manufacturer')
        item.numero_serie = next_serial
        item.processeur = _payload_value(data, 'processeur')
        item.ram = _payload_value(data, 'ram')
        item.disque_dur = _payload_value(data, 'disque_dur')
        item.emplacement = _payload_value(data, 'emplacement')
        item.service = _payload_value(data, 'service')
        item.esu = _payload_value(data, 'esu')
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
@parc_bp.route('/import-template', methods=['GET'])
@check_permission('import')
def export_parc_import_template():
    format_type = (request.args.get('format', 'xlsx') or 'xlsx').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Invalid format. Use csv or xlsx'}), 400

    filename = get_export_filename('parc_import_template', format_type)
    if format_type == 'xlsx':
        return export_to_excel(PARC_IMPORT_TEMPLATE_HEADERS, [], filename, sheet_name='Template_Parc')
    return export_to_csv(PARC_IMPORT_TEMPLATE_HEADERS, [], filename)


@parc_bp.route('/import', methods=['POST'])
@check_permission('import')
def import_parc():
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

        missing_headers = _validate_template_headers(df.columns, PARC_IMPORT_TEMPLATE_HEADERS)
        if missing_headers:
            return jsonify({
                'error': 'Template invalide. Utilisez le template officiel.',
                'missing_headers': missing_headers,
                'expected_headers': PARC_IMPORT_TEMPLATE_HEADERS,
            }), 400
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                serial_number = _first_value(row, ['N° de Série', 'N° Série', 'N° de série', 'Numero du serie'])
                existing = Parc.query.filter_by(numero_serie=serial_number).first() if serial_number else None

                payload = {
                    'name': _first_value(row, ['Name']),
                    'alternate_username': _first_value(row, ['Alternate username']),
                    'os_name': _first_value(row, ['Operating System - Name']),
                    'os_version': _first_value(row, ['Operating System - Version']),
                    'type': _first_value(row, ['Type']),
                    'model': _first_value(row, ['Model']),
                    'version': None,
                    'manufacturer': _first_value(row, ['Manufacturer']),
                    'numero_serie': serial_number,
                    'processeur': _first_value(row, ['Processeur']),
                    'ram': _first_value(row, ['RAM']),
                    'disque_dur': _first_value(row, ['Disque Dur']),
                    'emplacement': _first_value(row, ['Emplacement']),
                    'service': _first_value(row, ['Service']),
                    'activite': _first_value(row, ['Activité']),
                }
                
                quantite_val = _first_value(row, ['Quantité', 'Quantite'])
                try:
                    payload['quantite'] = int(float(quantite_val)) if quantite_val else 0
                except:
                    payload['quantite'] = 0

                if not payload['name']:
                    errors.append(f'Row {index + 1}: Name is required')
                    continue
                if not payload['type']:
                    errors.append(f'Row {index + 1}: Type is required')
                    continue
                
                if existing:
                    # Update
                    existing.name = payload['name'] or existing.name
                    existing.alternate_username = payload['alternate_username'] or existing.alternate_username
                    existing.os_name = payload['os_name'] or existing.os_name
                    existing.os_version = payload['os_version'] or existing.os_version
                    existing.type = payload['type'] or existing.type
                    existing.model = payload['model'] or existing.model
                    existing.version = payload['version'] or existing.version
                    existing.manufacturer = payload['manufacturer'] or existing.manufacturer
                    existing.processeur = payload['processeur'] or existing.processeur
                    existing.ram = payload['ram'] or existing.ram
                    existing.disque_dur = payload['disque_dur'] or existing.disque_dur
                    existing.emplacement = payload['emplacement'] or existing.emplacement
                    existing.service = payload['service'] or existing.service
                    existing.esu = payload['esu'] or existing.esu
                    existing.date_modification = datetime.utcnow()
                else:
                    # Create new
                    new_item = Parc(**payload)
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


# EXPORT parc to Excel/CSV
@parc_bp.route('/export', methods=['GET'])
@check_permission('export')
def export_parc():
    format_type = request.args.get('format', 'csv').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Invalid format. Use csv or xlsx'}), 400

    items = Parc.query.all()
    rows = [
        [
            item.name,
            item.alternate_username,
            item.os_name,
            item.os_version,
            item.type,
            item.model,
            item.manufacturer,
            item.processeur,
            item.numero_serie,
            item.ram,
            item.disque_dur,
            item.emplacement,
            item.activite,
            item.service,
            item.quantite,
        ]
        for item in items
    ]

    filename = get_export_filename('parc', format_type)
    if format_type == 'xlsx':
        return export_to_excel(PARC_EXPORT_HEADERS, rows, filename, sheet_name='Parc')
    return export_to_csv(PARC_EXPORT_HEADERS, rows, filename)

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
    ipo_count = Parc.query.filter(Parc.type.ilike('%ipo%')).count()
    imprimante_count = Parc.query.filter(Parc.type.ilike('%imprimante%')).count()
    
    activite_labels = ['FSS', 'IMS', 'C2S', 'Commun']
    activite_map = {
        label: {'activite': label, 'pc_portable': 0, 'pc_fixe': 0, 'ipo': 0}
        for label in activite_labels
    }
    activite_rows = db.session.query(
        Parc.activite,
        db.func.sum(
            db.case((Parc.type.ilike('%pc portable%'), 1), else_=0)
        ).label('pc_portable'),
        db.func.sum(
            db.case((Parc.type.ilike('%pc fixe%'), 1), else_=0)
        ).label('pc_fixe'),
        db.func.sum(
            db.case((Parc.type.ilike('%ipo%'), 1), else_=0)
        ).label('ipo')
    ).filter(Parc.activite.in_(activite_labels)).group_by(Parc.activite).all()

    for row in activite_rows:
        if row[0] in activite_map:
            activite_map[row[0]]['pc_portable'] = int(row[1] or 0)
            activite_map[row[0]]['pc_fixe'] = int(row[2] or 0)
            activite_map[row[0]]['ipo'] = int(row[3] or 0)

    return jsonify({
        'stats': [
            {
                'type': s[0],
                'count': s[1]
            } for s in stats
        ],
        'stats_by_activite': list(activite_map.values()),
        'pc_portable': pc_portable_count,
        'pc_fixe': pc_fixe_count,
        'ipo': ipo_count,
        'imprimante': imprimante_count,
        'total': Parc.query.count()
    })

def parc_to_dict(item):
    return {
        'id': item.id,
        'name': item.name,
        'alternate_username': item.alternate_username,
        'os_name': item.os_name,
        'os_version': item.os_version,
        'type': item.type,
        'model': item.model,
        'version': item.version,
        'manufacturer': item.manufacturer,
        'numero_serie': item.numero_serie,
        'processeur': item.processeur,
        'ram': item.ram,
        'disque_dur': item.disque_dur,
        'emplacement': item.emplacement,
        'service': item.service,
        'activite': item.activite,
        'quantite': item.quantite,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }
