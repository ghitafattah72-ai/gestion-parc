from flask import Blueprint, jsonify, request
from models import db, Mouvement, Stock, EquipementBaie, BaieIT, LocalIT
from datetime import datetime
import csv
import io
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Utilisateur

mouvements_bp = Blueprint('mouvements', __name__, url_prefix='/api/mouvements')

# GET all movements
@mouvements_bp.route('/', methods=['GET'])
def get_mouvements():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    type_mouvement = request.args.get('type_mouvement', None)
    search = request.args.get('search', '')
    
    query = Mouvement.query
    
    if type_mouvement:
        query = query.filter_by(type_mouvement=type_mouvement)
    
    if search:
        query = query.filter(Mouvement.nom_equipement.ilike(f'%{search}%'))
    
    items = query.order_by(Mouvement.date_mouvement.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [mouvement_to_dict(item) for item in items.items],
        'total': items.total,
        'pages': items.pages,
        'current_page': page
    })

# GET single movement
@mouvements_bp.route('/<int:id>', methods=['GET'])
def get_mouvement(id):
    item = Mouvement.query.get_or_404(id)
    return jsonify(mouvement_to_dict(item))

# POST new movement (Transfer from stock to local IT)
@mouvements_bp.route('/', methods=['POST'])
def create_mouvement():
    data = request.json
    
    try:
        equipment_types_with_details = ['pc portable', 'pc fixe']
        
        new_mouvement = Mouvement(
            type_mouvement=data.get('type_mouvement', 'transfert'),
            nom_equipement=data.get('nom_equipement'),
            type_equipement=data.get('type_equipement'),
            quantite=data.get('quantite'),
            type_stock=data.get('type_stock'),
            local_it_destination=data.get('local_it_destination'),
            baie_destination=data.get('baie_destination'),
            description=data.get('description')
        )
        
        # Add detailed info if PC type
        if data.get('type_equipement') in equipment_types_with_details:
            new_mouvement.ram = data.get('ram')
            new_mouvement.stockage = data.get('stockage')
            new_mouvement.processeur = data.get('processeur')
            new_mouvement.numero_serie = data.get('numero_serie')
            new_mouvement.activite = data.get('activite')
            new_mouvement.systeme = data.get('systeme')
            new_mouvement.accessoires = data.get('accessoires')
        
        db.session.add(new_mouvement)
        db.session.flush()  # Get the ID
        
        # Update stock quantity
        stock_item = Stock.query.filter_by(
            nom_equipement=data.get('nom_equipement'),
            type_stock=data.get('type_stock')
        ).first()
        
        if stock_item:
            stock_item.quantite -= data.get('quantite', 0)
            stock_item.date_modification = datetime.utcnow()
        
        # Add to baie if specified
        if data.get('baie_destination') and data.get('local_it_destination'):
            # Find the local IT first
            local_it = LocalIT.query.filter_by(nom=data.get('local_it_destination')).first()
            if local_it:
                baie = BaieIT.query.filter_by(nom=data.get('baie_destination'), local_it_id=local_it.id).first()
                if baie:
                    equipement_baie = EquipementBaie(
                        baie_id=baie.id,
                        mouvement_id=new_mouvement.id,
                        quantite=data.get('quantite', 0)
                    )
                    db.session.add(equipement_baie)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Movement created successfully',
            'mouvement': mouvement_to_dict(new_mouvement)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE movement
@mouvements_bp.route('/<int:id>', methods=['DELETE'])
def delete_mouvement(id):
    item = Mouvement.query.get_or_404(id)
    
    try:
        # Restore stock quantity
        stock_item = Stock.query.filter_by(
            nom_equipement=item.nom_equipement,
            type_stock=item.type_stock
        ).first()
        
        if stock_item:
            stock_item.quantite += item.quantite
            stock_item.date_modification = datetime.utcnow()
        
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Movement deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# GET movement statistics
@mouvements_bp.route('/stats', methods=['GET'])
def get_stats():
    stats = db.session.query(
        Mouvement.type_mouvement,
        db.func.count(Mouvement.id).label('nombre'),
        db.func.sum(Mouvement.quantite).label('total_quantite')
    ).group_by(Mouvement.type_mouvement).all()
    
    return jsonify({
        'stats': [
            {
                'type_mouvement': s[0],
                'nombre': s[1],
                'total_quantite': s[2]
            } for s in stats
        ]
    })

# EXPORT movements to CSV/Excel
@mouvements_bp.route('/export', methods=['GET'])
@jwt_required()
def export_mouvements():
    current_user_id = get_jwt_identity()
    current_user = Utilisateur.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Check export permission
    if not current_user.permission_export:
        return jsonify({'message': 'Vous n\'avez pas la permission d\'exporter des données'}), 403
    
    format_type = request.args.get('format', 'csv')
    
    items = Mouvement.query.order_by(Mouvement.date_mouvement.desc()).all()
    
    if format_type == 'xlsx':
        # Export to Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Mouvements"
        
        headers = ['ID', 'Type', 'Équipement', 'Type Équipement', 'Quantité', 'Type Stock',
                   'Local IT Destination', 'Baie Destination', 'RAM', 'Stockage', 'Processeur',
                   'N° Série', 'Activité', 'Système', 'Accessoires', 'Date']
        ws.append(headers)
        
        for item in items:
            ws.append([
                item.id, item.type_mouvement, item.nom_equipement, item.type_equipement,
                item.quantite, item.type_stock, item.local_it_destination or '',
                item.baie_destination or '', item.ram or '', item.stockage or '',
                item.processeur or '', item.numero_serie or '', item.activite or '',
                item.systeme or '', item.accessoires or '', item.date_mouvement.isoformat()
            ])
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        from flask import send_file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'mouvements_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    else:
        # Export to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['ID', 'Type', 'Équipement', 'Type Équipement', 'Quantité', 'Type Stock',
                        'Local IT Destination', 'Baie Destination', 'RAM', 'Stockage', 'Processeur',
                        'N° Série', 'Activité', 'Système', 'Accessoires', 'Date'])
        
        for item in items:
            writer.writerow([
                item.id, item.type_mouvement, item.nom_equipement, item.type_equipement,
                item.quantite, item.type_stock, item.local_it_destination or '',
                item.baie_destination or '', item.ram or '', item.stockage or '',
                item.processeur or '', item.numero_serie or '', item.activite or '',
                item.systeme or '', item.accessoires or '', item.date_mouvement.isoformat()
            ])
        
        from flask import send_file
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'mouvements_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )

def mouvement_to_dict(item):
    return {
        'id': item.id,
        'type_mouvement': item.type_mouvement,
        'nom_equipement': item.nom_equipement,
        'type_equipement': item.type_equipement,
        'quantite': item.quantite,
        'type_stock': item.type_stock,
        'local_it_destination': item.local_it_destination,
        'baie_destination': item.baie_destination,
        'ram': item.ram,
        'stockage': item.stockage,
        'processeur': item.processeur,
        'numero_serie': item.numero_serie,
        'activite': item.activite,
        'systeme': item.systeme,
        'accessoires': item.accessoires,
        'description': item.description,
        'date_mouvement': item.date_mouvement.isoformat()
    }
