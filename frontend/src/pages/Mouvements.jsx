import React, { useEffect, useState } from 'react';
import { mouvementsAPI } from '../api';
import { Plus, Trash2, Download, Search, RotateCcw } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';
import { handleExportFile } from '../utils/fileExport';

const equipmentTypes = [
  'pc portable', 'pc fixe', 'imprimante', 'étiquette', 'imprimante A4',
  'imprimante location', 'imprimante traceur', 'écran', 'câble', 'souris filaire',
  'clavier filaire', 'souris sans fil', 'clavier et souris filaire', 'douchettes', 'casque', 'autre'
];

const typeStocks = ['FSS', 'IMS', 'C2S', 'Commun'];
const mouvementTypes = ['Entrée', 'Sortie'];
const activiteOptions = ['FSS', 'IMS', 'C2S', 'Commun'];

const getTodayDateInput = () => new Date().toISOString().split('T')[0];

const getEmptyForm = () => ({
  type_mouvement: 'Entrée',
  source_entree: 'achat',
  date_affectation: getTodayDateInput(),
  stock_item_id: '',
  parc_item_id: '',
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
  const [sourceItems, setSourceItems] = useState([]);
  const [availableStockTypes, setAvailableStockTypes] = useState([]);
  const [availableParcTypes, setAvailableParcTypes] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
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

    const isEntree = formData.type_mouvement === 'Entrée';
    const isSortie = formData.type_mouvement === 'Sortie';
    const isEntreeAchat = isEntree && formData.source_entree === 'achat';
    const isEntreeParc = isEntree && formData.source_entree === 'parc';

    if (!formData.quantite || formData.quantite < 1) {
      alert('Quantité invalide');
      return;
    }

    if (isSortie) {
      if (!formData.type_equipement || !formData.stock_item_id) {
        alert('Pour une sortie, choisissez le type et un équipement du stock');
        return;
      }
      if (!formData.activite) {
        alert('Pour une sortie, activité est obligatoire');
        return;
      }
    }

    if (isEntreeAchat) {
      if (!formData.nom_equipement || !formData.type_equipement || !formData.type_stock) {
        alert('Pour une entrée achat, nom, type et type stock sont obligatoires');
        return;
      }
    }

    if (isEntreeParc) {
      if (!formData.type_equipement || !formData.parc_item_id || !formData.type_stock) {
        alert('Pour une entrée depuis parc, choisissez type, équipement parc et type stock destination');
        return;
      }
    }

    const payload = {
      ...formData,
      quantite: isEntreeParc ? 1 : formData.quantite,
    };

    try {
      await mouvementsAPI.create(payload);
      alert('Mouvement créé avec succès');
      setFormData(getEmptyForm());
      setSourceItems([]);
      setSourceSearch('');
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

  const handleRestoreHistory = async (id) => {
    if (!window.confirm('Restaurer ce mouvement supprimé ?')) return;

    try {
      await mouvementsAPI.restoreHistorique(id);
      alert('Mouvement restauré');
      loadMouvements();
      loadHistory();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error?.response?.data?.error || 'Erreur lors de la restauration');
    }
  };

  const handleDeleteHistoryPermanent = async (id) => {
    if (!window.confirm('Supprimer définitivement cet élément de l\'historique ?')) return;

    try {
      await mouvementsAPI.deleteHistorique(id);
      alert('Historique supprimé définitivement');
      loadHistory();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error?.response?.data?.error || 'Erreur lors de la suppression définitive');
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

  useEffect(() => {
    const loadSourceTypes = async () => {
      try {
        const [stockRes, parcRes] = await Promise.all([
          mouvementsAPI.getStockSources('', ''),
          mouvementsAPI.getParcSources('', ''),
        ]);

        const stockTypes = Array.from(
          new Set((stockRes.data || []).map((item) => (item.type_equipement || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        const parcTypes = Array.from(
          new Set((parcRes.data || []).map((item) => (item.type_equipement || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        setAvailableStockTypes(stockTypes);
        setAvailableParcTypes(parcTypes);
      } catch (error) {
        setAvailableStockTypes([]);
        setAvailableParcTypes([]);
      }
    };

    loadSourceTypes();
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;
    if (formData.type_mouvement !== 'Sortie') return;
    if (formData.type_equipement) return;
    if (availableStockTypes.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      type_equipement: availableStockTypes[0],
      stock_item_id: '',
      nom_equipement: '',
      model_equipement: '',
      numero_serie: '',
      type_stock: '',
      quantite: 1,
      activite: '',
    }));
  }, [showForm, formData.type_mouvement, formData.type_equipement, availableStockTypes]);

  useEffect(() => {
    if (!showForm) return;
    const isEntreeParc = formData.type_mouvement === 'Entrée' && formData.source_entree === 'parc';
    if (!isEntreeParc || sourceLoading) return;

    if (!sourceItems.length) {
      if (!formData.parc_item_id) return;
      setFormData((prev) => ({
        ...prev,
        parc_item_id: '',
        nom_equipement: '',
        model_equipement: '',
        numero_serie: '',
      }));
      return;
    }

    if (formData.parc_item_id) return;

    const selectedType = (formData.type_equipement || '').trim().toLowerCase();
    const firstItem = sourceItems.find(
      (item) => ((item.type_equipement || '').trim().toLowerCase() === selectedType)
    );
    if (!firstItem) return;

    setFormData((prev) => ({
      ...prev,
      parc_item_id: String(firstItem.id),
      nom_equipement: firstItem.nom_equipement || '',
      type_equipement: firstItem.type_equipement || prev.type_equipement,
      model_equipement: firstItem.model_equipement || '',
      numero_serie: firstItem.numero_serie || '',
      quantite: 1,
    }));
  }, [showForm, formData.type_mouvement, formData.source_entree, formData.type_equipement, formData.parc_item_id, sourceItems, sourceLoading]);

  useEffect(() => {
    const isSortie = formData.type_mouvement === 'Sortie';
    const isEntreeParc = formData.type_mouvement === 'Entrée' && formData.source_entree === 'parc';
    const hasType = !!formData.type_equipement;

    if (!hasType || (!isSortie && !isEntreeParc)) {
      setSourceItems([]);
      setSourceLoading(false);
      return;
    }

    let isCancelled = false;

    const loadSources = async () => {
      try {
        setSourceLoading(true);
        const res = isSortie
          ? await mouvementsAPI.getStockSources(formData.type_equipement, sourceSearch)
          : await mouvementsAPI.getParcSources(formData.type_equipement, sourceSearch);

        if (!isCancelled) {
          setSourceItems(res.data || []);
        }
      } catch (error) {
        if (!isCancelled) {
          setSourceItems([]);
        }
      } finally {
        if (!isCancelled) {
          setSourceLoading(false);
        }
      }
    };

    loadSources();

    return () => {
      isCancelled = true;
    };
  }, [formData.type_mouvement, formData.source_entree, formData.type_equipement, sourceSearch]);

  const handleMouvementTypeChange = (value) => {
    setFormData({
      ...getEmptyForm(),
      type_mouvement: value,
      source_entree: value === 'Entrée' ? 'achat' : '',
      activite: '',
    });
    setSourceSearch('');
    setSourceItems([]);
  };

  const handleSourceEntreeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      source_entree: value,
      parc_item_id: '',
      stock_item_id: '',
      nom_equipement: '',
      model_equipement: '',
      numero_serie: '',
      quantite: value === 'parc' ? 1 : 1,
      activite: '',
      type_stock: value === 'parc' ? 'Commun' : prev.type_stock,
      date_affectation: value === 'parc' ? getTodayDateInput() : prev.date_affectation,
    }));
    setSourceSearch('');
    setSourceItems([]);
  };

  const handleTypeEquipementChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      type_equipement: value,
      stock_item_id: '',
      parc_item_id: '',
      nom_equipement: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.nom_equipement,
      model_equipement: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.model_equipement,
      numero_serie: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.numero_serie,
      quantite: prev.source_entree === 'parc' ? 1 : prev.quantite,
      activite: prev.activite,
    }));
    setSourceItems([]);
    setSourceSearch('');
  };

  const handleSelectStockItem = (stockItemId) => {
    const selected = sourceItems.find((item) => String(item.id) === String(stockItemId));
    setFormData((prev) => ({
      ...prev,
      stock_item_id: stockItemId,
      nom_equipement: selected?.nom_equipement || '',
      type_equipement: selected?.type_equipement || prev.type_equipement,
      model_equipement: selected?.model_equipement || '',
      numero_serie: selected?.numero_serie || '',
      type_stock: selected?.type_stock || '',
      quantite: 1,
      activite: prev.activite,
    }));
  };

  const handleSelectParcItem = (parcItemId) => {
    const selected = sourceItems.find((item) => String(item.id) === String(parcItemId));
    setFormData((prev) => ({
      ...prev,
      parc_item_id: parcItemId,
      nom_equipement: selected?.nom_equipement || '',
      type_equipement: selected?.type_equipement || prev.type_equipement,
      model_equipement: selected?.model_equipement || '',
      numero_serie: selected?.numero_serie || '',
      quantite: 1,
      type_stock: prev.type_stock || 'Commun',
      date_affectation: prev.date_affectation || getTodayDateInput(),
    }));
  };

  const isEntree = formData.type_mouvement === 'Entrée';
  const isSortie = formData.type_mouvement === 'Sortie';
  const isEntreeAchat = isEntree && formData.source_entree === 'achat';
  const isEntreeParc = isEntree && formData.source_entree === 'parc';
  const selectedStockItem = sourceItems.find((item) => String(item.id) === String(formData.stock_item_id));
  const selectedParcItem = sourceItems.find((item) => String(item.id) === String(formData.parc_item_id));

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
                onChange={(e) => handleMouvementTypeChange(e.target.value)}
                className="p-2 border rounded"
                required
              >
                {mouvementTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {isEntree ? (
                <select
                  value={formData.source_entree}
                  onChange={(e) => handleSourceEntreeChange(e.target.value)}
                  className="p-2 border rounded"
                  required
                >
                  <option value="achat">Entrée depuis Achat</option>
                  <option value="parc">Entrée depuis Parc</option>
                </select>
              ) : (
                <input
                  type="text"
                  value="Sortie depuis Stock vers Parc"
                  className="p-2 border rounded bg-gray-50 text-gray-600"
                  disabled
                />
              )}

              <select
                value={formData.type_equipement}
                onChange={(e) => handleTypeEquipementChange(e.target.value)}
                className="p-2 border rounded"
                required
              >
                <option value="">Sélectionner type équipement</option>
                {(isSortie ? availableStockTypes : (isEntreeParc ? availableParcTypes : equipmentTypes)).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {isEntreeParc && (
                <input
                  type="text"
                  placeholder="Rechercher dans la liste..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className="p-2 border rounded"
                />
              )}

              {isSortie && (
                <select
                  value={formData.stock_item_id}
                  onChange={(e) => handleSelectStockItem(e.target.value)}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Choisir un équipement du stock</option>
                  {sourceItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom_equipement} - {item.type_equipement} - {item.type_stock} - Qte {item.quantite}{item.numero_serie ? ` - SN ${item.numero_serie}` : ''}
                    </option>
                  ))}
                </select>
              )}

              {isEntreeParc && (
                <select
                  value={formData.parc_item_id}
                  onChange={(e) => handleSelectParcItem(e.target.value)}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Choisir un équipement du parc</option>
                  {sourceItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom_equipement}{item.numero_serie ? ` - ${item.numero_serie}` : ''}
                    </option>
                  ))}
                </select>
              )}

              {isEntreeAchat && (
                <input
                  type="text"
                  placeholder="Nom équipement"
                  value={formData.nom_equipement}
                  onChange={(e) => setFormData({ ...formData, nom_equipement: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
              )}

              <input
                type="text"
                placeholder="Model"
                value={formData.model_equipement}
                onChange={(e) => setFormData({ ...formData, model_equipement: e.target.value })}
                className="p-2 border rounded"
                disabled={isSortie || isEntreeParc}
                hidden={isSortie || isEntreeParc}
              />

              <input
                type="text"
                placeholder="N° de série"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                className="p-2 border rounded"
                disabled={isSortie || isEntreeParc}
                hidden={isSortie || isEntreeParc}
              />

              <input
                type="number"
                placeholder="Quantité"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value || '0', 10) })}
                className="p-2 border rounded"
                min="1"
                max={isSortie && selectedStockItem ? selectedStockItem.quantite : undefined}
                required
                disabled={isEntreeParc || isSortie}
                hidden={isSortie || isEntreeParc}
              />

              {(isSortie || isEntreeParc) ? (
                <input
                  type="text"
                  value={formData.type_stock ? `Type stock: ${formData.type_stock}` : 'Type stock auto'}
                  className="p-2 border rounded bg-gray-50 text-gray-600"
                  disabled
                />
              ) : (
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
              )}

              {isEntree && (
                <input
                  type="date"
                  value={formData.date_affectation}
                  onChange={(e) => setFormData({ ...formData, date_affectation: e.target.value })}
                  className="p-2 border rounded"
                  disabled={isEntreeParc}
                  hidden={isEntreeParc}
                />
              )}

              <select
                value={formData.activite}
                onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                className="p-2 border rounded"
                required={isSortie}
              >
                <option value="">Sélectionner activité</option>
                {activiteOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {(isSortie || isEntreeParc) && (
              <div className="text-sm text-slate-500">
                {sourceLoading
                  ? 'Chargement des équipements...'
                  : `Résultats trouvés: ${sourceItems.length}`}
              </div>
            )}

            {isSortie && selectedStockItem && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-sky-800">Données récupérées depuis le Stock</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <p><span className="font-medium">Nom:</span> {selectedStockItem.nom_equipement || '-'}</p>
                  <p><span className="font-medium">Type:</span> {selectedStockItem.type_equipement || '-'}</p>
                  <p><span className="font-medium">Type stock:</span> {selectedStockItem.type_stock || '-'}</p>
                  <p><span className="font-medium">Quantité dispo:</span> {selectedStockItem.quantite ?? 0}</p>
                  <p><span className="font-medium">Model:</span> {selectedStockItem.model_equipement || '-'}</p>
                  <p><span className="font-medium">N° série:</span> {selectedStockItem.numero_serie || '-'}</p>
                </div>
              </div>
            )}

            {isEntreeParc && selectedParcItem && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-emerald-800">Données récupérées depuis le Parc</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <p><span className="font-medium">Nom:</span> {selectedParcItem.nom_equipement || '-'}</p>
                  <p><span className="font-medium">Type:</span> {selectedParcItem.type_equipement || '-'}</p>
                  <p><span className="font-medium">Model:</span> {selectedParcItem.model_equipement || '-'}</p>
                  <p><span className="font-medium">N° série:</span> {selectedParcItem.numero_serie || '-'}</p>
                  <p><span className="font-medium">Type stock destination:</span> {formData.type_stock || 'Commun'}</p>
                  <p><span className="font-medium">Date:</span> {formData.date_affectation || getTodayDateInput()}</p>
                </div>
              </div>
            )}

            {!isSortie && !isEntreeParc && (
              <textarea
                placeholder="Description du mouvement"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            )}

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
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {historyItems.length === 0 ? (
              <tr><td colSpan="6" className="p-3 text-center">Aucun historique</td></tr>
            ) : (
              historyItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.nom_equipement}</td>
                  <td className="p-3">{item.type_mouvement}</td>
                  <td className="p-3">{item.model_equipement || '-'}</td>
                  <td className="p-3">{item.numero_serie || '-'}</td>
                  <td className="p-3">{item.date_suppression ? new Date(item.date_suppression).toLocaleString() : '-'}</td>
                  <td className="p-3">
                    <RestrictedButton
                      onClick={() => handleRestoreHistory(item.id)}
                      requiredAction="edit"
                      className="mr-3 text-emerald-600 hover:text-emerald-800"
                    >
                      <RotateCcw size={16} />
                    </RestrictedButton>
                    <RestrictedButton
                      onClick={() => handleDeleteHistoryPermanent(item.id)}
                      requiredAction="edit"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
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