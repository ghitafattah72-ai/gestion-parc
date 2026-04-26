from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, get_export_filename
from models import db, Mouvement, MouvementHistorique, Stock, Parc, Utilisateur

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


def _to_int(raw_value):
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return None


def _require_admin_user():
    try:
        current_user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

    current_user = Utilisateur.query.get(current_user_id)
    if not current_user:
        return None

    if (current_user.role or '').strip().lower() != 'admin':
        return False

    return current_user

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


@mouvements_bp.route('/dechets', methods=['GET'])
def get_dechets():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = (request.args.get('search') or '').strip()

    query = Mouvement.query.filter(
        Mouvement.type_mouvement == 'sortie',
        db.func.lower(Mouvement.local_it_destination) == 'dechet',
    )

    if search:
        term = f'%{search}%'
        query = query.filter(
            Mouvement.nom_equipement.ilike(term)
            | Mouvement.type_equipement.ilike(term)
            | Mouvement.numero_serie.ilike(term)
            | Mouvement.type_stock.ilike(term)
        )

    items = query.order_by(Mouvement.date_mouvement.desc()).paginate(page=page, per_page=per_page)

    return jsonify({
        'items': [mouvement_to_dict(item) for item in items.items],
        'total': items.total,
        'pages': items.pages,
        'current_page': page,
    })

# GET single movement
@mouvements_bp.route('/<int:id>', methods=['GET'])
def get_mouvement(id):
    item = Mouvement.query.get_or_404(id)
    return jsonify(mouvement_to_dict(item))


@mouvements_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_mouvement(id):
    admin_user = _require_admin_user()
    if admin_user is None:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401
    if admin_user is False:
        return jsonify({'error': 'Autorisation refusée'}), 403

    item = Mouvement.query.get_or_404(id)
    data = request.json or {}

    try:
        updated_type_mouvement = item.type_mouvement

        if 'type_mouvement' in data:
            normalized = _normalize_mouvement_type(data.get('type_mouvement'))
            if not normalized:
                return jsonify({'error': 'Type mouvement invalide. Utiliser Entrée ou Sortie'}), 400
            updated_type_mouvement = normalized
            item.type_mouvement = normalized

        if 'nom_equipement' in data:
            item.nom_equipement = (data.get('nom_equipement') or '').strip()

        if 'type_equipement' in data:
            item.type_equipement = (data.get('type_equipement') or '').strip()

        if 'quantite' in data:
            quantite = _to_positive_int(data.get('quantite'))
            if not quantite:
                return jsonify({'error': 'Quantité invalide'}), 400
            item.quantite = quantite

        if 'type_stock' in data:
            item.type_stock = (data.get('type_stock') or '').strip()

        if 'source_entree' in data:
            item.local_it_destination = (data.get('source_entree') or '').strip() or None

        if 'local_it_destination' in data:
            item.local_it_destination = (data.get('local_it_destination') or '').strip() or None

        if 'baie_destination' in data:
            item.baie_destination = (data.get('baie_destination') or '').strip() or None

        if 'model_equipement' in data:
            item.stockage = (data.get('model_equipement') or '').strip() or None

        if 'ram' in data:
            item.ram = (data.get('ram') or '').strip() or None

        if 'processeur' in data:
            item.processeur = (data.get('processeur') or '').strip() or None

        if 'numero_serie' in data:
            item.numero_serie = (data.get('numero_serie') or '').strip() or None

        if 'activite' in data:
            new_activite = (data.get('activite') or '').strip()
            item.activite = new_activite or None

        if 'systeme' in data:
            item.systeme = (data.get('systeme') or '').strip() or None

        if 'accessoires' in data:
            item.accessoires = (data.get('accessoires') or '').strip() or None

        if 'description' in data:
            new_description = (data.get('description') or '').strip()
            item.description = new_description or None

        if 'date_affectation' in data:
            date_affectation = data.get('date_affectation')
            try:
                parsed_date = _parse_affectation_date(date_affectation)
            except ValueError:
                return jsonify({'error': 'Date affectation invalide (format YYYY-MM-DD)'}), 400
            item.date_mouvement = parsed_date or item.date_mouvement

        if 'date_mouvement' in data:
            date_mouvement_raw = data.get('date_mouvement')
            try:
                item.date_mouvement = datetime.fromisoformat(date_mouvement_raw)
            except (TypeError, ValueError):
                return jsonify({'error': 'Date mouvement invalide'}), 400

        if not item.nom_equipement or not item.type_equipement or not item.type_stock:
            return jsonify({'error': 'Nom, type équipement et type stock sont obligatoires'}), 400

        if updated_type_mouvement == 'sortie' and not (item.activite or '').strip():
            return jsonify({'error': 'Activité obligatoire pour une sortie'}), 400

        db.session.commit()
        return jsonify({
            'message': 'Mouvement modifié avec succès',
            'mouvement': mouvement_to_dict(item),
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la modification du mouvement : {str(e)}"}), 400


@mouvements_bp.route('/sources/stock', methods=['GET'])
def get_stock_sources():
    type_equipement = (request.args.get('type_equipement') or '').strip().lower()
    if type_equipement in ['undefined', 'null', 'none']:
        type_equipement = ''
    search = (request.args.get('search') or '').strip()

    query = Stock.query.filter(Stock.quantite > 0)

    if type_equipement:
        query = query.filter(db.func.lower(Stock.type_equipement) == type_equipement)

    if search:
        term = f'%{search}%'
        query = query.filter(
            Stock.nom_equipement.ilike(term)
            | Stock.numero_serie.ilike(term)
            | Stock.type_stock.ilike(term)
            | Stock.type_equipement.ilike(term)
        )

    items = query.order_by(Stock.nom_equipement.asc(), Stock.type_stock.asc()).all()

    return jsonify([
        {
            'id': item.id,
            'nom_equipement': item.nom_equipement,
            'type_equipement': item.type_equipement,
            'type_stock': item.type_stock,
            'quantite': item.quantite,
            'etat': item.etat,
            'model_equipement': item.stockage,
            'numero_serie': item.numero_serie,
            'ram': item.ram,
            'processeur': item.processeur,
            'systeme': item.systeme,
            'os_version': item.os_version,
            'manufacturer': item.manufacturer,
            'disque_dur': item.disque_dur,
            'accessoires': item.accessoires,
            'activite': item.activite,
        }
        for item in items
    ])


@mouvements_bp.route('/sources/parc', methods=['GET'])
def get_parc_sources():
    type_equipement = (request.args.get('type_equipement') or '').strip().lower()
    if type_equipement in ['undefined', 'null', 'none']:
        type_equipement = ''
    search = (request.args.get('search') or '').strip()

    query = Parc.query

    if type_equipement:
        query = query.filter(db.func.lower(Parc.type) == type_equipement)

    if search:
        term = f'%{search}%'
        query = query.filter(
            Parc.name.ilike(term)
            | Parc.numero_serie.ilike(term)
            | Parc.model.ilike(term)
            | Parc.type.ilike(term)
        )

    items = query.order_by(Parc.name.asc()).all()

    return jsonify([
        {
            'id': item.id,
            'nom_equipement': item.name,
            'type_equipement': item.type,
            'model_equipement': item.model,
            'numero_serie': item.numero_serie,
            'ram': item.ram,
            'processeur': item.processeur,
            'systeme': item.os_name,
            'os_version': item.os_version,
            'alternate_username': item.alternate_username,
            'manufacturer': item.manufacturer,
            'disque_dur': item.disque_dur,
            'emplacement': item.emplacement,
            'service': item.service,
            'quantite': item.quantite,
            'accessoires': None,
            'activite': item.activite,
        }
        for item in items
    ])

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
        etat = (data.get('etat') or 'nouveau').strip() or 'nouveau'
        ram = (data.get('ram') or '').strip()
        processeur = (data.get('processeur') or '').strip()
        systeme = (data.get('systeme') or '').strip()
        activite = (data.get('activite') or '').strip()
        alternate_username = (data.get('alternate_username') or '').strip()
        os_version = (data.get('os_version') or '').strip()
        manufacturer = (data.get('manufacturer') or '').strip()
        disque_dur = (data.get('disque_dur') or '').strip()
        emplacement = (data.get('emplacement') or '').strip()
        service = (data.get('service') or '').strip()
        description = (data.get('description') or '').strip()
        stock_item_id = _to_int(data.get('stock_item_id'))
        parc_item_id = _to_int(data.get('parc_item_id'))
        sortie_mode = (data.get('sortie_mode') or 'vers_parc').strip().lower()

        if not quantite and not (type_mouvement == 'sortie' and sortie_mode == 'dechet'):
            return jsonify({'error': 'Quantité invalide'}), 400

        source_entree = None
        date_mouvement = datetime.utcnow()
        stock_item = None
        parc_item = None

        if type_mouvement == 'sortie' and sortie_mode not in ['vers_parc', 'dechet']:
            return jsonify({'error': 'Mode de sortie invalide'}), 400

        if type_mouvement == 'entrée':
            source_entree = (data.get('source_entree') or '').strip().lower()
            if source_entree not in ['parc', 'achat']:
                return jsonify({'error': 'Pour une entrée, la source doit être Parc ou Achat'}), 400

            date_affectation = data.get('date_affectation')
            try:
                parsed_date = _parse_affectation_date(date_affectation)
            except ValueError:
                return jsonify({'error': 'Date affectation invalide (format YYYY-MM-DD)'}), 400

            date_mouvement = parsed_date or datetime.utcnow()

            if source_entree == 'parc':
                if quantite != 1:
                    return jsonify({'error': 'Entrée depuis parc supporte uniquement quantité = 1'}), 400
                if not parc_item_id:
                    return jsonify({'error': 'Sélectionnez un équipement parc'}), 400

                parc_item = Parc.query.get(parc_item_id)
                if not parc_item:
                    return jsonify({'error': 'Équipement parc introuvable'}), 404

                nom_equipement = parc_item.name
                type_equipement = parc_item.type
                model_equipement = parc_item.model or ''
                numero_serie = parc_item.numero_serie or ''
                ram = parc_item.ram or ''
                processeur = parc_item.processeur or ''
                systeme = parc_item.os_name or ''
                alternate_username = parc_item.alternate_username or ''
                os_version = parc_item.os_version or ''
                manufacturer = parc_item.manufacturer or ''
                disque_dur = parc_item.disque_dur or ''
                emplacement = parc_item.emplacement or ''
                service = parc_item.service or ''
                activite = activite or (parc_item.activite or '')
                quantite = 1

                if not type_stock:
                    return jsonify({'error': 'Type stock destination obligatoire'}), 400

            if source_entree == 'achat':
                if not nom_equipement or not type_equipement or not type_stock:
                    return jsonify({'error': 'Pour achat, nom, type matériel et type stock sont obligatoires'}), 400

        if type_mouvement == 'sortie' and sortie_mode == 'vers_parc' and not activite:
            return jsonify({'error': 'Activité obligatoire pour une sortie'}), 400

        if type_mouvement == 'sortie':
            if stock_item_id:
                stock_item = Stock.query.get(stock_item_id)
            else:
                if not nom_equipement or not type_stock:
                    return jsonify({'error': 'Sélectionnez un équipement stock pour la sortie'}), 400
                stock_item = Stock.query.filter_by(
                    nom_equipement=nom_equipement,
                    type_stock=type_stock,
                ).first()

            if not stock_item:
                return jsonify({'error': 'Aucun stock trouvé pour cette sortie'}), 400

            if sortie_mode == 'dechet':
                quantite = stock_item.quantite

            if stock_item.quantite < quantite:
                return jsonify({'error': 'Quantité insuffisante dans le stock'}), 400

            nom_equipement = stock_item.nom_equipement
            type_equipement = stock_item.type_equipement
            type_stock = stock_item.type_stock
            model_equipement = model_equipement or stock_item.stockage or ''
            numero_serie = numero_serie or stock_item.numero_serie or ''
            ram = ram or stock_item.ram or ''
            processeur = processeur or stock_item.processeur or ''
            systeme = systeme or stock_item.systeme or ''
            os_version = os_version or stock_item.os_version or ''
            manufacturer = manufacturer or stock_item.manufacturer or ''
            disque_dur = disque_dur or stock_item.disque_dur or stock_item.stockage or ''
            etat = etat or stock_item.etat or 'nouveau'

        new_mouvement = Mouvement(
            type_mouvement=type_mouvement,
            nom_equipement=nom_equipement,
            type_equipement=type_equipement,
            quantite=quantite,
            type_stock=type_stock,
            local_it_destination=(sortie_mode if type_mouvement == 'sortie' else source_entree),
            baie_destination=None,
            stockage=model_equipement,
            ram=ram or None,
            processeur=processeur or None,
            numero_serie=numero_serie,
            systeme=systeme or None,
            activite=activite or None,
            description=description,
            date_mouvement=date_mouvement,
        )

        db.session.add(new_mouvement)
        db.session.flush()

        if type_mouvement == 'entrée':
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
                stock_item.ram = ram or stock_item.ram
                stock_item.processeur = processeur or stock_item.processeur
                stock_item.systeme = systeme or stock_item.systeme
                stock_item.os_version = os_version or stock_item.os_version
                stock_item.manufacturer = manufacturer or stock_item.manufacturer
                stock_item.disque_dur = disque_dur or stock_item.disque_dur
                stock_item.etat = etat or stock_item.etat
                stock_item.activite = activite or stock_item.activite
                stock_item.date_modification = datetime.utcnow()
            else:
                stock_item = Stock(
                    nom_equipement=nom_equipement,
                    type_equipement=type_equipement,
                    quantite=quantite,
                    type_stock=type_stock,
                    etat=etat or 'nouveau',
                    stockage=model_equipement,
                    numero_serie=numero_serie,
                    ram=ram or None,
                    processeur=processeur or None,
                    systeme=systeme or None,
                    os_version=os_version or None,
                    manufacturer=manufacturer or None,
                    disque_dur=disque_dur or None,
                    activite=activite or None,
                )
                db.session.add(stock_item)

            if source_entree == 'parc' and parc_item:
                db.session.delete(parc_item)

        if type_mouvement == 'sortie':
            stock_item.quantite -= quantite
            stock_item.activite = activite
            stock_item.date_modification = datetime.utcnow()

            if sortie_mode == 'vers_parc':
                parc_item = None
                if numero_serie:
                    parc_item = Parc.query.filter_by(numero_serie=numero_serie).first()

                if parc_item:
                    parc_item.name = nom_equipement
                    parc_item.alternate_username = alternate_username or parc_item.alternate_username
                    parc_item.os_name = systeme or parc_item.os_name
                    parc_item.os_version = os_version or parc_item.os_version
                    parc_item.type = type_equipement
                    parc_item.model = model_equipement or parc_item.model
                    parc_item.manufacturer = manufacturer or parc_item.manufacturer
                    parc_item.processeur = processeur or parc_item.processeur
                    parc_item.ram = ram or parc_item.ram
                    parc_item.disque_dur = disque_dur or parc_item.disque_dur or stock_item.stockage
                    parc_item.emplacement = emplacement or parc_item.emplacement
                    parc_item.service = service or parc_item.service
                    parc_item.activite = activite or parc_item.activite
                    parc_item.quantite = (parc_item.quantite or 0) + quantite
                    parc_item.date_modification = datetime.utcnow()
                else:
                    parc_item = Parc(
                        name=nom_equipement,
                        alternate_username=alternate_username or None,
                        os_name=systeme or None,
                        os_version=os_version or None,
                        type=type_equipement,
                        model=model_equipement or None,
                        manufacturer=manufacturer or None,
                        numero_serie=numero_serie or None,
                        processeur=processeur or stock_item.processeur,
                        ram=ram or stock_item.ram,
                        disque_dur=disque_dur or stock_item.disque_dur or stock_item.stockage,
                        emplacement=emplacement or None,
                        service=service or None,
                        activite=activite or None,
                        quantite=quantite,
                    )
                    db.session.add(parc_item)

        db.session.commit()

        return jsonify({
            'message': 'Mouvement créé avec succès',
            'mouvement': mouvement_to_dict(new_mouvement),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la création du mouvement : {str(e)}"}), 400

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
        return jsonify({'message': 'Mouvement supprimé avec succès'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression du mouvement : {str(e)}"}), 400


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


@mouvements_bp.route('/historique/<int:id>/restore', methods=['PUT'])
@jwt_required()
def restore_historique_mouvement(id):
    admin_user = _require_admin_user()
    if admin_user is None:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401
    if admin_user is False:
        return jsonify({'error': 'Autorisation refusée'}), 403

    item = MouvementHistorique.query.get_or_404(id)

    try:
        mouvement_restored = Mouvement(
            type_mouvement=item.type_mouvement,
            nom_equipement=item.nom_equipement,
            type_equipement=item.type_equipement,
            quantite=item.quantite,
            type_stock=item.type_stock,
            local_it_destination=item.local_it_destination,
            baie_destination=item.baie_destination,
            stockage=item.model_equipement,
            numero_serie=item.numero_serie,
            activite=item.activite,
            description=item.description,
            date_mouvement=item.date_mouvement_originale or datetime.utcnow(),
        )
        db.session.add(mouvement_restored)

        stock_item = Stock.query.filter_by(
            nom_equipement=item.nom_equipement,
            type_stock=item.type_stock,
        ).first()

        if item.type_mouvement == 'entrée':
            if stock_item:
                stock_item.quantite += item.quantite
                stock_item.date_modification = datetime.utcnow()
            else:
                stock_item = Stock(
                    nom_equipement=item.nom_equipement,
                    type_equipement=item.type_equipement,
                    quantite=item.quantite,
                    type_stock=item.type_stock,
                    etat='nouveau',
                    stockage=item.model_equipement,
                    numero_serie=item.numero_serie,
                    activite=item.activite,
                )
                db.session.add(stock_item)
        elif item.type_mouvement == 'sortie' and stock_item:
            if stock_item.quantite < item.quantite:
                db.session.rollback()
                return jsonify({'error': 'Stock insuffisant pour restaurer cette sortie'}), 400
            stock_item.quantite -= item.quantite
            stock_item.date_modification = datetime.utcnow()

        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Mouvement restauré avec succès'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@mouvements_bp.route('/historique/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_historique_mouvement(id):
    admin_user = _require_admin_user()
    if admin_user is None:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401
    if admin_user is False:
        return jsonify({'error': 'Autorisation refusée'}), 403

    item = MouvementHistorique.query.get_or_404(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Historique supprimé définitivement'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression définitive de l'historique : {str(e)}"}), 400

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
    export_scope = (request.args.get('scope') or '').strip().lower()

    query = Mouvement.query
    if export_scope == 'dechets':
        query = query.filter(
            Mouvement.type_mouvement == 'sortie',
            db.func.lower(Mouvement.local_it_destination) == 'dechet',
        )

    items = query.order_by(Mouvement.date_mouvement.desc()).all()
    
    # Prepare headers
    headers = [
        'ID', 'Type Mouvement', 'Equipement', 'Type Materiel', 'Model', 'Numero du serie',
        'Quantite', 'Type Stock', 'Source Entree', 'Activitee', 'Description', 'Date'
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
    filename_base = 'dechets' if export_scope == 'dechets' else 'mouvements'
    filename = get_export_filename(filename_base, format_type)
    
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
