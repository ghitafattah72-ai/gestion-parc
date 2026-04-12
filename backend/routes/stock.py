from flask import Blueprint, jsonify, request
from models import db, Stock, Mouvement
from datetime import datetime
import csv
import io
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur
from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, get_export_filename

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

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
        equipment_types_with_details = ['pc portable', 'pc fixe']
        
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

# GET stock statistics
@stock_bp.route('/stats', methods=['GET'])
def get_stats():
    stats = db.session.query(
        Stock.type_stock,
        db.func.sum(Stock.quantite).label('total_quantite'),
        db.func.count(Stock.id).label('nombre_articles')
    ).group_by(Stock.type_stock).all()
    
    return jsonify({
        'stats': [
            {
                'type_stock': s[0],
                'total_quantite': s[1] or 0,
                'nombre_articles': s[2]
            } for s in stats
        ]
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
