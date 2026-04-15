import React, { useEffect, useState } from 'react';
import { stockAPI } from '../api';
import { Plus, Trash2, Download, Search, Pencil, Upload } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { handleExportFile } from '../utils/fileExport';
import { EQUIPMENT_TYPES_WITH_DETAILS, STOCK_TYPES } from '../constants';

const equipmentTypes = [
  'pc portable', 'pc fixe', 'ipo', 'imprimante', 'étiquette', 'imprimante A4',
  'imprimante location', 'imprimante traceur', 'écran', 'câble', 'souris filaire',
  'clavier filaire', 'souris sans fil', 'clavier et souris filaire', 'douchettes', 'casque', 'autre'
];

const typeStocks = ['FSS', 'IMS', 'C2S', 'Commun'];
const states = ['nouveau', 'occasion bon état', 'occasion mauvaise état', 'en panne'];

export default function Stock() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeStockFilter, setTypeStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nom_equipement: '',
    type_equipement: '',
    quantite: 0,
    type_stock: '',
    etat: 'nouveau',
    ram: '',
    stockage: '',
    processeur: '',
    numero_serie: '',
    activite: '',
    systeme: '',
    accessoires: '',
  });

  useEffect(() => {
    loadStock();
  }, [page, search, typeStockFilter]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const res = await stockAPI.getAll(page, 10, typeStockFilter, search);
      setItems(res.data.items);
      setTotalPages(res.data.pages);
    } catch (error) {
      console.error('Erreur lors du chargement du stock:', error);
      alert('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom_equipement: '',
      type_equipement: '',
      quantite: 0,
      type_stock: '',
      etat: 'nouveau',
      ram: '',
      stockage: '',
      processeur: '',
      numero_serie: '',
      activite: '',
      systeme: '',
      accessoires: '',
    });
    setEditingId(null);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    
    if (!formData.nom_equipement || !formData.type_equipement || !formData.type_stock) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      if (editingId) {
        await stockAPI.update(editingId, formData);
        alert('Équipement modifié avec succès');
      } else {
        await stockAPI.create(formData);
        alert('Équipement ajouté avec succès');
      }
      resetForm();
      setShowForm(false);
      loadStock();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de l\'équipement');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nom_equipement: item.nom_equipement || '',
      type_equipement: item.type_equipement || '',
      quantite: item.quantite ?? 0,
      type_stock: item.type_stock || '',
      etat: item.etat || 'nouveau',
      ram: item.ram || '',
      stockage: item.stockage || '',
      processeur: item.processeur || '',
      numero_serie: item.numero_serie || '',
      activite: item.activite || '',
      systeme: item.systeme || '',
      accessoires: item.accessoires || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) return;

    try {
      await stockAPI.delete(id);
      alert('Équipement supprimé avec succès');
      loadStock();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExport = async (format) => {
    try {
      await handleExportFile(
        (fmt) => stockAPI.export(fmt, typeStockFilter || null),
        format,
        'stock'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await stockAPI.import(file);
      alert(`${res.data.imported_count} équipements importés`);
      e.target.value = '';
      setPage(1);
      loadStock();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error?.response?.data?.error || 'Erreur lors de l\'import');
    }
  };

  const isPCType = ['pc portable', 'pc fixe', 'ipo'].includes(formData.type_equipement);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gestion du Stock</h2>
            <p className="mt-2 text-slate-200 max-w-2xl">Visualisez et gérez l’inventaire central de vos équipements IT avec un accès rapide aux exports et à l’ajout.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                hasPermission('import') ? 'bg-violet-500 hover:bg-violet-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Upload size={18} /> Import
              <input
                type="file"
                onChange={handleImport}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={!hasPermission('import')}
              />
            </label>
            <RestrictedButton
              onClick={() => handleExport('csv')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Download size={18} /> CSV
            </RestrictedButton>
            <RestrictedButton
              onClick={() => handleExport('xlsx')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Download size={18} /> Excel
            </RestrictedButton>
            <RestrictedButton
              onClick={() => setShowForm(!showForm)}
              requiredAction="edit"
              className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              <Plus size={18} /> Ajouter
            </RestrictedButton>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm border border-slate-200 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un équipement..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent outline-none p-2 text-slate-700"
          />
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm border border-slate-200">
          <select
            value={typeStockFilter}
            onChange={(e) => {
              setTypeStockFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none"
          >
            <option value="">Tous les types</option>
            {typeStocks.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">{editingId ? 'Modifier l\'équipement' : 'Ajouter un nouvel équipement'}</h3>
          <form onSubmit={handleSaveItem} className="space-y-4">
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
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                className="p-2 border rounded"
              >
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
            
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

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Quantité</th>
              <th className="p-3 text-left">Type Stock</th>
              <th className="p-3 text-left">État</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-3 text-center">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-3 text-center">Aucun équipement trouvé</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.nom_equipement}</td>
                  <td className="p-3">{item.type_equipement}</td>
                  <td className="p-3">{item.quantite}</td>
                  <td className="p-3">{item.type_stock}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.etat === 'nouveau' ? 'bg-green-100 text-green-800' :
                      item.etat === 'en panne' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.etat}
                    </span>
                  </td>
                  <td className="p-3">
                    <RestrictedButton
                      onClick={() => handleEdit(item)}
                      requiredAction="edit"
                      className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                    >
                      <Pencil size={18} />
                    </RestrictedButton>
                    <RestrictedButton
                      onClick={() => handleDelete(item.id)}
                      requiredAction="edit"
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
