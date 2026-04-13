import React, { useEffect, useState } from 'react';
import { locauxITAPI, mouvementsAPI } from '../api';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RestrictedButton } from '../components/ProtectedRoute';

export default function LocalsIT() {
  const { hasPermission } = useAuth();
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [showBaieForm, setShowBaieForm] = useState(null);
  const [showEquipForm, setShowEquipForm] = useState(null);

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

  const [equipForm, setEquipForm] = useState({
    nom_equipement: '',
    type_equipement: '',
    quantite: 0,
    type_stock: '',
    baie_destination: '',
  });

  const [selectedLocalForBaie, setSelectedLocalForBaie] = useState('');
  const [selectedLocalForEquip, setSelectedLocalForEquip] = useState('');
  const [selectedBaieForEquip, setSelectedBaieForEquip] = useState('');

  useEffect(() => {
    loadLocaux();
  }, []);

  const loadLocaux = async () => {
    try {
      setLoading(true);
      const res = await locauxITAPI.getAll();
      setLocaux(res.data);
      if (res.data.length > 0) {
        const defaultLocalId = res.data[0].id;
        setSelectedLocalForBaie((prev) => prev || defaultLocalId);
        setSelectedLocalForEquip((prev) => prev || defaultLocalId);
        const firstBaies = res.data[0].baies || [];
        setSelectedBaieForEquip(firstBaies[0]?.nom || '');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async (e) => {
    e.preventDefault();
    try {
      await locauxITAPI.create(localForm);
      alert('✓ Local IT ajouté');
      setLocalForm({ nom: '', description: '', localisation: '' });
      setShowLocalForm(false);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('✗ Erreur lors de l\'ajout');
    }
  };

  const handleDeleteLocal = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce local?')) return;
    try {
      await locauxITAPI.delete(id);
      alert('✓ Local IT supprimé');
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('✗ Erreur lors de la suppression');
    }
  };

  const handleAddBaie = async (e, localId) => {
    e.preventDefault();
    try {
      const targetLocalId = localId || selectedLocalForBaie;
      await locauxITAPI.createBaie(targetLocalId, baieForm);
      alert('✓ Baie ajoutée');
      setBaieForm({ nom: '', numero: '', description: '' });
      setShowBaieForm(null);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('✗ Erreur lors de l\'ajout');
    }
  };

  const handleDeleteBaie = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette baie?')) return;
    try {
      await locauxITAPI.deleteBaie(id);
      alert('✓ Baie supprimée');
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('✗ Erreur lors de la suppression');
    }
  };

  const handleAddEquipement = async (e, localId) => {
    e.preventDefault();
    try {
      const targetLocalId = localId || selectedLocalForEquip;
      const localName = locaux.find(l => l.id.toString() === targetLocalId.toString())?.nom;
      await mouvementsAPI.create({
        ...equipForm,
        local_it_destination: localName,
        baie_destination: selectedBaieForEquip,
        type_mouvement: 'Entrée',
      });
      alert('✓ Équipement ajouté au local IT');
      setEquipForm({ nom_equipement: '', type_equipement: '', quantite: 0, type_stock: '', baie_destination: '' });
      setShowEquipForm(null);
      loadLocaux();
    } catch (error) {
      console.error('Erreur:', error);
      alert('✗ Erreur lors de l\'ajout');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Building2 size={32} />
              Gestion des Locaux IT
            </h2>
            <p className="mt-2 text-slate-200 max-w-2xl">Gérez vos locaux IT, baies techniques et équipements avec un contrôle d'accès granulaire.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <RestrictedButton
              onClick={() => setShowLocalForm(!showLocalForm)}
              requiredAction="edit"
              className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              <Plus size={18} /> Ajouter un local
            </RestrictedButton>
            <RestrictedButton
              onClick={() => setShowBaieForm('new')}
              requiredAction="edit"
              className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              <Plus size={18} /> Ajouter une baie
            </RestrictedButton>
          </div>
        </div>
      </div>

      {/* Add Local Form */}
      {showLocalForm && (
        <div className="rounded-[20px] bg-white p-6 shadow-lg border-l-4 border-sky-500">
          <h3 className="text-xl font-bold mb-4">Ajouter un Local IT</h3>
          <form onSubmit={handleAddLocal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom du local (ex: CIM2)"
                value={localForm.nom}
                onChange={(e) => setLocalForm({ ...localForm, nom: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Localisation (ex: Bâtiment A, Étage 3)"
                value={localForm.localisation}
                onChange={(e) => setLocalForm({ ...localForm, localisation: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <textarea
              placeholder="Description"
              value={localForm.description}
              onChange={(e) => setLocalForm({ ...localForm, description: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              rows="2"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowLocalForm(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Locaux IT - Left Column */}
        <div className="rounded-[20px] bg-white p-6 shadow-lg border-t-4 border-sky-500">
          <h3 className="text-xl font-bold mb-4">Locaux IT</h3>
          {loading ? (
            <div className="text-center p-8 text-slate-500">Chargement...</div>
          ) : locaux.length === 0 ? (
            <div className="text-center p-8 text-slate-500">Aucun local IT</div>
          ) : (
            <div className="space-y-2">
              {locaux.map(local => (
                <div key={local.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer group">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{local.nom}</p>
                    <p className="text-xs text-slate-500">{local.localisation}</p>
                  </div>
                  <RestrictedButton
                    onClick={() => handleDeleteLocal(local.id)}
                    requiredAction="edit"
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition ml-2"
                  >
                    <Trash2 size={18} />
                  </RestrictedButton>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Baies Techniques - Right Column */}
        <div className="rounded-[20px] bg-white p-6 shadow-lg border-t-4 border-green-500">
          <h3 className="text-xl font-bold mb-4">Baies techniques</h3>
          {loading ? (
            <div className="text-center p-8 text-slate-500">Chargement...</div>
          ) : locaux.length === 0 ? (
            <div className="text-center p-8 text-slate-500">Aucune baie</div>
          ) : (
            <div className="space-y-3">
              {locaux.flatMap(local =>
                local.baies && local.baies.length > 0 ? (
                  local.baies.map(baie => (
                    <div key={baie.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{baie.nom}</p>
                        <p className="text-xs text-slate-500">{local.nom}</p>
                      </div>
                      <RestrictedButton
                        onClick={() => handleDeleteBaie(baie.id)}
                        requiredAction="edit"
                        className="text-red-500 hover:text-red-700 transition ml-2"
                      >
                        <Trash2 size={18} />
                      </RestrictedButton>
                    </div>
                  ))
                ) : null
              )}
              {locaux.every(l => !l.baies || l.baies.length === 0) && (
                <div className="text-center p-8 text-slate-500">Aucune baie</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Baie Form */}
      {showBaieForm && (
        <div className="rounded-[20px] bg-white p-6 shadow-lg border-l-4 border-green-500">
          <h3 className="text-xl font-bold mb-4">Ajouter une Baie Technique</h3>
          <form onSubmit={(e) => {
            const localId = selectedLocalForBaie || locaux[0]?.id;
            if (localId) handleAddBaie(e, localId);
            else alert('Créez d\'abord un local IT');
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sélectionner le local</label>
              <select
                value={selectedLocalForBaie}
                onChange={(e) => setSelectedLocalForBaie(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                required
              >
                <option value="">-- Sélectionnez un local --</option>
                {locaux.map(local => (
                  <option key={local.id} value={local.id}>{local.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom de la baie (ex: Baie 1)"
                value={baieForm.nom}
                onChange={(e) => setBaieForm({ ...baieForm, nom: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Numéro"
                value={baieForm.numero}
                onChange={(e) => setBaieForm({ ...baieForm, numero: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <textarea
              placeholder="Description"
              value={baieForm.description}
              onChange={(e) => setBaieForm({ ...baieForm, description: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              rows="2"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowBaieForm(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Equipement Section */}
      {showEquipForm && (
        <div className="rounded-[20px] bg-white p-6 shadow-lg border-l-4 border-purple-500">
          <h3 className="text-xl font-bold mb-4">Ajouter Équipement à un Local IT</h3>
          <form onSubmit={(e) => {
            const localId = selectedLocalForEquip || locaux[0]?.id;
            if (localId) handleAddEquipement(e, localId);
            else alert('Créez d\'abord un local IT');
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sélectionner le local</label>
              <select
                value={selectedLocalForEquip}
                onChange={(e) => {
                  const newLocalId = e.target.value;
                  setSelectedLocalForEquip(newLocalId);
                  const local = locaux.find(l => l.id.toString() === newLocalId.toString());
                  setSelectedBaieForEquip(local?.baies?.[0]?.nom || '');
                }}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              >
                <option value="">-- Sélectionnez un local --</option>
                {locaux.map(local => (
                  <option key={local.id} value={local.id}>{local.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom équipement"
                value={equipForm.nom_equipement}
                onChange={(e) => setEquipForm({ ...equipForm, nom_equipement: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <select
                value={equipForm.type_equipement}
                onChange={(e) => setEquipForm({ ...equipForm, type_equipement: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              >
                <option value="">Type équipement</option>
                <option>pc portable</option>
                <option>pc fixe</option>
                <option>imprimante</option>
                <option>écran</option>
                <option>câble</option>
                <option>autre</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Quantité"
                value={equipForm.quantite}
                onChange={(e) => setEquipForm({ ...equipForm, quantite: parseInt(e.target.value) || 0 })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                min="1"
                required
              />
              <select
                value={equipForm.type_stock}
                onChange={(e) => setEquipForm({ ...equipForm, type_stock: e.target.value })}
                className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              >
                <option value="">Type Stock</option>
                <option>FSS</option>
                <option>IMS</option>
                <option>C2S</option>
                <option>Commun</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sélectionner la baie</label>
              <select
                value={selectedBaieForEquip}
                onChange={(e) => setSelectedBaieForEquip(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">-- Aucune baie --</option>
                {(locaux.find(l => l.id.toString() === selectedLocalForEquip.toString())?.baies || []).map(baie => (
                  <option key={baie.id} value={baie.nom}>{baie.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEquipForm(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bouton Ajouter Equipement */}
      {!showEquipForm && (
        <div className="text-center">
          <RestrictedButton
            onClick={() => setShowEquipForm(!showEquipForm)}
            requiredAction="edit"
            className="flex items-center gap-2 mx-auto rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-600"
          >
            <Plus size={18} /> Ajouter Équipement
          </RestrictedButton>
        </div>
      )}
    </div>
  );
}
