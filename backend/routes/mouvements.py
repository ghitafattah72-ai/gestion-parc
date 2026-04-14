from datetime import datetime
from flask import Blueprint, jsonify, request

from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, get_export_filename
from models import db, Mouvement, MouvementHistorique, Stock

mouvements_bp = Blueprint('mouvements', __name__, url_prefix='/api/mouvements')


def _normalize_mouvement_type(raw_value):
    value = (raw_value or '').strip().lower()
    if value in ['entrée', 'entree']:
        return 'entrée'
    if value == 'sortie':
        return 'sortie'
    return None


def _parse_affectation_date(date_value):
    if not date_value:
        return None
    return datetime.strptime(date_value, '%Y-%m-%d')


def _to_positive_int(raw_value):
    value = int(raw_value)
    return value if value > 0 else None

# GET all movements
@mouvements_bp.route('/', methods=['GET'])
def get_mouvements():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    type_mouvement = request.args.get('type_mouvement', None)
    search = request.args.get('search', '')
    
    query = Mouvement.query
    
    if type_mouvement:
        normalized = _normalize_mouvement_type(type_mouvement)
        if normalized:
            query = query.filter_by(type_mouvement=normalized)
    
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
    data = request.json or {}
    
    try:
        type_mouvement = _normalize_mouvement_type(data.get('type_mouvement'))
        if not type_mouvement:
            return jsonify({'error': 'Type mouvement invalide. Utiliser Entrée ou Sortie'}), 400

        nom_equipement = (data.get('nom_equipement') or '').strip()
        type_equipement = (data.get('type_equipement') or '').strip()
        type_stock = (data.get('type_stock') or '').strip()
        quantite = _to_positive_int(data.get('quantite', 0))
        model_equipement = (data.get('model_equipement') or '').strip()
        numero_serie = (data.get('numero_serie') or '').strip()
        activite = (data.get('activite') or '').strip()
        description = (data.get('description') or '').strip()

        if not nom_equipement or not type_equipement or not type_stock or not quantite:
            return jsonify({'error': 'Veuillez remplir nom, type matériel, quantité et type stock'}), 400

        source_entree = None
        date_mouvement = datetime.utcnow()

        if type_mouvement == 'entrée':
            source_entree = (data.get('source_entree') or '').strip().lower()
            if source_entree not in ['parc', 'achat']:
                return jsonify({'error': 'Pour une entrée, la source doit être Parc ou Achat'}), 400

            date_affectation = data.get('date_affectation')
            try:
                parsed_date = _parse_affectation_date(date_affectation)
            except ValueError:
                return jsonify({'error': 'Date affectation invalide (format YYYY-MM-DD)'}), 400

            if not parsed_date:
                return jsonify({'error': 'Date affectation obligatoire pour une entrée'}), 400
            date_mouvement = parsed_date

        if type_mouvement == 'sortie' and not activite:
            return jsonify({'error': 'Activité obligatoire pour une sortie'}), 400

        new_mouvement = Mouvement(
            type_mouvement=type_mouvement,
            nom_equipement=nom_equipement,
            type_equipement=type_equipement,
            quantite=quantite,
            type_stock=type_stock,
            local_it_destination=source_entree,
            baie_destination=None,
            stockage=model_equipement,
            numero_serie=numero_serie,
            activite=activite if type_mouvement == 'sortie' else None,
            description=description,
            date_mouvement=date_mouvement,
        )

        db.session.add(new_mouvement)
        db.session.flush()

        stock_item = Stock.query.filter_by(
            nom_equipement=nom_equipement,
            type_stock=type_stock,
        ).first()

        if type_mouvement == 'entrée':
            if stock_item:
                stock_item.quantite += quantite
                stock_item.type_equipement = type_equipement
                stock_item.stockage = model_equipement or stock_item.stockage
                stock_item.numero_serie = numero_serie or stock_item.numero_serie
                stock_item.date_modification = datetime.utcnow()
            else:
                stock_item = Stock(
                    nom_equipement=nom_equipement,
                    type_equipement=type_equipement,
                    quantite=quantite,
                    type_stock=type_stock,
                    etat='nouveau',
                    stockage=model_equipement,
                    numero_serie=numero_serie,
                )
                db.session.add(stock_item)

        if type_mouvement == 'sortie':
            if not stock_item:
                db.session.rollback()
                return jsonify({'error': 'Aucun stock trouvé pour cette sortie'}), 400
            if stock_item.quantite < quantite:
                db.session.rollback()
                return jsonify({'error': 'Quantité insuffisante dans le stock'}), 400

            stock_item.quantite -= quantite
            stock_item.activite = activite
            stock_item.date_modification = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Movement created successfully',
            'mouvement': mouvement_to_dict(new_mouvement),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE movement
@mouvements_bp.route('/<int:id>', methods=['DELETE'])
def delete_mouvement(id):
    item = Mouvement.query.get_or_404(id)
    
    try:
        historique = MouvementHistorique(
            mouvement_id_original=item.id,
            nom_equipement=item.nom_equipement,
            type_equipement=item.type_equipement,
            type_mouvement=item.type_mouvement,
            quantite=item.quantite,
            type_stock=item.type_stock,
            local_it_destination=item.local_it_destination,
            baie_destination=item.baie_destination,
            model_equipement=item.stockage,
            numero_serie=item.numero_serie,
            activite=item.activite,
            description=item.description,
            date_mouvement_originale=item.date_mouvement,
        )
        db.session.add(historique)

        stock_item = Stock.query.filter_by(
            nom_equipement=item.nom_equipement,
            type_stock=item.type_stock,
        ).first()

        if stock_item:
            if item.type_mouvement == 'entrée':
                stock_item.quantite = max(0, stock_item.quantite - item.quantite)
            elif item.type_mouvement == 'sortie':
                stock_item.quantite += item.quantite
            stock_item.date_modification = datetime.utcnow()

        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Movement deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@mouvements_bp.route('/historique', methods=['GET'])
def get_historique_mouvements_supprimes():
    items = MouvementHistorique.query.order_by(MouvementHistorique.date_suppression.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'mouvement_id_original': item.mouvement_id_original,
            'nom_equipement': item.nom_equipement,
            'type_equipement': item.type_equipement,
            'type_mouvement': item.type_mouvement,
            'quantite': item.quantite,
            'type_stock': item.type_stock,
            'source_entree': item.local_it_destination,
            'model_equipement': item.model_equipement,
            'numero_serie': item.numero_serie,
            'activite': item.activite,
            'description': item.description,
            'date_mouvement_originale': item.date_mouvement_originale.isoformat() if item.date_mouvement_originale else None,
            'date_suppression': item.date_suppression.isoformat() if item.date_suppression else None,
        }
        for item in items
    ])

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
@check_permission('export')
def export_mouvements():
    format_type = request.args.get('format', 'csv')
    items = Mouvement.query.order_by(Mouvement.date_mouvement.desc()).all()
    
    # Prepare headers
    headers = [
        'ID', 'Type Mouvement', 'Équipement', 'Type Matériel', 'Model', 'N° Série',
        'Quantité', 'Type Stock', 'Source Entrée', 'Activité', 'Description', 'Date'
    ]
    
    # Prepare data rows
    rows = [[
        item.id,
        item.type_mouvement,
        item.nom_equipement,
        item.type_equipement,
        item.stockage or '',
        item.numero_serie or '',
        item.quantite,
        item.type_stock,
        item.local_it_destination or '',
        item.activite or '',
        item.description or '',
        item.date_mouvement.isoformat(),
    ] for item in items]
    
    # Generate filename
    filename = get_export_filename('mouvements', format_type)
    
    # Export to requested format
    if format_type == 'xlsx':
        return export_to_excel(headers, rows, filename, sheet_name='Mouvements')
    else:
        return export_to_csv(headers, rows, filename)

def mouvement_to_dict(item):
    return {
        'id': item.id,
        'type_mouvement': item.type_mouvement,
        'nom_equipement': item.nom_equipement,
        'type_equipement': item.type_equipement,
        'model_equipement': item.stockage,
        'quantite': item.quantite,
        'type_stock': item.type_stock,
        'source_entree': item.local_it_destination,
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
        'date_affectation': item.date_mouvement.isoformat() if item.type_mouvement == 'entrée' else None,
        'date_mouvement': item.date_mouvement.isoformat()
    }
