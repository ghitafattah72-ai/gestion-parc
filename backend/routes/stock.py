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

STOCK_IMPORT_TEMPLATE_HEADERS = [
    'Name',
    'Operating System - Name',
    'Operating System - Version',
    'Type',
    'Model',
    'Manufacturer',
    'Processeur',
    'N° de Série',
    'RAM',
    'Disque Dur',
    'Activité',
    'État',
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


def _normalize_headers(columns):
    return [(str(col).strip().lower() if col is not None else '') for col in columns]


def _validate_template_headers(df_columns, expected_headers):
    current = _normalize_headers(df_columns)
    expected = _normalize_headers(expected_headers)
    missing = [expected_headers[i] for i, h in enumerate(expected) if h not in current]
    return missing

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
    data = request.json or {}
    try:
        resolved_type_stock = data.get('type_stock') or data.get('activite') or None
        new_item = Stock(
            nom_equipement=data.get('nom_equipement'),
            type_equipement=data.get('type_equipement'),
            quantite=data.get('quantite', 0),
            type_stock=resolved_type_stock,
            etat=data.get('etat', 'nouveau'),
            alternate_username=data.get('alternate_username') or None,
            systeme=data.get('systeme') or None,
            os_version=data.get('os_version') or None,
            stockage=data.get('stockage') or None,
            manufacturer=data.get('manufacturer') or None,
            processeur=data.get('processeur') or None,
            numero_serie=data.get('numero_serie') or None,
            ram=data.get('ram') or None,
            disque_dur=data.get('disque_dur') or None,
            emplacement=data.get('emplacement') or None,
            activite=data.get('activite') or None,
            service=data.get('service') or None,
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({'message': 'Équipement ajouté au stock avec succès', 'item': item_to_dict(new_item)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'ajout au stock : {str(e)}"}), 400

# PUT update stock item
@stock_bp.route('/<int:id>', methods=['PUT'])
def update_stock_item(id):
    item = Stock.query.get_or_404(id)
    data = request.json or {}
    try:
        resolved_type_stock = data.get('type_stock') or data.get('activite') or item.type_stock
        item.nom_equipement = data.get('nom_equipement', item.nom_equipement)
        item.type_equipement = data.get('type_equipement', item.type_equipement)
        item.quantite = data.get('quantite', item.quantite)
        item.type_stock = resolved_type_stock
        item.etat = data.get('etat', item.etat)
        item.alternate_username = data.get('alternate_username') or None
        item.systeme = data.get('systeme') or None
        item.os_version = data.get('os_version') or None
        item.stockage = data.get('stockage') or None
        item.manufacturer = data.get('manufacturer') or None
        item.processeur = data.get('processeur') or None
        item.numero_serie = data.get('numero_serie') or None
        item.ram = data.get('ram') or None
        item.disque_dur = data.get('disque_dur') or None
        item.emplacement = data.get('emplacement') or None
        item.activite = data.get('activite') or None
        item.service = data.get('service') or None
        item.date_modification = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Équipement du stock modifié avec succès', 'item': item_to_dict(item)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la modification du stock : {str(e)}"}), 400

# DELETE stock item
@stock_bp.route('/<int:id>', methods=['DELETE'])
def delete_stock_item(id):
    item = Stock.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Équipement du stock supprimé avec succès'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression du stock : {str(e)}"}), 400


# IMPORT stock from Excel/CSV
@stock_bp.route('/import-template', methods=['GET'])
@check_permission('import')
def export_stock_import_template():
    format_type = (request.args.get('format', 'xlsx') or 'xlsx').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Format invalide. Utilisez csv ou xlsx'}), 400

    filename = get_export_filename('stock_import_template', format_type)
    if format_type == 'xlsx':
        return export_to_excel(STOCK_IMPORT_TEMPLATE_HEADERS, [], filename, sheet_name='Template_Stock')
    return export_to_csv(STOCK_IMPORT_TEMPLATE_HEADERS, [], filename)


@stock_bp.route('/import', methods=['POST'])
@check_permission('import')
def import_stock():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400

        filename = (file.filename or '').lower()
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Format de fichier non pris en charge'}), 400

        missing_headers = _validate_template_headers(df.columns, STOCK_IMPORT_TEMPLATE_HEADERS)
        if missing_headers:
            return jsonify({
                'error': 'Template invalide. Utilisez le template officiel.',
                'missing_headers': missing_headers,
                'expected_headers': STOCK_IMPORT_TEMPLATE_HEADERS,
            }), 400

        imported_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                nom_equipement = _first_value(row, ['Name', 'Nom'])
                type_equipement = _first_value(row, ['Type'])
                activite = _first_value(row, ['Activité', 'Activitée', 'Activité C2S/IMS/FSS'])
                type_stock = activite
                etat = _first_value(row, ['État', 'Etat']) or 'nouveau'

                quantite_value = _first_value(row, ['Quantité', 'Quantite'])
                try:
                    quantite = int(float(quantite_value)) if quantite_value is not None else 0
                except Exception:
                    quantite = 0

                if not nom_equipement or not type_equipement or not activite:
                    errors.append(f'Ligne {index + 1} : Name, Type et Activité sont obligatoires')
                    continue

                numero_serie = _first_value(row, ['N° de Série', 'N° Série', 'Numero du serie'])
                existing = Stock.query.filter_by(numero_serie=numero_serie).first() if numero_serie else None

                payload = {
                    'nom_equipement': nom_equipement,
                    'type_equipement': type_equipement,
                    'quantite': quantite,
                    'type_stock': type_stock,
                    'etat': etat,
                    'alternate_username': None,
                    'systeme': _first_value(row, ['Operating System - Name', 'Système', 'Systeme', 'Système d\'exploitation']),
                    'os_version': _first_value(row, ['Operating System - Version']),
                    'stockage': _first_value(row, ['Model']),
                    'manufacturer': _first_value(row, ['Manufacturer']),
                    'processeur': _first_value(row, ['Processeur']),
                    'numero_serie': numero_serie,
                    'ram': _first_value(row, ['RAM']),
                    'disque_dur': _first_value(row, ['Disque Dur']),
                    'emplacement': None,
                    'activite': activite,
                    'service': None,
                    'accessoires': None,
                }

                if existing:
                    for k, v in payload.items():
                        setattr(existing, k, v)
                    existing.date_modification = datetime.utcnow()
                else:
                    db.session.add(Stock(**payload))

                imported_count += 1
            except Exception as e:
                errors.append(f'Ligne {index + 1} : {str(e)}')

        db.session.commit()

        return jsonify({
            'message': f'{imported_count} équipement(s) importé(s) avec succès',
            'imported_count': imported_count,
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'import du stock : {str(e)}"}), 400

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
    
    activite_labels = ['IMS', 'FSS', 'C2S', 'Commun']
    activite_map = {
        label: {'activite': label, 'pc_portable': 0, 'pc_fixe': 0, 'ipo': 0}
        for label in activite_labels
    }
    activite_rows = db.session.query(
        Stock.activite,
        db.func.sum(
            db.case((Stock.type_equipement.ilike('%pc portable%'), Stock.quantite), else_=0)
        ).label('pc_portable'),
        db.func.sum(
            db.case((Stock.type_equipement.ilike('%pc fixe%'), Stock.quantite), else_=0)
        ).label('pc_fixe'),
        db.func.sum(
            db.case((Stock.type_equipement.ilike('%ipo%'), Stock.quantite), else_=0)
        ).label('ipo')
    ).filter(Stock.activite.in_(activite_labels)).group_by(Stock.activite).all()

    for row in activite_rows:
        if row[0] in activite_map:
            activite_map[row[0]]['pc_portable'] = int(row[1] or 0)
            activite_map[row[0]]['pc_fixe'] = int(row[2] or 0)
            activite_map[row[0]]['ipo'] = int(row[3] or 0)

    return jsonify({
        'stats': [
            {
                'type_stock': s[0],
                'total_quantite': s[1] or 0,
                'nombre_articles': s[2]
            } for s in stats
        ],
        'stats_by_equipment': list(breakdown_map.values()),
        'stats_by_activite': list(activite_map.values()),
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
    headers = [
        'Name',
        'Operating System - Name',
        'Operating System - Version',
        'Type',
        'Model',
        'Manufacturer',
        'Processeur',
        'N° de Série',
        'RAM',
        'Disque Dur',
        'Activité',
        'Quantité',
        'État',
    ]

    rows = [[
        item.nom_equipement or '',
        item.systeme or '',
        item.os_version or '',
        item.type_equipement or '',
        item.stockage or '',
        item.manufacturer or '',
        item.processeur or '',
        item.numero_serie or '',
        item.ram or '',
        item.disque_dur or '',
        item.activite or item.type_stock or '',
        item.quantite,
        item.etat or '',
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
        'alternate_username': item.alternate_username,
        'systeme': item.systeme,
        'os_version': item.os_version,
        'stockage': item.stockage,
        'manufacturer': item.manufacturer,
        'processeur': item.processeur,
        'numero_serie': item.numero_serie,
        'ram': item.ram,
        'disque_dur': item.disque_dur,
        'emplacement': item.emplacement,
        'activite': item.activite,
        'service': item.service,
        'date_creation': item.date_creation.isoformat(),
        'date_modification': item.date_modification.isoformat()
    }
