#!/usr/bin/env python3
"""
Test script pour vérifier les données initialisées
"""

import requests
import json

def test_api():
    """Test l'accès aux données via l'API"""

    try:
        # Test locaux IT
        print("🔍 Test des locaux IT...")
        response = requests.get('http://localhost:5000/api/locaux-it/')

        if response.status_code == 200:
            locaux = response.json()
            print(f'✅ {len(locaux)} locaux IT trouvés:')

            for local in locaux:
                print(f'   📍 {local["nom"]} - {local["localisation"]}')
                print(f'      "{local["description"]}"')

                # Vérifier les baies pour ce local
                baies_response = requests.get(f'http://localhost:5000/api/locaux-it/{local["id"]}/baies')
                if baies_response.status_code == 200:
                    baies = baies_response.json()
                    if baies:
                        print(f'      🗂️ {len(baies)} baies: {[b["nom"] for b in baies]}')
                    else:
                        print(f'      🗂️ Aucune baie')
                else:
                    print(f'      ❌ Erreur baies: {baies_response.status_code}')

                print()
        else:
            print(f'❌ Erreur API locaux: {response.status_code}')
            print(f'   Réponse: {response.text}')

    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur (backend non démarré?)")
    except Exception as e:
        print(f'❌ Erreur: {e}')

if __name__ == "__main__":
    print("🚀 Test des données initialisées...")
    test_api()
    print("✅ Test terminé!")