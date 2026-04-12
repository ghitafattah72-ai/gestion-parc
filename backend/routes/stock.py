from flask import Blueprint, jsonify, request
from models import db, Stock, Mouvement
from datetime import datetime
import csv
import io
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur

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
@jwt_required()
def export_stock():
    current_user_id = get_jwt_identity()
    current_user = Utilisateur.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Check export permission
    if not current_user.permission_export:
        return jsonify({'message': 'Vous n\'avez pas la permission d\'exporter des données'}), 403
    
    format_type = request.args.get('format', 'csv')
    type_stock = request.args.get('type_stock', None)
    
    query = Stock.query
    if type_stock:
        query = query.filter_by(type_stock=type_stock)
    
    items = query.all()
    
    if format_type == 'xlsx':
        # Export to Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Stock"
        
        # Header
        headers = ['ID', 'Nom', 'Type Équipement', 'Quantité', 'Type Stock', 'État', 
                   'RAM', 'Stockage', 'Processeur', 'N° Série', 'Activité', 'Système', 'Accessoires']
        ws.append(headers)
        
        # Data
        for item in items:
            ws.append([
                item.id, item.nom_equipement, item.type_equipement, item.quantite,
                item.type_stock, item.etat, item.ram or '', item.stockage or '',
                item.processeur or '', item.numero_serie or '', item.activite or '',
                item.systeme or '', item.accessoires or ''
            ])
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        from flask import send_file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'stock_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    else:
        # Export to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['ID', 'Nom', 'Type Équipement', 'Quantité', 'Type Stock', 'État',
                        'RAM', 'Stockage', 'Processeur', 'N° Série', 'Activité', 'Système', 'Accessoires'])
        
        for item in items:
            writer.writerow([
                item.id, item.nom_equipement, item.type_equipement, item.quantite,
                item.type_stock, item.etat, item.ram or '', item.stockage or '',
                item.processeur or '', item.numero_serie or '', item.activite or '',
                item.systeme or '', item.accessoires or ''
            ])
        
        from flask import send_file
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'stock_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )

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
