from flask import Blueprint, jsonify, request
from models import db, Stock, Mouvement
from datetime import datetime
import pandas as pd
import csv
import io
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur
from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, get_export_filename

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')


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

# GET all stock items
@stock_bp.route('/', methods=['GET'])
def get_stock():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    type_stock = request.args.get('type_stock', None)
    search = request.args.get('search', '')
    
    query = Stock.query
    
    if type_stock:
        query = query.filter_by(type_stock=type_stock)
    
    if search:
        query = query.filter(Stock.nom_equipement.ilike(f'%{search}%'))
    
    items = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [item_to_dict(item) for item in items.items],
        'total': items.total,
        'pages': items.pages,
        'current_page': page
    })

# GET single stock item
@stock_bp.route('/<int:id>', methods=['GET'])
def get_stock_item(id):
    item = Stock.query.get_or_404(id)
    return jsonify(item_to_dict(item))

# POST new stock item
@stock_bp.route('/', methods=['POST'])
def create_stock_item():
    data = request.json
    
    try:
        # Check if equipment type requires detailed info
        equipment_types_with_details = ['pc portable', 'pc fixe', 'ipo']
        
        new_item = Stock(
            nom_equipement=data.get('nom_equipement'),
            type_equipement=data.get('type_equipement'),
            quantite=data.get('quantite', 0),
            type_stock=data.get('type_stock'),
            etat=data.get('etat', 'nouveau')
        )
        
        # Add detailed info if PC type
        if data.get('type_equipement') in equipment_types_with_details:
            new_item.ram = data.get('ram')
            new_item.stockage = data.get('stockage')
            new_item.processeur = data.get('processeur')
            new_item.numero_serie = data.get('numero_serie')
            new_item.activite = data.get('activite')
            new_item.systeme = data.get('systeme')
            new_item.accessoires = data.get('accessoires')
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Stock item created successfully',
            'item': item_to_dict(new_item)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# PUT update stock item
@stock_bp.route('/<int:id>', methods=['PUT'])
def update_stock_item(id):
    item = Stock.query.get_or_404(id)
    data = request.json

    try:
        equipment_types_with_details = ['pc portable', 'pc fixe', 'ipo']

        item.nom_equipement = data.get('nom_equipement', item.nom_equipement)
        item.type_equipement = data.get('type_equipement', item.type_equipement)
        item.quantite = data.get('quantite', item.quantite)
        item.type_stock = data.get('type_stock', item.type_stock)
        item.etat = data.get('etat', item.etat)

        if item.type_equipement in equipment_types_with_details:
            item.ram = data.get('ram', item.ram)
            item.stockage = data.get('stockage', item.stockage)
            item.processeur = data.get('processeur', item.processeur)
            item.numero_serie = data.get('numero_serie', item.numero_serie)
            item.activite = data.get('activite', item.activite)
            item.systeme = data.get('systeme', item.systeme)
            item.accessoires = data.get('accessoires', item.accessoires)
        else:
            item.ram = None
            item.stockage = None
            item.processeur = None
            item.numero_serie = None
            item.activite = None
            item.systeme = None
            item.accessoires = None

        item.date_modification = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Stock item updated successfully',
            'item': item_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE stock item
@stock_bp.route('/<int:id>', methods=['DELETE'])
def delete_stock_item(id):
    item = Stock.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Stock item deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# IMPORT stock from Excel/CSV
@stock_bp.route('/import', methods=['POST'])
@check_permission('import')
def import_stock():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        filename = (file.filename or '').lower()
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'File format not supported'}), 400

        equipment_types_with_details = ['pc portable', 'pc fixe', 'ipo']
        imported_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                nom_equipement = _first_value(row, ['Nom', 'nom', 'Nom équipement', 'Nom equipement', 'nom_equipement'])
                type_equipement = _first_value(row, ['Type Équipement', 'Type equipement', 'Type', 'type_equipement'])
                type_stock = _first_value(row, ['Type Stock', 'type_stock'])
                etat = _first_value(row, ['État', 'Etat', 'etat']) or 'nouveau'
                numero_serie = _first_value(row, ['N° Série', 'N° de série', 'Numero de série', 'Numero serie', 'numero_serie'])

                quantite_value = _first_value(row, ['Quantité', 'Quantite', 'quantite'])
                try:
                    quantite = int(float(quantite_value)) if quantite_value is not None else 0
                except Exception:
                    quantite = 0

                if not nom_equipement or not type_equipement or not type_stock:
                    errors.append(f'Row {index + 1}: nom_equipement, type_equipement et type_stock sont obligatoires')
                    continue

                existing = Stock.query.filter_by(numero_serie=numero_serie).first() if numero_serie else None

                payload = {
                    'nom_equipement': nom_equipement,
                    'type_equipement': type_equipement,
                    'quantite': quantite,
                    'type_stock': type_stock,
                    'etat': etat,
                    'ram': _first_value(row, ['RAM', 'ram']),
                    'stockage': _first_value(row, ['Stockage', 'stockage']),
                    'processeur': _first_value(row, ['Processeur', 'processeur']),
                    'numero_serie': numero_serie,
                    'activite': _first_value(row, ['Activité', 'Activite', 'activite']),
                    'systeme': _first_value(row, ['Système', 'Systeme', 'systeme']),
                    'accessoires': _first_value(row, ['Accessoires', 'accessoires']),
                }

                if payload['type_equipement'].lower() not in equipment_types_with_details:
                    payload['ram'] = None
                    payload['stockage'] = None
                    payload['processeur'] = None
                    payload['numero_serie'] = None
                    payload['activite'] = None
                    payload['systeme'] = None
                    payload['accessoires'] = None

                if existing:
                    existing.nom_equipement = payload['nom_equipement']
                    existing.type_equipement = payload['type_equipement']
                    existing.quantite = payload['quantite']
                    existing.type_stock = payload['type_stock']
                    existing.etat = payload['etat']
                    existing.ram = payload['ram']
                    existing.stockage = payload['stockage']
                    existing.processeur = payload['processeur']
                    existing.numero_serie = payload['numero_serie']
                    existing.activite = payload['activite']
                    existing.systeme = payload['systeme']
                    existing.accessoires = payload['accessoires']
                    existing.date_modification = datetime.utcnow()
                else:
                    db.session.add(Stock(**payload))

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

# GET stock statistics
@stock_bp.route('/stats', methods=['GET'])
def get_stats():
    stats = db.session.query(
        Stock.type_stock,
        db.func.sum(Stock.quantite).label('total_quantite'),
        db.func.count(Stock.id).label('nombre_articles')
    ).group_by(Stock.type_stock).all()

    stock_labels = ['IMS', 'FSS', 'C2S', 'Commun']
    breakdown_map = {
        label: {
            'type_stock': label,
            'pc_portable': 0,
            'pc_fixe': 0,
            'ipo': 0,
        }
        for label in stock_labels
    }

    breakdown_rows = db.session.query(
        Stock.type_stock,
        db.func.sum(
            db.case(
                (Stock.type_equipement.ilike('%pc portable%'), Stock.quantite),
                else_=0
            )
        ).label('pc_portable'),
        db.func.sum(
            db.case(
                (Stock.type_equipement.ilike('%pc fixe%'), Stock.quantite),
                else_=0
            )
        ).label('pc_fixe'),
        db.func.sum(
            db.case(
                (Stock.type_equipement.ilike('%ipo%'), Stock.quantite),
                else_=0
            )
        ).label('ipo')
    ).group_by(Stock.type_stock).all()

    for row in breakdown_rows:
        type_stock = row[0]
        if type_stock not in breakdown_map:
            breakdown_map[type_stock] = {
                'type_stock': type_stock,
                'pc_portable': 0,
                'pc_fixe': 0,
                'ipo': 0,
            }

        breakdown_map[type_stock]['pc_portable'] = int(row[1] or 0)
        breakdown_map[type_stock]['pc_fixe'] = int(row[2] or 0)
        breakdown_map[type_stock]['ipo'] = int(row[3] or 0)

    pc_portable_count = db.session.query(db.func.sum(Stock.quantite)).filter(Stock.type_equipement.ilike('%pc portable%')).scalar() or 0
    pc_fixe_count = db.session.query(db.func.sum(Stock.quantite)).filter(Stock.type_equipement.ilike('%pc fixe%')).scalar() or 0
    ipo_count = db.session.query(db.func.sum(Stock.quantite)).filter(Stock.type_equipement.ilike('%ipo%')).scalar() or 0
    
    return jsonify({
        'stats': [
            {
                'type_stock': s[0],
                'total_quantite': s[1] or 0,
                'nombre_articles': s[2]
            } for s in stats
        ],
        'stats_by_equipment': list(breakdown_map.values()),
        'pc_portable': int(pc_portable_count),
        'pc_fixe': int(pc_fixe_count),
        'ipo': int(ipo_count)
    })

# EXPORT stock to CSV/Excel
@stock_bp.route('/export', methods=['GET'])
@check_permission('export')
def export_stock():
    format_type = request.args.get('format', 'csv')
    type_stock = request.args.get('type_stock', None)
    
    query = Stock.query
    if type_stock:
        query = query.filter_by(type_stock=type_stock)
    
    items = query.all()
    
    # Prepare headers and data rows
    headers = ['ID', 'Nom', 'Type Équipement', 'Quantité', 'Type Stock', 'État', 
               'RAM', 'Stockage', 'Processeur', 'N° Série', 'Activité', 'Système', 'Accessoires']
    
    rows = [[
        item.id, item.nom_equipement, item.type_equipement, item.quantite,
        item.type_stock, item.etat, item.ram or '', item.stockage or '',
        item.processeur or '', item.numero_serie or '', item.activite or '',
        item.systeme or '', item.accessoires or ''
    ] for item in items]
    
    # Generate filename
    filename = get_export_filename('stock', format_type)
    
    # Export to requested format
    if format_type == 'xlsx':
        return export_to_excel(headers, rows, filename, sheet_name='Stock')
    else:
        return export_to_csv(headers, rows, filename)

def item_to_dict(item):
    return {
        'id': item.id,
        'nom_equipement': item.nom_equipement,
        'type_equipement': item.type_equipement,
        'quantite': item.quantite,
        'type_stock': item.type_stock,
        'etat': item.etat,
        'ram': item.ram,
        'stockage': item.stockage,
        'processeur': item.processeur,
        'numero_serie': item.numero_serie,
        'activite': item.activite,
        'systeme': item.systeme,
        'accessoires': item.accessoires,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }
