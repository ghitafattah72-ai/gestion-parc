import React, { useEffect, useState } from 'react';
import { mouvementsAPI } from '../api';
import { Plus, Trash2, Download, Search } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';
import { handleExportFile } from '../utils/fileExport';

const equipmentTypes = [
  'pc portable', 'pc fixe', 'imprimante', 'étiquette', 'imprimante A4',
  'imprimante location', 'imprimante traceur', 'écran', 'câble', 'souris filaire',
  'clavier filaire', 'souris sans fil', 'clavier et souris filaire', 'douchettes', 'casque', 'autre'
];

const typeStocks = ['FSS', 'IMS', 'C2S', 'Commun'];
const mouvementTypes = ['Entrée', 'Sortie'];

const getEmptyForm = () => ({
  type_mouvement: 'Entrée',
  source_entree: 'achat',
  date_affectation: '',
  nom_equipement: '',
  type_equipement: '',
  model_equipement: '',
  numero_serie: '',
  quantite: 1,
  type_stock: '',
  activite: '',
  description: '',
});

export default function Mouvements() {
  const [items, setItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(getEmptyForm());

  useEffect(() => {
    loadMouvements();
    loadHistory();
  }, [page, search]);

  const loadMouvements = async () => {
    try {
      setLoading(true);
      const res = await mouvementsAPI.getAll(page, 10, null, search);
      setItems(res.data.items);
      setTotalPages(Math.max(1, res.data.pages || 1));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await mouvementsAPI.getHistorique();
      setHistoryItems(res.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreateMouvement = async (e) => {
    e.preventDefault();

    if (!formData.nom_equipement || !formData.type_equipement || !formData.quantite || !formData.type_stock) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    if (formData.type_mouvement === 'Entrée' && (!formData.source_entree || !formData.date_affectation)) {
      alert('Pour une entrée, source (Parc/Achat) et date d\'affectation sont obligatoires');
      return;
    }

    if (formData.type_mouvement === 'Sortie' && !formData.activite) {
      alert('Pour une sortie, activité est obligatoire');
      return;
    }

    try {
      await mouvementsAPI.create(formData);
      alert('Mouvement créé avec succès');
      setFormData(getEmptyForm());
      setShowForm(false);
      loadMouvements();
      loadHistory();
    } catch (error) {
      console.error('Erreur:', error);
      const message = error?.response?.data?.error || 'Erreur lors de la création du mouvement';
      alert(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce mouvement?')) return;

    try {
      await mouvementsAPI.delete(id);
      alert('Mouvement supprimé');
      loadMouvements();
      loadHistory();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExport = async (format) => {
    try {
      await handleExportFile(
        (fmt) => mouvementsAPI.export(fmt),
        format,
        'mouvements'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const isEntree = formData.type_mouvement === 'Entrée';

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
            <Plus size={18} /> Nouveau mouvement
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
          <h3 className="text-xl font-bold mb-4">Entrée / Sortie de stock</h3>
          <form onSubmit={handleCreateMouvement} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.type_mouvement}
                onChange={(e) => setFormData({ ...formData, type_mouvement: e.target.value })}
                className="p-2 border rounded"
                required
              >
                {mouvementTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

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
                type="text"
                placeholder="Model"
                value={formData.model_equipement}
                onChange={(e) => setFormData({ ...formData, model_equipement: e.target.value })}
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
                type="number"
                placeholder="Quantité"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value || '0', 10) })}
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

              {isEntree ? (
                <>
                  <select
                    value={formData.source_entree}
                    onChange={(e) => setFormData({ ...formData, source_entree: e.target.value })}
                    className="p-2 border rounded"
                    required
                  >
                    <option value="achat">Achat</option>
                    <option value="parc">Parc</option>
                  </select>
                  <input
                    type="date"
                    value={formData.date_affectation}
                    onChange={(e) => setFormData({ ...formData, date_affectation: e.target.value })}
                    className="p-2 border rounded"
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Activité"
                    value={formData.activite}
                    onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                    className="p-2 border rounded"
                    required
                  />
                  <div />
                </>
              )}
            </div>

            <textarea
              placeholder="Description du mouvement"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Type Mvt</th>
              <th className="p-3 text-left">Équipement</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">N° Série</th>
              <th className="p-3 text-left">Quantité</th>
              <th className="p-3 text-left">Source Entrée</th>
              <th className="p-3 text-left">Activité</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="p-3 text-center">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="10" className="p-3 text-center">Aucun mouvement</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.type_mouvement}</td>
                  <td className="p-3">{item.nom_equipement}</td>
                  <td className="p-3">{item.type_equipement}</td>
                  <td className="p-3">{item.model_equipement || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
                  <td className="p-3">{item.quantite}</td>
                  <td className="p-3">{item.source_entree || '-'}</td>
                  <td className="p-3">{item.activite || '-'}</td>
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

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Historique des mouvements supprimés</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Équipement</th>
              <th className="p-3 text-left">Type Mvt</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">N° Série</th>
              <th className="p-3 text-left">Date Suppression</th>
            </tr>
          </thead>
          <tbody>
            {historyItems.length === 0 ? (
              <tr><td colSpan="5" className="p-3 text-center">Aucun historique</td></tr>
            ) : (
              historyItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.nom_equipement}</td>
                  <td className="p-3">{item.type_mouvement}</td>
                  <td className="p-3">{item.model_equipement || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
                  <td className="p-3">{item.date_suppression ? new Date(item.date_suppression).toLocaleString() : '-'}</td>
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
