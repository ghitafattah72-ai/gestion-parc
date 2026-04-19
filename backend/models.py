from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Utilisateur(db.Model):
    __tablename__ = 'utilisateurs'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='user')  # admin, user, manager
    permission_export = db.Column(db.Boolean, default=False)
    permission_import = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Utilisateur {self.nom}>'


class Stock(db.Model):
    __tablename__ = 'stock'
    
    id = db.Column(db.Integer, primary_key=True)
    nom_equipement = db.Column(db.String(255), nullable=False)
    type_equipement = db.Column(db.String(100), nullable=False)  # pc portable, pc fixe, etc
    quantite = db.Column(db.Integer, default=0)
    type_stock = db.Column(db.String(50), nullable=False)  # FSS, IMS, C2S, Commun
    etat = db.Column(db.String(50), default='nouveau')  # nouveau, occasion bon état, occasion mauvaise état, en panne
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Détails équipement
    ram = db.Column(db.String(50))
    stockage = db.Column(db.String(100))
    processeur = db.Column(db.String(100))
    numero_serie = db.Column(db.String(100))
    activite = db.Column(db.String(100))
    systeme = db.Column(db.String(100))
    accessoires = db.Column(db.Text)
    alternate_username = db.Column(db.String(255))
    os_version = db.Column(db.String(100))
    manufacturer = db.Column(db.String(100))
    disque_dur = db.Column(db.String(100))
    emplacement = db.Column(db.String(100))
    service = db.Column(db.String(100))

    def __repr__(self):
        return f'<Stock {self.nom_equipement}>'


class Mouvement(db.Model):
    __tablename__ = 'mouvements'
    
    id = db.Column(db.Integer, primary_key=True)
    type_mouvement = db.Column(db.String(50), nullable=False)  # entrée, sortie, transfert
    nom_equipement = db.Column(db.String(255), nullable=False)
    type_equipement = db.Column(db.String(100), nullable=False)
    quantite = db.Column(db.Integer, nullable=False)
    type_stock = db.Column(db.String(50), nullable=False)  # FSS, IMS, C2S, Commun
    local_it_destination = db.Column(db.String(100))
    baie_destination = db.Column(db.String(100))
    date_mouvement = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Détails pour PC/Portables
    ram = db.Column(db.String(50))
    stockage = db.Column(db.String(50))
    processeur = db.Column(db.String(100))
    numero_serie = db.Column(db.String(100))
    activite = db.Column(db.String(100))
    systeme = db.Column(db.String(100))
    accessoires = db.Column(db.Text)
    
    description = db.Column(db.Text)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'))
    
    def __repr__(self):
        return f'<Mouvement {self.id}>'


class MouvementHistorique(db.Model):
    __tablename__ = 'mouvements_historique'

    id = db.Column(db.Integer, primary_key=True)
    mouvement_id_original = db.Column(db.Integer, nullable=False)
    nom_equipement = db.Column(db.String(255), nullable=False)
    type_equipement = db.Column(db.String(100), nullable=False)
    type_mouvement = db.Column(db.String(50), nullable=False)
    quantite = db.Column(db.Integer, nullable=False)
    type_stock = db.Column(db.String(50), nullable=False)
    local_it_destination = db.Column(db.String(100))
    baie_destination = db.Column(db.String(100))
    model_equipement = db.Column(db.String(255))
    numero_serie = db.Column(db.String(100))
    activite = db.Column(db.String(100))
    description = db.Column(db.Text)
    date_mouvement_originale = db.Column(db.DateTime)
    date_suppression = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<MouvementHistorique {self.mouvement_id_original}>'


class Parc(db.Model):
    __tablename__ = 'parc'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    alternate_username = db.Column(db.String(255))
    os_name = db.Column(db.String(100))
    os_version = db.Column(db.String(50))
    type = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(255))
    version = db.Column(db.String(100))
    manufacturer = db.Column(db.String(255))
    numero_serie = db.Column(db.String(100), unique=True)
    processeur = db.Column(db.String(100))
    ram = db.Column(db.String(50))
    disque_dur = db.Column(db.String(50))
    emplacement = db.Column(db.String(100))
    service = db.Column(db.String(100))
    activite = db.Column(db.String(50))
    quantite = db.Column(db.Integer, default=0)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Parc {self.name}>'


class LocalIT(db.Model):
    __tablename__ = 'locaux_it'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    localisation = db.Column(db.String(255))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    baies = db.relationship('BaieIT', backref='local_it', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<LocalIT {self.nom}>'


class BaieIT(db.Model):
    __tablename__ = 'baies_it'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    numero = db.Column(db.Integer)
    local_it_id = db.Column(db.Integer, db.ForeignKey('locaux_it.id'), nullable=False)
    description = db.Column(db.Text)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    equipements = db.relationship('EquipementBaie', backref='baie', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<BaieIT {self.nom}>'


class EquipementBaie(db.Model):
    __tablename__ = 'equipements_baies'
    
    id = db.Column(db.Integer, primary_key=True)
    baie_id = db.Column(db.Integer, db.ForeignKey('baies_it.id'), nullable=False)
    mouvement_id = db.Column(db.Integer, db.ForeignKey('mouvements.id'))
    quantite = db.Column(db.Integer, nullable=False)
    date_ajout = db.Column(db.DateTime, default=datetime.utcnow)
    
    mouvement = db.relationship('Mouvement', backref='equipements_baies')
    
    def __repr__(self):
        return f'<EquipementBaie {self.id}>'


class MaterielIT(db.Model):
    __tablename__ = 'materiel_it'

    id = db.Column(db.Integer, primary_key=True)
    type_materiel = db.Column(db.String(100), nullable=False)
    uc = db.Column(db.String(100))
    nom = db.Column(db.String(255), nullable=False)
    marque = db.Column(db.String(255))
    modele = db.Column(db.String(255))
    version = db.Column(db.String(100))
    os_firmware = db.Column(db.String(255))
    numero_serie = db.Column(db.String(100))
    processeur = db.Column(db.String(255))
    ram = db.Column(db.String(100))
    stockage = db.Column(db.String(100))
    stack_role = db.Column(db.String(100))
    stack_ip = db.Column(db.String(100))
    mac_wifi = db.Column(db.String(100))
    user_assigned = db.Column(db.String(255))
    id_user = db.Column(db.String(100))
    etat_materiel = db.Column(db.String(100))
    date_affectation = db.Column(db.DateTime)
    baie_port = db.Column(db.String(100))
    mac_address = db.Column(db.String(100))
    douchette = db.Column(db.String(100))
    lecteur_badge = db.Column(db.String(100))
    autre_materiel = db.Column(db.Text)
    description = db.Column(db.Text)

    # Linked to either a baie OR directly a local
    baie_id = db.Column(db.Integer, db.ForeignKey('baies_it.id'), nullable=True)
    local_it_id = db.Column(db.Integer, db.ForeignKey('locaux_it.id'), nullable=True)

    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    baie = db.relationship('BaieIT', backref='materiels', foreign_keys=[baie_id])
    local_it = db.relationship('LocalIT', backref='materiels', foreign_keys=[local_it_id])

    def __repr__(self):
        return f'<MaterielIT {self.nom}>'
