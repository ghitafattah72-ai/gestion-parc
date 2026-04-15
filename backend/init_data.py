#!/usr/bin/env python3
"""
Script pour initialiser les données par défaut des locaux IT
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, LocalIT, BaieIT

def init_default_data():
    """Initialise les données par défaut des locaux IT et baies"""

    app = create_app()

    with app.app_context():
        try:
            # Créer les locaux IT par défaut
            default_locaux = [
                {'nom': 'CIM2'},
                {'nom': 'CIM6'},
                {'nom': 'CIM7'},
                {'nom': 'CIM4H1'},
                {'nom': 'CIM4H2'}
            ]

            locaux_created = 0
            for local_data in default_locaux:
                existing = LocalIT.query.filter_by(nom=local_data['nom']).first()
                if not existing:
                    new_local = LocalIT(**local_data)
                    db.session.add(new_local)
                    locaux_created += 1
                    print(f"✓ Local {local_data['nom']} créé")
                else:
                    print(f"⚠ Local {local_data['nom']} existe déjà")

            db.session.commit()
            print(f"\n📍 {locaux_created} locaux IT créés")

            # Créer les baies par défaut pour chaque local
            baies_config = {
                'CIM2': ['Baie 1'],
                'CIM6': ['Baie 1', 'Baie 2', 'Baie 3', 'Baie 4'],
                'CIM7': ['Baie 1', 'Baie 2'],
                'CIM4H1': ['Baie 1'],
                'CIM4H2': ['Baie 1']
            }

            baies_created = 0
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
                            baies_created += 1
                            print(f"✓ Baie {baie_nom} créée pour {local_nom}")
                        else:
                            print(f"⚠ Baie {baie_nom} existe déjà pour {local_nom}")

            db.session.commit()
            print(f"\n🗂️ {baies_created} baies techniques créées")

            print("\n🎉 Initialisation terminée avec succès!")
            print("📊 Résumé:")
            print(f"   - Locaux IT: {locaux_created} créés")
            print(f"   - Baies techniques: {baies_created} créées")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de l'initialisation: {e}")
            return False

    return True

if __name__ == "__main__":
    print("🚀 Initialisation des données par défaut...")
    success = init_default_data()
    if success:
        print("\n✅ Script terminé avec succès!")
    else:
        print("\n❌ Échec de l'initialisation!")
        sys.exit(1)