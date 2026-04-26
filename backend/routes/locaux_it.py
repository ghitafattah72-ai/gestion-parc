from flask import Blueprint, jsonify, request
from models import db, LocalIT, BaieIT, MaterielIT
from datetime import datetime
from decorators import check_permission
from export_utils import export_to_csv, export_to_excel, export_to_excel_sheets, get_export_filename
import pandas as pd

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
            'message': 'Local IT ajouté avec succès',
            'local': local_to_dict(new_item)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'ajout du local IT : {str(e)}"}), 400

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
            'message': 'Local IT modifié avec succès',
            'local': local_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la modification du local IT : {str(e)}"}), 400

# DELETE local IT
@locaux_it_bp.route('/<int:id>', methods=['DELETE'])
def delete_local_it(id):
    item = LocalIT.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Local IT supprimé avec succès'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression du local IT : {str(e)}"}), 400

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
            'message': f'{created} local(aux) IT par défaut créé(s)',
            'created': created
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'initialisation des locaux IT : {str(e)}"}), 400

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
            'message': f'{created} baie(s) IT par défaut créée(s)',
            'created': created
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'initialisation des baies IT : {str(e)}"}), 400

# ========== ROUTES BAIES IT  ==========

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
            'message': 'Baie IT ajoutée avec succès',
            'baie': baie_to_dict(new_baie)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'ajout de la baie IT : {str(e)}"}), 400

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
            'message': 'Baie IT modifiée avec succès',
            'baie': baie_to_dict(item)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la modification de la baie IT : {str(e)}"}), 400

# DELETE baie
@locaux_it_bp.route('/baies/<int:id>', methods=['DELETE'])
def delete_baie(id):
    item = BaieIT.query.get_or_404(id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Baie IT supprimée avec succès'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression de la baie IT : {str(e)}"}), 400

def local_to_dict(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'localisation': item.localisation,
        'date_creation': item.date_creation.isoformat() if item.date_creation else None,
        'date_modification': item.date_modification.isoformat() if item.date_modification else None
    }

def local_to_dict_with_baies(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'localisation': item.localisation,
        'baies': [baie_to_dict_with_materiels(b) for b in item.baies],
        'materiels': [materiel_to_dict(m) for m in MaterielIT.query.filter_by(local_it_id=item.id, baie_id=None).all()],
        'date_creation': item.date_creation.isoformat() if item.date_creation else None,
        'date_modification': item.date_modification.isoformat() if item.date_modification else None
    }

def baie_to_dict(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'numero': item.numero,
        'local_it_id': item.local_it_id,
        'description': item.description,
        'date_creation': item.date_creation.isoformat() if item.date_creation else None,
        'date_modification': item.date_modification.isoformat() if item.date_modification else None
    }

def baie_to_dict_with_materiels(item):
    return {
        'id': item.id,
        'nom': item.nom,
        'numero': item.numero,
        'local_it_id': item.local_it_id,
        'description': item.description,
        'materiels': [materiel_to_dict(m) for m in MaterielIT.query.filter_by(baie_id=item.id).all()],
        'date_creation': item.date_creation.isoformat() if item.date_creation else None,
        'date_modification': item.date_modification.isoformat() if item.date_modification else None
    }

def materiel_to_dict(item):
    return {
        'id': item.id,
        'type_materiel': item.type_materiel,
        'uc': item.uc,
        'nom': item.nom,
        'marque': item.marque,
        'modele': item.modele,
        'version': item.version,
        'os_firmware': item.os_firmware,
        'numero_serie': item.numero_serie,
        'processeur': item.processeur,
        'ram': item.ram,
        'stockage': item.stockage,
        'stack_role': item.stack_role,
        'stack_ip': item.stack_ip,
        'mac_wifi': item.mac_wifi,
        'user_assigned': item.user_assigned,
        'id_user': item.id_user,
        'etat_materiel': item.etat_materiel,
        'date_affectation': item.date_affectation.isoformat() if item.date_affectation else None,
        'baie_port': item.baie_port,
        'mac_address': item.mac_address,
        'douchette': item.douchette,
        'lecteur_badge': item.lecteur_badge,
        'autre_materiel': item.autre_materiel,
        'description': item.description,
        'baie_id': item.baie_id,
        'local_it_id': item.local_it_id,
        'date_creation': item.date_creation.isoformat() if item.date_creation else None,
        'date_modification': item.date_modification.isoformat() if item.date_modification else None
    }


# ========== ROUTES MATERIEL IT  ==========

@locaux_it_bp.route('/materiels', methods=['POST'])
def create_materiel():
    data = request.json
    try:
        new_m = MaterielIT(
            type_materiel=data.get('type_materiel'),
            nom=data.get('nom'),
            marque=data.get('marque') or data.get('manufacturer'),
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
        return jsonify({'error': f"Erreur lors de l'ajout du matériel : {str(e)}"}), 400


@locaux_it_bp.route('/materiels/<int:id>', methods=['DELETE'])
def delete_materiel(id):
    item = MaterielIT.query.get_or_404(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Matériel supprimé'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la suppression du matériel : {str(e)}"}), 400


@locaux_it_bp.route('/materiels/<int:id>/transfer', methods=['PUT'])
def transfer_materiel(id):
    item = MaterielIT.query.get_or_404(id)
    data = request.json or {}

    target_local_id = data.get('local_it_id') or None
    target_baie_id = data.get('baie_id') or None

    try:
        if target_baie_id:
            target_baie = BaieIT.query.get(target_baie_id)
            if not target_baie:
                return jsonify({'error': 'Baie  introuvable'}), 404
            if item.baie_id == target_baie.id:
                return jsonify({'error': 'Ce matériel est déjà dans cette baie'}), 400

            item.baie_id = target_baie.id
            item.local_it_id = None
        elif target_local_id:
            target_local = LocalIT.query.get(target_local_id)
            if not target_local:
                return jsonify({'error': 'Local  introuvable'}), 404
            if item.baie_id is None and item.local_it_id == target_local.id:
                return jsonify({'error': 'Ce matériel est déjà dans ce local'}), 400

            item.local_it_id = target_local.id
            item.baie_id = None
        else:
            return jsonify({'error': 'Choisissez un local ou une baie '}), 400

        item.date_modification = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Matériel transféré', 'materiel': materiel_to_dict(item)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors du transfert du matériel : {str(e)}"}), 400


# ========== ROUTES IMPORT/EXPORT MATERIELS IT  ==========

MATERIEL_IT_TEMPLATE_HEADERS = [
    'UC',
    'Nomination',
    'Marque',
    'Systèmes d\'exploitation',
    'Version',
    'Modèle',
    'Processeur',
    'RAM',
    'Stockage',
    'Adresse IP',
    'Adresse MAC Wi-Fi',
    'Utilisateur Assigné',
    'ID_User',
    'État du Matériel',
    'Date d\'affectation',
    'Commentaire',
    'BAIE\\PORT',
    'Adresse MAC',
    'Douchette',
    'Lecteur de Badge',
    'Autre matériel',
]

@locaux_it_bp.route('/materiels/import-template', methods=['GET'])
@check_permission('import')
def export_materiel_import_template():
    format_type = (request.args.get('format', 'xlsx') or 'xlsx').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Format invalide. Utilisez csv ou xlsx'}), 400

    filename = get_export_filename('materiel_it_import_template', format_type)
    if format_type == 'xlsx':
        return export_to_excel(MATERIEL_IT_TEMPLATE_HEADERS, [], filename, sheet_name='Template_Materiel')
    return export_to_csv(MATERIEL_IT_TEMPLATE_HEADERS, [], filename)


@locaux_it_bp.route('/materiels/import', methods=['POST'])
@check_permission('import')
def import_materiel_it():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400

        import pandas as pd
        filename = (file.filename or '').lower()
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Format de fichier non pris en charge'}), 400

        imported_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                nom = (row.get('Nomination') or '').strip()
                type_materiel = (row.get('Marque') or 'autre').strip()
                
                if not nom:
                    errors.append(f'Ligne {index + 1} : le champ Nomination est obligatoire')
                    continue

                uc = (row.get('UC') or '').strip() or None
                marque = (row.get('Marque') or '').strip() or None
                systeme = (row.get('Systèmes d\'exploitation') or '').strip() or None
                version = (row.get('Version') or '').strip() or None
                modele = (row.get('Modèle') or '').strip() or None
                processeur = (row.get('Processeur') or '').strip() or None
                ram = (row.get('RAM') or '').strip() or None
                stockage = (row.get('Stockage') or '').strip() or None
                ip = (row.get('Adresse IP') or '').strip() or None
                mac_wifi = (row.get('Adresse MAC Wi-Fi') or '').strip() or None
                user_assigned = (row.get('Utilisateur Assigné') or '').strip() or None
                id_user = (row.get('ID_User') or '').strip() or None
                etat = (row.get('État du Matériel') or '').strip() or None
                date_aff_str = row.get('Date d\'affectation')
                date_aff = None
                if date_aff_str:
                    try:
                        date_aff = pd.to_datetime(date_aff_str).to_pydatetime()
                    except:
                        pass
                commentaire = (row.get('Commentaire') or '').strip() or None
                baie_port = (row.get('BAIE\\PORT') or '').strip() or None
                mac_addr = (row.get('Adresse MAC') or '').strip() or None
                douchette = (row.get('Douchette') or '').strip() or None
                lecteur = (row.get('Lecteur de Badge') or '').strip() or None
                autre = (row.get('Autre matériel') or '').strip() or None

                new_materiel = MaterielIT(
                    uc=uc,
                    nom=nom,
                    marque=marque,
                    type_materiel=type_materiel,
                    os_firmware=systeme,
                    version=version,
                    modele=modele,
                    processeur=processeur,
                    ram=ram,
                    stockage=stockage,
                    stack_ip=ip,
                    mac_wifi=mac_wifi,
                    user_assigned=user_assigned,
                    id_user=id_user,
                    etat_materiel=etat,
                    date_affectation=date_aff,
                    description=commentaire,
                    baie_port=baie_port,
                    mac_address=mac_addr,
                    douchette=douchette,
                    lecteur_badge=lecteur,
                    autre_materiel=autre,
                )
                db.session.add(new_materiel)
                imported_count += 1
            except Exception as e:
                errors.append(f'Ligne {index + 1} : {str(e)}')

        db.session.commit()
        return jsonify({
            'message': f'{imported_count} matériel(s) importé(s) avec succès',
            'imported_count': imported_count,
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'import des matériels IT : {str(e)}"}), 400


# ========== ROUTES EXPORT  ==========

@locaux_it_bp.route('/export', methods=['GET'])
@check_permission('export')
def export_locaux_it():
    format_type = (request.args.get('format', 'csv') or 'csv').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Format invalide'}), 400

    items = LocalIT.query.order_by(LocalIT.nom.asc()).all()

    headers = ['Nom Local', 'Nombre Baies', 'Matériels']
    rows = [
        [
            item.nom,
            BaieIT.query.filter_by(local_it_id=item.id).count(),
            MaterielIT.query.filter_by(local_it_id=item.id, baie_id=None).count(),
        ]
        for item in items
    ]

    local_name_by_id = {local.id: local.nom for local in items}
    baies = BaieIT.query.order_by(BaieIT.id.asc()).all()
    baie_by_id = {baie.id: baie for baie in baies}

    materiels = MaterielIT.query.order_by(MaterielIT.id.asc()).all()
    materiel_headers = ['Type', 'Nom Matériel', 'Modèle', 'N° Série', 'Local']
    materiel_rows = []
    for m in materiels:
        baie = baie_by_id.get(m.baie_id) if m.baie_id else None
        local_name = ''
        baie_name = ''

        if baie:
            baie_name = baie.nom or ''
            local_name = local_name_by_id.get(baie.local_it_id, '')
        elif m.local_it_id:
            local_name = local_name_by_id.get(m.local_it_id, '')

        if not local_name:
            continue

        materiel_rows.append([
            m.type_materiel or '',
            m.nom or '',
            m.modele or '',
            m.numero_serie or '',
            local_name,
        ])

    filename = get_export_filename('locaux_it', format_type)
    if format_type == 'xlsx':
        return export_to_excel_sheets([
            {
                'sheet_name': 'Locaux_IT',
                'headers': headers,
                'rows': rows,
            },
            {
                'sheet_name': 'Materiels_Locaux',
                'headers': materiel_headers,
                'rows': materiel_rows,
            },
        ], filename)
    return export_to_csv(headers, rows, filename)


@locaux_it_bp.route('/baies/export', methods=['GET'])
@check_permission('export')
def export_baies_it():
    format_type = (request.args.get('format', 'csv') or 'csv').lower()
    if format_type not in ['csv', 'xlsx']:
        return jsonify({'error': 'Format invalide. Utilisez csv ou xlsx'}), 400

    items = BaieIT.query.order_by(BaieIT.local_it_id.asc(), BaieIT.nom.asc()).all()

    headers = ['Nom Baie', 'Local IT', 'Description', 'Matériels']
    rows = [
        [
            item.nom,
            item.local_it.nom if item.local_it else '',
            item.description or '',
            MaterielIT.query.filter_by(baie_id=item.id).count(),
        ]
        for item in items
    ]

    materiels = MaterielIT.query.filter(MaterielIT.baie_id.isnot(None)).order_by(MaterielIT.baie_id.asc(), MaterielIT.id.asc()).all()
    materiel_headers = ['Type', 'Nom Matériel', 'Modèle', 'N° Série', 'Baie', 'Local']
    materiel_rows = [
        [
            m.type_materiel or '',
            m.nom or '',
            m.modele or '',
            m.numero_serie or '',
            m.baie.nom if m.baie else '',
            m.baie.local_it.nom if m.baie and m.baie.local_it else '',
        ]
        for m in materiels
    ]

    filename = get_export_filename('baies_it', format_type)
    if format_type == 'xlsx':
        return export_to_excel_sheets([
            {
                'sheet_name': 'Baies_IT',
                'headers': headers,
                'rows': rows,
            },
            {
                'sheet_name': 'Materiels_Baies',
                'headers': materiel_headers,
                'rows': materiel_rows,
            },
        ], filename)
    return export_to_csv(headers, rows, filename)
