import React, { useEffect, useState } from 'react';
import { parcAPI } from '../api';
import { Plus, Edit2, Trash2, Download, Upload, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RestrictedButton } from '../components/ProtectedRoute';
import { downloadFile, handleExportFile } from '../utils/fileExport';

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
const ACTIVITE_OPTIONS = ['FSS', 'IMS', 'C2S', 'Commun'];

const getEmptyFormData = () => ({
  name: '',
  alternate_username: '',
  os_name: '',
  os_version: '',
  type: '',
  model: '',
  version: '',
  manufacturer: '',
  numero_serie: '',
  processeur: '',
  ram: '',
  disque_dur: '',
  emplacement: '',
  service: '',
  activite: '',
  quantite: 0,
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
      const importedCount = res?.data?.imported_count ?? 0;
      const errors = Array.isArray(res?.data?.errors) ? res.data.errors : [];

      if (errors.length > 0) {
        const previewErrors = errors.slice(0, 5).join('\n');
        const moreCount = errors.length > 5 ? `\n... +${errors.length - 5} autres erreurs` : '';
        alert(`${importedCount} équipements importés.\n${errors.length} ligne(s) ignorée(s):\n${previewErrors}${moreCount}`);
      } else {
        alert(`${importedCount} équipements importés`);
      }

      e.target.value = '';
      loadParc();
    } catch (error) {
      console.error('Erreur:', error);
      const apiError = error?.response?.data?.error;
      const missingHeaders = error?.response?.data?.missing_headers;
      if (Array.isArray(missingHeaders) && missingHeaders.length > 0) {
        alert(`${apiError || 'Erreur lors de l\'import'}\nColonnes manquantes: ${missingHeaders.join(', ')}`);
      } else {
        alert(apiError || 'Erreur lors de l\'import');
      }
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async (format = 'xlsx') => {
    try {
      const res = await parcAPI.importTemplate(format);
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      downloadFile(res.data, `parc_import_template.${extension}`);
    } catch (error) {
      console.error('Erreur template parc:', error);
      alert('Erreur lors du téléchargement du template');
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
  const filteredItems = items.filter((item) => {
    const equalsFilter = (value, selected) => {
      if (!selected) return true;
      return (value || '').toLowerCase() === selected.toLowerCase();
    };

    return (
      equalsFilter(item.type, filters.type) &&
      equalsFilter(item.service, filters.service) &&
      equalsFilter(item.emplacement, filters.emplacement) &&
      equalsFilter(item.activite || item.esu, filters.activite)
    );
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gestion du Parc</h2>
            <p className="mt-2 max-w-2xl text-slate-200">Gérez les équipements affectés avec recherche rapide, filtres métiers et import/export</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${hasPermission('import') ? 'bg-violet-500 hover:bg-violet-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}>
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
            onClick={() => handleDownloadTemplate('xlsx')}
            requiredAction="import"
            className="flex items-center gap-2 rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            <Download size={18} /> Template
          </RestrictedButton>
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
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            requiredAction="edit"
            className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            <Plus size={18} /> Ajouter 
          </RestrictedButton>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Chercher ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent outline-none p-2 text-slate-700"
            />
        </div>
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none"
          >
            <option value="">Filtre Type</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={filters.service}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none"
          >
            <option value="">Filtre Service</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={filters.emplacement}
            onChange={(e) => setFilters({ ...filters, emplacement: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none"
          >
            <option value="">Filtre Emplacement</option>
            {emplacementOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={filters.activite}
            onChange={(e) => setFilters({ ...filters, activite: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none"
          >
            <option value="">Filtre Activité</option>
            {ACTIVITE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Form */}
      {showForm && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
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
                placeholder="Username"
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
                placeholder="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
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
              <select
                value={formData.activite}
                onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="">Activitée</option>
                {ACTIVITE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
                {formData.activite && !ACTIVITE_OPTIONS.includes(formData.activite) && (
                  <option value={formData.activite}>{formData.activite}</option>
                )}
                            <input
                              type="number"
                              placeholder="Quantité"
                              value={formData.quantite || 0}
                              onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                              className="p-2 border rounded"
                            />
              </select>
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
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Alternate username</th>
              <th className="p-3 text-left">Operating System - Name</th>
              <th className="p-3 text-left">Operating System - Version</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Manufacturer</th>
              <th className="p-3 text-left">Processeur</th>
              <th className="p-3 text-left">N° de Série</th>
              <th className="p-3 text-left">RAM</th>
              <th className="p-3 text-left">Disque Dur</th>
              <th className="p-3 text-left">Emplacement</th>
              <th className="p-3 text-left">Activité</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Quantité</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="16" className="p-3 text-center">Chargement...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="16" className="p-3 text-center">Aucun équipement</td></tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.alternate_username || '-'}</td>
                  <td className="p-3">{item.os_name || '-'}</td>
                  <td className="p-3">{item.os_version || '-'}</td>
                  <td className="p-3">{item.type || '-'}</td>
                  <td className="p-3">{item.model || '-'}</td>
                  <td className="p-3">{item.manufacturer || '-'}</td>
                  <td className="p-3">{item.processeur || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
                  <td className="p-3">{item.ram || '-'}</td>
                  <td className="p-3">{item.disque_dur || '-'}</td>
                  <td className="p-3">{item.emplacement || '-'}</td>
                  <td className="p-3">{item.activite || '-'}</td>
                  <td className="p-3">{item.service || '-'}</td>
                  <td className="p-3">{item.quantite || 0}</td>
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Précédent
        </button>
        <span className="text-slate-600">
          Page {page} sur {totalPages}
          <span className="ml-2 text-xs text-slate-400">({totalItems} équipement{totalItems !== 1 ? 's' : ''})</span>
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
