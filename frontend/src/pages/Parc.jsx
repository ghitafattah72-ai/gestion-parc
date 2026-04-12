import React, { useEffect, useState } from 'react';
import { parcAPI, locauxITAPI } from '../api';
import { Plus, Edit2, Trash2, Download, Upload, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RestrictedButton } from '../components/ProtectedRoute';

export default function Parc() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locaux, setLocaux] = useState([]);
  const [expandedBaie, setExpandedBaie] = useState(null);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadParc();
    loadLocaux();
  }, [page, search]);

  const loadParc = async () => {
    try {
      setLoading(true);
      const res = await parcAPI.getAll(page, 10, search);
      setItems(res.data.items);
      setTotalPages(res.data.pages);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
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

  const handleSaveItem = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await parcAPI.update(editingId, formData);
        alert('Équipement mis à jour');
        setEditingId(null);
      } else {
        await parcAPI.create(formData);
        alert('Équipement ajouté');
      }

      setFormData({
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
      setShowForm(false);
      loadParc();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEditItem = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
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
      const res = await parcAPI.export(format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `parc.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion du Parc</h2>
        <div className="flex gap-2">
          <label className={`flex items-center gap-2 ${hasPermission('edit') ? 'bg-purple-500 hover:bg-purple-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded`}>
            <Upload size={18} /> Import
            <input
              type="file"
              onChange={handleImport}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={!hasPermission('edit')}
            />
          </label>
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
        <div className="flex items-center gap-2 bg-gray-100 rounded px-3">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Chercher par nom ou N° de série..."
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
              <input
                type="text"
                placeholder="OS Name"
                value={formData.os_name}
                onChange={(e) => setFormData({ ...formData, os_name: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="OS Version"
                value={formData.os_version}
                onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                placeholder="N° de série"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
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
              <th className="p-3 text-left">OS</th>
              <th className="p-3 text-left">N° Série</th>
              <th className="p-3 text-left">Processeur</th>
              <th className="p-3 text-left">RAM</th>
              <th className="p-3 text-left">Disque</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="p-3 text-center">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="9" className="p-3 text-center">Aucun équipement</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.alternate_username || '-'}</td>
                  <td className="p-3">{item.os_name || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
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

      {/* Vue par Baies */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="text-xl font-bold mb-4">Équipements par Baie</h3>
        <div className="space-y-4">
          {locaux.map(local => (
            <div key={local.id} className="border rounded-lg">
              <div className="bg-gray-100 p-4 font-semibold">
                Local IT: {local.nom}
              </div>
              <div className="p-4 space-y-2">
                {local.baies && local.baies.length > 0 ? (
                  local.baies.map(baie => (
                    <div key={baie.id} className="border rounded">
                      <div
                        className="bg-blue-50 p-3 cursor-pointer hover:bg-blue-100 flex justify-between items-center"
                        onClick={() => setExpandedBaie(expandedBaie === baie.id ? null : baie.id)}
                      >
                        <span className="font-medium">{baie.nom}</span>
                        {expandedBaie === baie.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                      {expandedBaie === baie.id && (
                        <div className="p-3 bg-gray-50">
                          <div className="text-sm text-gray-600 mb-2">Équipements dans cette baie:</div>
                          <div className="space-y-1">
                            {items.filter(item => item.emplacement && item.emplacement.includes(`${local.nom} - ${baie.nom}`)).length > 0 ? (
                              items.filter(item => item.emplacement && item.emplacement.includes(`${local.nom} - ${baie.nom}`)).map(item => (
                                <div key={item.id} className="bg-white p-2 rounded text-sm">
                                  <span className="font-medium">{item.name}</span> - {item.type} ({item.numero_serie})
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-sm italic">Aucun équipement dans cette baie</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">Aucune baie dans ce local</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
