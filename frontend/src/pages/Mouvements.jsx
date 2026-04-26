import React, { useEffect, useState } from 'react';
import { mouvementsAPI } from '../api';
import { Plus, Trash2, Download, Search, RotateCcw, Pencil } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';
import { handleExportFile } from '../utils/fileExport';

const equipmentTypes = [
  'pc portable', 'pc fixe', 'imprimante', 'étiquette', 'imprimante A4',
  'imprimante location', 'imprimante traceur', 'écran', 'câble', 'souris filaire',
  'clavier filaire', 'souris sans fil', 'clavier et souris filaire', 'douchettes', 'casque',
  'Toner-xerbox', 'Toner-Konic Puce', 'Toner-Konic sans Puce', 'autre'
];

const typeStocks = ['FSS', 'IMS', 'C2S', 'Commun'];
const mouvementTypes = ['Entrée', 'Sortie'];
const activiteOptions = ['FSS', 'IMS', 'C2S', 'Commun'];

const getTodayDateInput = () => new Date().toISOString().split('T')[0];

const getEmptyForm = () => ({
  type_mouvement: 'Entrée',
  source_entree: 'achat',
  sortie_mode: 'vers_parc',
  date_affectation: getTodayDateInput(),
  stock_item_id: '',
  parc_item_id: '',
  nom_equipement: '',
  type_equipement: '',
  model_equipement: '',
  numero_serie: '',
  quantite: 1,
  type_stock: '',
  etat: 'nouveau',
  ram: '',
  processeur: '',
  systeme: '',
  activite: '',
  alternate_username: '',
  os_version: '',
  manufacturer: '',
  disque_dur: '',
  emplacement: '',
  service: '',
  description: '',
});

export default function Mouvements() {
  const [items, setItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    const isSortieVersParc = isSortie && formData.sortie_mode === 'vers_parc';
    const isSortieVersDechet = isSortie && formData.sortie_mode === 'dechet';
    const selectedSortieItem = sourceItems.find((item) => String(item.id) === String(formData.stock_item_id));

    if (editingId) {
      const payload = {
        ...formData,
        source_entree: isSortie ? formData.sortie_mode : formData.source_entree,
        type_stock: isEntreeAchat ? (formData.type_stock || formData.activite || '') : formData.type_stock,
        quantite: isSortieVersDechet ? (selectedSortieItem?.quantite || 1) : 1,
      };

      try {
        await mouvementsAPI.update(editingId, payload);
        alert('Mouvement modifié avec succès');
        setFormData(getEmptyForm());
        setEditingId(null);
        setSourceItems([]);
        setSourceSearch('');
        setShowForm(false);
        loadMouvements();
        loadHistory();
      } catch (error) {
        console.error('Erreur:', error);
        const message = error?.response?.data?.error || 'Erreur lors de la modification du mouvement';
        alert(message);
      }
      return;
    }

    if (isSortie) {
      if (!formData.type_equipement || !formData.stock_item_id) {
        alert('Pour une sortie, choisissez le type et un équipement du stock');
        return;
      }
    }

    if (isEntreeAchat) {
      if (!formData.nom_equipement || !formData.type_equipement || !formData.activite) {
        alert('Pour une entrée achat, nom, type et activité sont obligatoires');
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
      quantite: isSortieVersDechet ? (selectedSortieItem?.quantite || 1) : 1,
      type_stock: isEntreeAchat ? (formData.activite || '') : formData.type_stock,
      activite: isSortieVersParc ? (formData.activite || formData.type_stock) : formData.activite,
    };

    try {
      await mouvementsAPI.create(payload);
      alert('Mouvement créé avec succès');
      setFormData(getEmptyForm());
      setEditingId(null);
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

  const handleEditMouvement = async (item) => {
    const mouvementType = (item.type_mouvement || '').toLowerCase() === 'sortie' ? 'Sortie' : 'Entrée';
    const sourceValeur = (item.source_entree || '').toLowerCase();
    const dateAffectation = item.date_mouvement
      ? new Date(item.date_mouvement).toISOString().split('T')[0]
      : getTodayDateInput();

    setFormData({
      ...getEmptyForm(),
      type_mouvement: mouvementType,
      source_entree: mouvementType === 'Entrée' ? (sourceValeur === 'parc' ? 'parc' : 'achat') : 'achat',
      sortie_mode: mouvementType === 'Sortie' ? (sourceValeur === 'dechet' ? 'dechet' : 'vers_parc') : 'vers_parc',
      date_affectation: dateAffectation,
      nom_equipement: item.nom_equipement || '',
      type_equipement: item.type_equipement || '',
      model_equipement: item.model_equipement || '',
      numero_serie: item.numero_serie || '',
      type_stock: item.type_stock || '',
      ram: item.ram || '',
      processeur: item.processeur || '',
      systeme: item.systeme || '',
      activite: item.activite || '',
      description: item.description || '',
    });
    setEditingId(item.id);
    setSourceItems([]);
    setSourceSearch('');
    setShowForm(true);
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
    if (editingId) return;
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
        ram: '',
        processeur: '',
        systeme: '',
        alternate_username: '',
        os_version: '',
        manufacturer: '',
        disque_dur: '',
        emplacement: '',
        service: '',
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
      ram: firstItem.ram || '',
      processeur: firstItem.processeur || '',
      systeme: firstItem.systeme || '',
      alternate_username: firstItem.alternate_username || '',
      os_version: firstItem.os_version || '',
      manufacturer: firstItem.manufacturer || '',
      disque_dur: firstItem.disque_dur || '',
      emplacement: firstItem.emplacement || '',
      service: firstItem.service || '',
      activite: firstItem.activite || prev.activite,
    }));
  }, [showForm, editingId, formData.type_mouvement, formData.source_entree, formData.type_equipement, formData.parc_item_id, sourceItems, sourceLoading]);

  useEffect(() => {
    const isSortie = formData.type_mouvement === 'Sortie';
    const isEntreeParc = formData.type_mouvement === 'Entrée' && formData.source_entree === 'parc';

    if (!isSortie && !isEntreeParc) {
      setSourceItems([]);
      setSourceLoading(false);
      return;
    }

    if (isEntreeParc && !formData.type_equipement) {
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
      sortie_mode: value === 'Sortie' ? 'vers_parc' : 'vers_parc',
      activite: '',
    });
    setSourceSearch('');
    setSourceItems([]);
  };

  const handleSortieModeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      sortie_mode: value,
      activite: value === 'dechet' ? '' : prev.activite,
      alternate_username: value === 'dechet' ? '' : prev.alternate_username,
      emplacement: value === 'dechet' ? '' : prev.emplacement,
      service: value === 'dechet' ? '' : prev.service,
    }));
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
      etat: 'nouveau',
      ram: '',
      processeur: '',
      systeme: '',
      alternate_username: '',
      os_version: '',
      manufacturer: '',
      disque_dur: '',
      emplacement: '',
      service: '',
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
      ram: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.ram,
      processeur: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.processeur,
      systeme: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.systeme,
      alternate_username: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.alternate_username,
      os_version: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.os_version,
      manufacturer: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.manufacturer,
      disque_dur: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.disque_dur,
      emplacement: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.emplacement,
      service: prev.type_mouvement === 'Sortie' || prev.source_entree === 'parc' ? '' : prev.service,
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
      etat: selected?.etat || prev.etat || 'nouveau',
      ram: selected?.ram || '',
      processeur: selected?.processeur || '',
      systeme: selected?.systeme || '',
      os_version: selected?.os_version || '',
      manufacturer: selected?.manufacturer || '',
      disque_dur: selected?.disque_dur || '',
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
      ram: selected?.ram || '',
      processeur: selected?.processeur || '',
      systeme: selected?.systeme || '',
      alternate_username: selected?.alternate_username || '',
      os_version: selected?.os_version || '',
      manufacturer: selected?.manufacturer || '',
      disque_dur: selected?.disque_dur || '',
      emplacement: selected?.emplacement || '',
      service: selected?.service || '',
      activite: selected?.activite || prev.activite,
      type_stock: prev.type_stock || 'Commun',
      date_affectation: prev.date_affectation || getTodayDateInput(),
    }));
  };

  const isEntree = formData.type_mouvement === 'Entrée';
  const isSortie = formData.type_mouvement === 'Sortie';
  const isSortieVersParc = isSortie && formData.sortie_mode === 'vers_parc';
  const isSortieVersDechet = isSortie && formData.sortie_mode === 'dechet';
  const isEntreeAchat = isEntree && formData.source_entree === 'achat';
  const isEntreeParc = isEntree && formData.source_entree === 'parc';
  const isEditMode = editingId !== null;
  const selectedStockItem = sourceItems.find((item) => String(item.id) === String(formData.stock_item_id));
  const selectedParcItem = sourceItems.find((item) => String(item.id) === String(formData.parc_item_id));

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gestion des Mouvements</h2>
            <p className="mt-2 max-w-2xl text-slate-200">Suivez les entrées et sorties du stock avec affectation, historique et export </p>
          </div>
          <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Download size={18} /> CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Download size={18} /> Excel
          </button>
          <RestrictedButton
            onClick={() => {
              setEditingId(null);
              setFormData(getEmptyForm());
              setShowForm(!showForm);
            }}
            requiredAction="edit"
            className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            <Plus size={18} /> Nouveau mouvement
          </RestrictedButton>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex gap-4">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un mouvement..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent p-2 text-slate-700 outline-none"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4">{isEditMode ? 'Modifier mouvement' : 'Entrée / Sortie de stock'}</h3>
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
                <select
                  value={formData.sortie_mode}
                  onChange={(e) => handleSortieModeChange(e.target.value)}
                  className="p-2 border rounded"
                  required={!isEditMode}
                >
                  <option value="vers_parc">Sortie depuis Stock vers Parc</option>
                  <option value="dechet">Sortie vers Déchet</option>
                </select>
              )}

              <select
                value={formData.type_equipement}
                onChange={(e) => handleTypeEquipementChange(e.target.value)}
                className="p-2 border rounded"
                required={isEntree}
              >
                <option value="">{isSortie ? 'Tous les types' : 'Sélectionner type équipement'}</option>
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
                  required={!isEditMode}
                >
                  <option value="">Choisir un équipement du stock</option>
                  {sourceItems.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.nom_equipement} - {item.type_equipement} - {item.type_stock}{item.numero_serie ? ` - SN ${item.numero_serie}` : ''}
                    </option>
                  ))}
                </select>
              )}

              {isSortie && !sourceLoading && sourceItems.length > 0 && (
                <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-700">Stock disponible</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sourceItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectStockItem(String(item.id))}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          String(formData.stock_item_id) === String(item.id)
                            ? 'border-sky-500 bg-sky-100 text-sky-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                        }`}
                      >
                        {item.nom_equipement}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isEntreeParc && (
                <select
                  value={formData.parc_item_id}
                  onChange={(e) => handleSelectParcItem(e.target.value)}
                  className="p-2 border rounded"
                  required={!isEditMode}
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
                disabled={(isEntreeParc || isSortie) && !isEditMode}
                hidden={isSortie && !isEditMode}
              />

              {(!isSortie || isEditMode) && (
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="p-2 border rounded"
                  disabled={isEntreeParc && !isEditMode}
                />
              )}

              <input
                type="text"
                placeholder="N° de série"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                className="p-2 border rounded"
                disabled={(isEntreeParc || isSortie) && !isEditMode}
                hidden={isSortie && !isEditMode}
              />

              {(isSortie || isEntreeParc) ? (
                <input
                  type="text"
                  value={formData.type_stock ? `Type stock: ${formData.type_stock}` : 'Type stock auto'}
                  className="p-2 border rounded bg-gray-50 text-gray-600"
                  disabled
                />
              ) : null}

              {(!isSortie || isEditMode) && (
                <select
                  value={formData.etat}
                  onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                  className="p-2 border rounded"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="occasion bon état">Occasion bon état</option>
                  <option value="occasion mauvaise état">Occasion mauvaise état</option>
                  <option value="en panne">En panne</option>
                </select>
              )}

              <input
                type="text"
                placeholder="RAM"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                className="p-2 border rounded"
                disabled={(isEntreeParc || isSortie) && !isEditMode}
                hidden={isSortie && !isEditMode}
              />

              <input
                type="text"
                placeholder="Processeur"
                value={formData.processeur}
                onChange={(e) => setFormData({ ...formData, processeur: e.target.value })}
                className="p-2 border rounded"
                disabled={(isEntreeParc || isSortie) && !isEditMode}
                hidden={isSortie && !isEditMode}
              />

              <input
                type="text"
                placeholder="Operating System - Name"
                value={formData.systeme}
                onChange={(e) => setFormData({ ...formData, systeme: e.target.value })}
                className="p-2 border rounded"
                disabled={(isEntreeParc || isSortie) && !isEditMode}
                hidden={isSortie && !isEditMode}
              />

              {(!isSortie || isEditMode) && (
                <input
                  type="text"
                  placeholder="Operating System - Version"
                  value={formData.os_version}
                  onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                  className="p-2 border rounded"
                  disabled={isEntreeParc && !isEditMode}
                />
              )}

              {(!isSortie || isEditMode) && (
                <input
                  type="text"
                  placeholder="Disque Dur"
                  value={formData.disque_dur}
                  onChange={(e) => setFormData({ ...formData, disque_dur: e.target.value })}
                  className="p-2 border rounded"
                  disabled={isEntreeParc && !isEditMode}
                />
              )}

              {isEntree && (
                <input
                  type="date"
                  value={formData.date_affectation}
                  onChange={(e) => setFormData({ ...formData, date_affectation: e.target.value })}
                  className="p-2 border rounded"
                  disabled={isEntreeParc && !isEditMode}
                  hidden={isEntreeParc && !isEditMode}
                />
              )}

              {(!isSortie || isEditMode) && (
                <select
                  value={formData.activite}
                  onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                  className="p-2 border rounded"
                >
                  <option value="">Sélectionner activité</option>
                  {activiteOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {isSortieVersParc && (
                <>
                  <input
                    type="text"
                    placeholder="Alternate username"
                    value={formData.alternate_username}
                    onChange={(e) => setFormData({ ...formData, alternate_username: e.target.value })}
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
                </>
              )}
            </div>

            {(isSortie || isEntreeParc) && (
              <div className="text-sm text-slate-500">
                {sourceLoading
                  ? 'Chargement des équipements...'
                  : `Résultats trouvés: ${sourceItems.length}`}
                {!sourceLoading && isSortie && sourceItems.length === 0 && (
                  <p className="mt-1 text-amber-700">
                    Aucun élément disponible pour sortie. Vérifiez que le type est choisi et que la quantité en stock est supérieure à 0.
                  </p>
                )}
                {!sourceLoading && isSortie && sourceItems.length > 0 && (
                  <p className="mt-1 text-slate-600">
                    {isSortieVersDechet
                      ? 'Sélectionnez un équipement du stock pour l’envoyer au déchet.'
                      : 'Seuls les équipements avec une quantité supérieure à 0 apparaissent dans cette liste.'}
                  </p>
                )}
              </div>
            )}

            {isSortie && selectedStockItem && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-sky-800">Données récupérées depuis le Stock</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <p><span className="font-medium">Nom:</span> {selectedStockItem.nom_equipement || '-'}</p>
                  <p><span className="font-medium">Type:</span> {selectedStockItem.type_equipement || '-'}</p>
                  <p><span className="font-medium">Type stock:</span> {selectedStockItem.type_stock || '-'}</p>
                  {!isSortieVersDechet && (
                    <p><span className="font-medium">Quantité dispo:</span> {selectedStockItem.quantite ?? 0}</p>
                  )}
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

            <textarea
              placeholder="Motif"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(getEmptyForm());
                  setSourceItems([]);
                  setSourceSearch('');
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{isEditMode ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-100">
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
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                      onClick={() => handleEditMouvement(item)}
                      requiredAction="edit"
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      <Pencil size={18} />
                    </RestrictedButton>
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
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold">Historique des mouvements supprimés</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-100">
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
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Précédent
        </button>
        <span className="text-slate-600">Page {page} sur {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}