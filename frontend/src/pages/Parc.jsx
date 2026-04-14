import React, { useEffect, useState } from 'react';
import { parcAPI } from '../api';
import { Plus, Edit2, Trash2, Download, Upload, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RestrictedButton } from '../components/ProtectedRoute';
import { handleExportFile } from '../utils/fileExport';

const PARC_TYPES = [
  'pc portable',
  'pc fixe',
  'ipo',
  'imprimante A4',
  'imprimante location',
  'imprimante traceur',
  'imprimante étiquette',
  'écran',
  'souris fil',
  'clavier fil',
  'souris sans fil',
  'clavier et souris',
  'casque',
  'douchette',
  'cable',
  'autre'
];
const DETAILED_TYPES = ['pc portable', 'pc fixe'];

const getEmptyFormData = () => ({
  name: '',
  alternate_username: '',
  os_name: '',
  os_version: '',
  type: '',
  model: '',
  manufacturer: '',
  numero_serie: '',
  processeur: '',
  ram: '',
  disque_dur: '',
  emplacement: '',
  service: '',
  esu: '',
});

export default function Parc() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    service: '',
    emplacement: '',
    activite: '',
    user: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState(getEmptyFormData());

  useEffect(() => {
    loadParc();
  }, [page, search]);

  const loadParc = async () => {
    try {
      setLoading(true);
      const res = await parcAPI.getAll(page, 10, search);
      setItems(res.data.items);
      setTotalPages(Math.max(1, res.data.pages || 1));
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();

    const payload = { ...formData };

    try {
      if (editingId) {
          await parcAPI.update(editingId, payload);
        alert('Équipement mis à jour');
        setEditingId(null);
      } else {
          await parcAPI.create(payload);
        alert('Équipement ajouté');
      }

      setFormData(getEmptyFormData());
      setShowForm(false);
      loadParc();
    } catch (error) {
      console.error('Erreur:', error);
      const message = error?.response?.data?.error || error?.message || 'Erreur lors de l\'enregistrement';
      alert(message);
    }
  };

  const handleEditItem = (item) => {
    setFormData({ ...getEmptyFormData(), ...item });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleTypeChange = (typeValue) => {
    const nextType = typeValue.toLowerCase();
    const shouldShowDetails = DETAILED_TYPES.includes(nextType);

    if (shouldShowDetails) {
      setFormData({ ...formData, type: typeValue });
      return;
    }

    setFormData({
      ...formData,
      type: typeValue,
      os_name: '',
      os_version: '',
      processeur: '',
      ram: '',
      disque_dur: '',
    });
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Supprimer cet équipement?')) return;

    try {
      await parcAPI.delete(id);
      alert('Équipement supprimé');
      loadParc();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await parcAPI.import(file);
      alert(`${res.data.imported_count} équipements importés`);
      e.target.value = '';
      loadParc();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'import');
    }
  };

  const handleExport = async (format) => {
    try {
      await handleExportFile(
        (fmt) => parcAPI.export(fmt),
        format,
        'parc'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const isDetailedType = DETAILED_TYPES.includes((formData.type || '').toLowerCase());
  const uniqueValues = (list, getter) => {
    const values = new Set();
    list.forEach((item) => {
      const value = getter(item);
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  };

  const typeOptions = uniqueValues(items, (item) => item.type);
  const serviceOptions = uniqueValues(items, (item) => item.service);
  const emplacementOptions = uniqueValues(items, (item) => item.emplacement);
  const activiteOptions = uniqueValues(items, (item) => item.activite || item.esu);
  const userOptions = uniqueValues(items, (item) => item.alternate_username);

  const filteredItems = items.filter((item) => {
    const equalsFilter = (value, selected) => {
      if (!selected) return true;
      return (value || '').toLowerCase() === selected.toLowerCase();
    };

    return (
      equalsFilter(item.type, filters.type) &&
      equalsFilter(item.service, filters.service) &&
      equalsFilter(item.emplacement, filters.emplacement) &&
      equalsFilter(item.activite || item.esu, filters.activite) &&
      equalsFilter(item.alternate_username, filters.user)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion du Parc</h2>
        <div className="flex gap-2">
          <label className={`flex items-center gap-2 ${hasPermission('import') ? 'bg-purple-500 hover:bg-purple-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded`}>
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
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            <Download size={18} /> CSV
          </RestrictedButton>
          <RestrictedButton
            onClick={() => handleExport('xlsx')}
            requiredAction="export"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Download size={18} /> Excel
          </RestrictedButton>
          <RestrictedButton
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            requiredAction="edit"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Plus size={18} /> Ajouter
          </RestrictedButton>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr]">
          <div className="flex items-center gap-2 bg-gray-100 rounded px-3">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Chercher ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 bg-transparent outline-none p-2"
            />
          </div>
          <select
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Filtre User</option>
            {userOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Filtre Type</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            value={filters.service}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Filtre Service</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={filters.emplacement}
            onChange={(e) => setFilters({ ...filters, emplacement: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Filtre Emplacement</option>
            {emplacementOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={filters.activite}
            onChange={(e) => setFilters({ ...filters, activite: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Filtre Activité</option>
            {activiteOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">{editingId ? 'Modifier' : 'Ajouter'} un équipement parc</h3>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Alternate username"
                value={formData.alternate_username}
                onChange={(e) => setFormData({ ...formData, alternate_username: e.target.value })}
                className="p-2 border rounded"
              />
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="p-2 border rounded"
                required
              >
                <option value="">Type équipement</option>
                {PARC_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                placeholder="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Emplacement"
                value={formData.emplacement}
                onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Service"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="ESU"
                value={formData.esu}
                onChange={(e) => setFormData({ ...formData, esu: e.target.value })}
                className="p-2 border rounded"
              />
              {isDetailedType && (
                <>
                  <select
                    value={formData.os_name}
                    onChange={(e) => setFormData({ ...formData, os_name: e.target.value, os_version: '' })}
                    className="p-2 border rounded"
                  >
                    <option value="">Système d'exploitation</option>
                    <option value="Windows 11 Professional">Windows 11 Professional</option>
                    <option value="Windows 10 Professional">Windows 10 Professional</option>
                    <option value="Windows 10 Entreprise">Windows 10 Entreprise</option>
                    <option value="Windows 11 Entreprise">Windows 11 Entreprise</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Processeur"
                    value={formData.processeur}
                    onChange={(e) => setFormData({ ...formData, processeur: e.target.value })}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="RAM"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Disque dur"
                    value={formData.disque_dur}
                    onChange={(e) => setFormData({ ...formData, disque_dur: e.target.value })}
                    className="p-2 border rounded"
                  />
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-300 rounded">Annuler</button>
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
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">N° Série</th>
              <th className="p-3 text-left">OS</th>
              <th className="p-3 text-left">Processeur</th>
              <th className="p-3 text-left">RAM</th>
              <th className="p-3 text-left">Disque</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="11" className="p-3 text-center">Chargement...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="11" className="p-3 text-center">Aucun équipement</td></tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.alternate_username || '-'}</td>
                  <td className="p-3">{item.type || '-'}</td>
                  <td className="p-3">{item.model || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
                  <td className="p-3">{item.os_name || '-'}</td>
                  <td className="p-3">{item.processeur || '-'}</td>
                  <td className="p-3">{item.ram || '-'}</td>
                  <td className="p-3">{item.disque_dur || '-'}</td>
                  <td className="p-3">{item.service || '-'}</td>
                  <td className="p-3 flex gap-2">
                    <RestrictedButton
                      onClick={() => handleEditItem(item)}
                      requiredAction="edit"
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      <Edit2 size={18} />
                    </RestrictedButton>
                    <RestrictedButton
                      onClick={() => handleDeleteItem(item.id)}
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
          disabled={page <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Précédent
        </button>
        <span className="text-gray-600">
          Page {page} sur {totalPages}
          <span className="ml-2 text-gray-400 text-xs">({totalItems} équipement{totalItems !== 1 ? 's' : ''})</span>
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
