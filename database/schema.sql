-- Création de la base de données Gestion Parc Informatique
CREATE DATABASE IF NOT EXISTS gestion_parc;
USE gestion_parc;

-- Table Utilisateurs
CREATE TABLE utilisateurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  permission_export BOOLEAN DEFAULT FALSE,
  permission_import BOOLEAN DEFAULT FALSE,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Stock
CREATE TABLE stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom_equipement VARCHAR(255) NOT NULL,
  type_equipement VARCHAR(100) NOT NULL,
  quantite INT DEFAULT 0,
  type_stock VARCHAR(50) NOT NULL, -- FSS, IMS, C2S, Commun
  etat VARCHAR(50) DEFAULT 'nouveau', -- nouveau, occasion bon état, occasion mauvaise état, en panne
  
  -- Détails pour PC/Portables
  ram VARCHAR(50),
  stockage VARCHAR(50),
  processeur VARCHAR(100),
  numero_serie VARCHAR(100),
  activite VARCHAR(100),
  systeme VARCHAR(100),
  accessoires TEXT,
  
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type_stock (type_stock),
  INDEX idx_nom (nom_equipement)
);

-- Table Mouvements
CREATE TABLE mouvements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_mouvement VARCHAR(50) NOT NULL, -- entrée, sortie, transfert
  nom_equipement VARCHAR(255) NOT NULL,
  type_equipement VARCHAR(100) NOT NULL,
  quantite INT NOT NULL,
  type_stock VARCHAR(50) NOT NULL, -- FSS, IMS, C2S, Commun
  local_it_destination VARCHAR(100),
  baie_destination VARCHAR(100),
  
  -- Détails pour PC/Portables
  ram VARCHAR(50),
  stockage VARCHAR(50),
  processeur VARCHAR(100),
  numero_serie VARCHAR(100),
  activite VARCHAR(100),
  systeme VARCHAR(100),
  accessoires TEXT,
  
  description TEXT,
  utilisateur_id INT,
  date_mouvement DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
  INDEX idx_date (date_mouvement),
  INDEX idx_type (type_mouvement)
);

-- Table Parc
CREATE TABLE parc (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  alternate_username VARCHAR(255),
  os_name VARCHAR(100),
  os_version VARCHAR(50),
  type VARCHAR(100) NOT NULL,
  model VARCHAR(255),
  version VARCHAR(100),
  manufacturer VARCHAR(255),
  numero_serie VARCHAR(100) UNIQUE,
  processeur VARCHAR(100),
  ram VARCHAR(50),
  disque_dur VARCHAR(50),
  emplacement VARCHAR(100),
  service VARCHAR(100),
  esu VARCHAR(50),
  
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_numero_serie (numero_serie),
  INDEX idx_name (name)
);

-- Table Locaux IT
CREATE TABLE locaux_it (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  localisation VARCHAR(255),
  
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_nom (nom)
);

-- Table Baies IT
CREATE TABLE baies_it (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  numero INT,
  local_it_id INT NOT NULL,
  description TEXT,
  
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (local_it_id) REFERENCES locaux_it(id) ON DELETE CASCADE,
  INDEX idx_local_it (local_it_id),
  UNIQUE KEY uk_baie (local_it_id, nom)
);

-- Table Équipements Baies
CREATE TABLE equipements_baies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  baie_id INT NOT NULL,
  mouvement_id INT,
  quantite INT NOT NULL,
  
  date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (baie_id) REFERENCES baies_it(id) ON DELETE CASCADE,
  FOREIGN KEY (mouvement_id) REFERENCES mouvements(id),
  INDEX idx_baie (baie_id),
  INDEX idx_mouvement (mouvement_id)
);

-- Insertion des locaux IT par défaut
INSERT INTO locaux_it (nom, description,) VALUES
('CIM2', 'Local informatique CIM2'),
('CIM6', 'Local informatique CIM6'),
('CIM7', 'Local informatique CIM7'),
('CIM4H1', 'Local informatique CIM4H1'),
('CIM4H2', 'Local informatique CIM4H2');

-- Insertion de baies par défaut pour CIM6
INSERT INTO baies_it (nom, numero, local_it_id, description) VALUES
('Baie 1', 1, 2, 'Baie 1 CIM6'),
('Baie 2', 2, 2, 'Baie 2 CIM6'),
('Baie 3', 3, 2, 'Baie 3 CIM6'),
('Baie 4', 4, 2, 'Baie 4 CIM6');

-- Insertion d'un utilisateur admin par défaut
INSERT INTO utilisateurs (nom, password, role, permission_export, permission_import) VALUES
('visiteur', 'visiteur@hutchinson', 'visiteur', TRUE, TRUE);
