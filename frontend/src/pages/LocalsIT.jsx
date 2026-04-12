import React, { useEffect, useState } from 'react';
import { locauxITAPI, mouvementsAPI } from '../api';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';

export default function LocalsIT() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedLocal, setExpandedLocal] = useState(null);
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [showBaieForm, setShowBaieForm] = useState(null);
  const [showMouvementForm, setShowMouvementForm] = useState(null);

  const [localForm, setLocalForm] = useState({
    nom: '',
    description: '',
    localisation: '',
  });

  const [baieForm, setBaieForm] = useState({
    nom: '',
    numero: '',
    description: '',
  });

  const [mouvementForm, setMouvementForm] = useState({
    nom_equipement: '',
    type_equipement: '',
    quantite: 0,
    type_stock: '',
    baie_destination: '',
  });

  useEffect(() => {
    loadLocaux();
  }, []);

  const loadLocaux = async () => {
    try {
      setLoading(true);
      const res = await locauxITAPI.getAll();
      setLocaux(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async (e) => {
    e.preventDefault();
    try {
      await locauxITAPI.create(localForm);
      alert('Local IT ajouté');
      setLocalForm({ nom: '', description: '', localisation: '' });
      setShowLocalForm(false);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleAddBaie = async (e, localId) => {
    e.preventDefault();
    try {
      await locauxITAPI.createBaie(localId, baieForm);
      alert('Baie ajoutée');
      setBaieForm({ nom: '', numero: '', description: '' });
      setShowBaieForm(null);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout de la baie');
    }
  };

  const handleDeleteBaie = async (id) => {
    if (!window.confirm('Supprimer cette baie?')) return;
    try {
      await locauxITAPI.deleteBaie(id);
      alert('Baie supprimée');
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddEquipement = async (e, localId) => {
    e.preventDefault();
    try {
      await mouvementsAPI.create({
        ...mouvementForm,
        local_it_destination: locaux.find(l => l.id === localId)?.nom,
        type_mouvement: 'transfert',
      });
      alert('Équipement transféré vers le local IT');
      setMouvementForm({ nom_equipement: '', type_equipement: '', quantite: 0, type_stock: '', baie_destination: '' });
      setShowMouvementForm(null);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du transfert');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Locaux IT</h2>
        <RestrictedButton
          onClick={() => setShowLocalForm(!showLocalForm)}
          requiredAction="edit"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          <Plus size={18} /> Ajouter Local IT
        </RestrictedButton>
      </div>

      {/* Add Local Form */}
      {showLocalForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Ajouter un Local IT</h3>
          <form onSubmit={handleAddLocal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom du local"
                value={localForm.nom}
                onChange={(e) => setLocalForm({ ...localForm, nom: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Localisation"
                value={localForm.localisation}
                onChange={(e) => setLocalForm({ ...localForm, localisation: e.target.value })}
                className="p-2 border rounded"
              />
            </div>
            <textarea
              placeholder="Description"
              value={localForm.description}
              onChange={(e) => setLocalForm({ ...localForm, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows="2"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowLocalForm(false)} className="px-4 py-2 bg-gray-300 rounded">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locaux IT List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-4">Chargement...</div>
        ) : locaux.length === 0 ? (
          <div className="text-center p-4">Aucun local IT</div>
        ) : (
          locaux.map(local => (
            <div key={local.id} className="bg-white rounded-lg shadow">
              <div className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center" onClick={() => setExpandedLocal(expandedLocal === local.id ? null : local.id)}>
                <div>
                  <h3 className="text-lg font-bold">{local.nom}</h3>
                  <p className="text-gray-600">{local.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {expandedLocal === local.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {expandedLocal === local.id && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h4 className="font-bold">Baies IT</h4>
                      <p className="text-xs text-gray-500">Configuration selon cahier des charges + possibilité d'ajout</p>
                    </div>
                    <RestrictedButton
                      onClick={() => setShowBaieForm(showBaieForm === local.id ? null : local.id)}
                      requiredAction="edit"
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      <Plus size={16} /> Ajouter Baie
                    </RestrictedButton>
                  </div>

                  {showBaieForm === local.id && (
                    <form onSubmit={(e) => handleAddBaie(e, local.id)} className="bg-gray-50 p-4 rounded space-y-2">
                      <input
                        type="text"
                        placeholder="Nom de la baie"
                        value={baieForm.nom}
                        onChange={(e) => setBaieForm({ ...baieForm, nom: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Numéro"
                        value={baieForm.numero}
                        onChange={(e) => setBaieForm({ ...baieForm, numero: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <textarea
                        placeholder="Description"
                        value={baieForm.description}
                        onChange={(e) => setBaieForm({ ...baieForm, description: e.target.value })}
                        className="w-full p-2 border rounded"
                        rows="2"
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowBaieForm(null)} className="px-3 py-1 bg-gray-300 rounded text-sm">
                          Annuler
                        </button>
                        <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                          Ajouter
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Baies List */}
                  <div className="space-y-2">
                    {local.baies && local.baies.length > 0 ? (
                      local.baies.map(baie => (
                        <div key={baie.id} className="bg-gray-100 p-3 rounded flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{baie.nom}</p>
                            <p className="text-sm text-gray-600">{baie.description}</p>
                          </div>
                          <RestrictedButton
                            onClick={() => handleDeleteBaie(baie.id)}
                            requiredAction="edit"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </RestrictedButton>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Aucune baie</p>
                    )}
                  </div>

                  <div className="border-t pt-4 flex justify-between items-center">
                    <h4 className="font-bold">Ajouter Équipement</h4>
                    <RestrictedButton
                      onClick={() => setShowMouvementForm(showMouvementForm === local.id ? null : local.id)}
                      requiredAction="edit"
                      className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                    >
                      <Plus size={16} /> Équipement
                    </RestrictedButton>
                  </div>

                  {showMouvementForm === local.id && (
                    <form onSubmit={(e) => handleAddEquipement(e, local.id)} className="bg-gray-50 p-4 rounded space-y-2">
                      <input
                        type="text"
                        placeholder="Nom équipement"
                        value={mouvementForm.nom_equipement}
                        onChange={(e) => setMouvementForm({ ...mouvementForm, nom_equipement: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      />
                      <select
                        value={mouvementForm.type_equipement}
                        onChange={(e) => setMouvementForm({ ...mouvementForm, type_equipement: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="">Type</option>
                        <option>pc portable</option>
                        <option>pc fixe</option>
                        <option>imprimante</option>
                        <option>écran</option>
                        <option>câble</option>
                        <option>autre</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Quantité"
                        value={mouvementForm.quantite}
                        onChange={(e) => setMouvementForm({ ...mouvementForm, quantite: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded"
                        required
                      />
                      <select
                        value={mouvementForm.type_stock}
                        onChange={(e) => setMouvementForm({ ...mouvementForm, type_stock: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="">Type Stock</option>
                        <option>FSS</option>
                        <option>IMS</option>
                        <option>C2S</option>
                        <option>Commun</option>
                      </select>
                      <select
                        value={mouvementForm.baie_destination}
                        onChange={(e) => setMouvementForm({ ...mouvementForm, baie_destination: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sélectionner Baie (optionnel)</option>
                        {local.baies && local.baies.map(baie => (
                          <option key={baie.id} value={baie.nom}>{baie.nom}</option>
                        ))}
                      </select>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowMouvementForm(null)} className="px-3 py-1 bg-gray-300 rounded text-sm">
                          Annuler
                        </button>
                        <button type="submit" className="px-3 py-1 bg-purple-500 text-white rounded text-sm">
                          Transférer
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
