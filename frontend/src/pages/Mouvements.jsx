import React, { useEffect, useState } from 'react';
import { mouvementsAPI, locauxITAPI } from '../api';
import { Plus, Trash2, Download, Search } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';

const equipmentTypes = [
  'pc portable', 'pc fixe', 'imprimante', 'étiquette', 'imprimante A4',
  'imprimante location', 'imprimante traceur', 'écran', 'câble', 'souris filaire',
  'clavier filaire', 'souris sans fil', 'clavier et souris filaire', 'douchettes', 'casque', 'autre'
];

const typeStocks = ['FSS', 'IMS', 'C2S', 'Commun'];

const baiesParLocal = {
  'CIM2': ['Baie 1'],
  'CIM6': ['Baie 1', 'Baie 2', 'Baie 3', 'Baie 4'],
  'CIM7': ['Baie 1', 'Baie 2'],
  'CIM4H1': ['Baie 1'],
  'CIM4H2': ['Baie 1']
};

export default function Mouvements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locaux, setLocaux] = useState([]);
  const [baies, setBaies] = useState([]);

  const [formData, setFormData] = useState({
    nom_equipement: '',
    type_equipement: '',
    quantite: 0,
    type_stock: '',
    local_it_destination: '',
    baie_destination: '',
    ram: '',
    stockage: '',
    processeur: '',
    numero_serie: '',
    activite: '',
    systeme: '',
    accessoires: '',
    description: '',
  });

  useEffect(() => {
    loadMouvements();
    loadLocaux();
  }, [page, search]);

  const loadMouvements = async () => {
    try {
      setLoading(true);
      const res = await mouvementsAPI.getAll(page, 10, null, search);
      setItems(res.data.items);
      setTotalPages(res.data.pages);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocaux = async () => {
    try {
      const res = await locauxITAPI.getAll();
      setLocaux(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadBaies = (localNom) => {
    const baiesForLocal = baiesParLocal[localNom] || [];
    setBaies(baiesForLocal.map(nom => ({ id: nom, nom })));
  };

  const handleCreateMouvement = async (e) => {
    e.preventDefault();

    if (!formData.nom_equipement || !formData.type_equipement || !formData.quantite || !formData.type_stock) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      await mouvementsAPI.create(formData);
      alert('Mouvement créé avec succès');
      setFormData({
        nom_equipement: '',
        type_equipement: '',
        quantite: 0,
        type_stock: '',
        local_it_destination: '',
        baie_destination: '',
        ram: '',
        stockage: '',
        processeur: '',
        numero_serie: '',
        activite: '',
        systeme: '',
        accessoires: '',
        description: '',
      });
      setShowForm(false);
      loadMouvements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du mouvement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce mouvement?')) return;

    try {
      await mouvementsAPI.delete(id);
      alert('Mouvement supprimé');
      loadMouvements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await mouvementsAPI.export(format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mouvements.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const isPCType = ['pc portable', 'pc fixe'].includes(formData.type_equipement);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Mouvements</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            <Download size={18} /> CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Download size={18} /> Excel
          </button>
          <RestrictedButton
            onClick={() => setShowForm(!showForm)}
            requiredAction="edit"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Plus size={18} /> Transférer
          </RestrictedButton>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded px-3">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un mouvement..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent outline-none p-2"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Transfert d'équipement vers Local IT</h3>
          <form onSubmit={handleCreateMouvement} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom équipement"
                value={formData.nom_equipement}
                onChange={(e) => setFormData({ ...formData, nom_equipement: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <select
                value={formData.type_equipement}
                onChange={(e) => setFormData({ ...formData, type_equipement: e.target.value })}
                className="p-2 border rounded"
                required
              >
                <option value="">Sélectionner type équipement</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Quantité"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
                className="p-2 border rounded"
                required
              />
              <select
                value={formData.type_stock}
                onChange={(e) => setFormData({ ...formData, type_stock: e.target.value })}
                className="p-2 border rounded"
                required
              >
                <option value="">Sélectionner type stock</option>
                {typeStocks.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={formData.local_it_destination}
                onChange={(e) => {
                  setFormData({ ...formData, local_it_destination: e.target.value });
                  if (e.target.value) loadBaies(e.target.value);
                }}
                className="p-2 border rounded"
                required
              >
                <option value="">Sélectionner Local IT</option>
                {locaux.map(local => (
                  <option key={local.id} value={local.nom}>{local.nom}</option>
                ))}
              </select>

              <select
                value={formData.baie_destination}
                onChange={(e) => setFormData({ ...formData, baie_destination: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="">Sélectionner Baie (optionnel)</option>
                {baies.map(baie => (
                  <option key={baie.id} value={baie.nom}>{baie.nom}</option>
                ))}
              </select>
            </div>

            {isPCType && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <input
                  type="text"
                  placeholder="RAM"
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Stockage"
                  value={formData.stockage}
                  onChange={(e) => setFormData({ ...formData, stockage: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Processeur"
                  value={formData.processeur}
                  onChange={(e) => setFormData({ ...formData, processeur: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="N° de série"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Activité"
                  value={formData.activite}
                  onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Système"
                  value={formData.systeme}
                  onChange={(e) => setFormData({ ...formData, systeme: e.target.value })}
                  className="p-2 border rounded"
                />
                <textarea
                  placeholder="Accessoires"
                  value={formData.accessoires}
                  onChange={(e) => setFormData({ ...formData, accessoires: e.target.value })}
                  className="p-2 border rounded col-span-2"
                  rows="2"
                />
              </div>
            )}

            <textarea
              placeholder="Description du mouvement"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Créer Mouvement</button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Équipement</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Quantité</th>
              <th className="p-3 text-left">Local IT</th>
              <th className="p-3 text-left">Baie</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-3 text-center">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="7" className="p-3 text-center">Aucun mouvement</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.nom_equipement}</td>
                  <td className="p-3">{item.type_equipement}</td>
                  <td className="p-3">{item.quantite}</td>
                  <td className="p-3">{item.local_it_destination || '-'}</td>
                  <td className="p-3">{item.baie_destination || '-'}</td>
                  <td className="p-3">{new Date(item.date_mouvement).toLocaleDateString()}</td>
                  <td className="p-3">
                    <RestrictedButton
                      onClick={() => handleDelete(item.id)}
                      requiredAction="edit"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </RestrictedButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Précédent
        </button>
        <span className="text-gray-600">Page {page} sur {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
