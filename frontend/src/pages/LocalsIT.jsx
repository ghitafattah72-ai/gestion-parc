import React, { useEffect, useRef, useState } from 'react';
import { locauxITAPI } from '../api';
import { Plus, Trash2, Building2, ChevronDown, ChevronRight, Server, Download, ArrowRightLeft } from 'lucide-react';
import { RestrictedButton } from '../components/ProtectedRoute';
import { handleExportFile } from '../utils/fileExport';

const TYPES_BAIE = [
  'sw-core', 'sw-management', 'sw-acces', 'sw-tor', 'sw-hcs',
  'controleur wifi', 'firewallHCS', 'firewall', 'HCS',
  'routeur', 'IPBX', 'serveur', 'serveur HCS', 'baie de STOCKAGE', 'NAS', 'autres',
];

const TYPES_LOCAL = ['sw-Access', "point d'accès", 'autres'];

const EMPTY_MATERIEL = {
  type_materiel: '', nom: '', modele: '', version: '',
  os_firmware: '', numero_serie: '', stack_role: '', stack_ip: '', description: '',
};

export default function LocalsIT() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(false);

  // which local is expanded
  const [expandedLocal, setExpandedLocal] = useState(null);
  // which baie is expanded
  const [expandedBaie, setExpandedBaie] = useState(null);

  // modals
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [showBaieForm, setShowBaieForm] = useState(null); // localId
  const [materielModal, setMaterielModal] = useState(null); // { type: 'baie'|'local', id: baieId|localId }
  const [transferModal, setTransferModal] = useState(null); // { materielId, nom, currentLocalId, currentBaieId }

  const [localForm, setLocalForm] = useState({ nom: '' });
  const [baieFormNom, setBaieFormNom] = useState('');
  const [materielForm, setMaterielForm] = useState(EMPTY_MATERIEL);
  const [transferForm, setTransferForm] = useState({ local_it_id: '', baie_id: '' });
  const [saving, setSaving] = useState(false);
  const baieFormRef = useRef(null);

  useEffect(() => { loadLocaux(); }, []);

  useEffect(() => {
    if (showBaieForm && baieFormRef.current) {
      baieFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showBaieForm]);

  const loadLocaux = async () => {
    try {
      setLoading(true);
      const res = await locauxITAPI.getAll();
      setLocaux(res.data);
    } catch {
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  /* ---- LOCAL ---- */
  const handleAddLocal = async (e) => {
    e.preventDefault();
    try {
      await locauxITAPI.create(localForm);
      setLocalForm({ nom: '' });
      setShowLocalForm(false);
      loadLocaux();
    } catch { alert('✗ Erreur ajout local'); }
  };

  const handleDeleteLocal = async (id) => {
    if (!window.confirm('Supprimer ce local (et ses baies) ?')) return;
    try {
      await locauxITAPI.delete(id);
      if (expandedLocal === id) setExpandedLocal(null);
      loadLocaux();
    } catch { alert('✗ Erreur suppression'); }
  };

  /* ---- BAIE ---- */
  const handleAddBaie = async (e, localId) => {
    e.preventDefault();
    if (!baieFormNom.trim()) return;
    try {
      await locauxITAPI.createBaie(localId, { nom: baieFormNom });
      setBaieFormNom('');
      setShowBaieForm(null);
      loadLocaux();
    } catch { alert('✗ Erreur ajout baie'); }
  };

  const handleDeleteBaie = async (id) => {
    if (!window.confirm('Supprimer cette baie ?')) return;
    try {
      await locauxITAPI.deleteBaie(id);
      if (expandedBaie === id) setExpandedBaie(null);
      loadLocaux();
    } catch { alert('✗ Erreur suppression baie'); }
  };

  /* ---- MATERIEL ---- */
  const handleAddMateriel = async (e) => {
    e.preventDefault();
    if (!materielModal) return;
    setSaving(true);
    try {
      const payload = {
        ...materielForm,
        baie_id: materielModal.type === 'baie' ? materielModal.id : null,
        local_it_id: materielModal.type === 'local' ? materielModal.id : null,
      };
      await locauxITAPI.createMateriel(payload);
      setMaterielModal(null);
      setMaterielForm(EMPTY_MATERIEL);
      loadLocaux();
    } catch { alert('✗ Erreur ajout matériel'); }
    finally { setSaving(false); }
  };

  const handleDeleteMateriel = async (id) => {
    if (!window.confirm('Supprimer ce matériel ?')) return;
    try {
      await locauxITAPI.deleteMateriel(id);
      loadLocaux();
    } catch { alert('✗ Erreur suppression matériel'); }
  };

  const openMaterielModal = (type, id) => {
    setMaterielForm(EMPTY_MATERIEL);
    setMaterielModal({ type, id });
  };

  const openTransferModal = (materiel, context) => {
    setTransferModal({
      materielId: materiel.id,
      nom: materiel.nom,
      currentLocalId: context.currentLocalId,
      currentBaieId: context.currentBaieId || null,
    });
    setTransferForm({
      local_it_id: String(context.currentLocalId || ''),
      baie_id: '',
    });
  };

  const handleTransferMateriel = async (e) => {
    e.preventDefault();
    if (!transferModal) return;

    const payload = transferForm.baie_id
      ? { baie_id: Number(transferForm.baie_id) }
      : transferForm.local_it_id
        ? { local_it_id: Number(transferForm.local_it_id) }
        : null;

    if (!payload) {
      alert('Choisissez une destination');
      return;
    }

    setSaving(true);
    try {
      await locauxITAPI.transferMateriel(transferModal.materielId, payload);
      setTransferModal(null);
      setTransferForm({ local_it_id: '', baie_id: '' });
      loadLocaux();
    } catch (error) {
      alert(error?.response?.data?.error || 'Erreur lors du transfert');
    } finally {
      setSaving(false);
    }
  };

  const selectedTransferLocal = locaux.find((local) => String(local.id) === String(transferForm.local_it_id));
  const selectedTransferBaies = selectedTransferLocal?.baies || [];

  const handleExportLocaux = async (format) => {
    try {
      await handleExportFile(
        (fmt) => locauxITAPI.exportLocaux(fmt),
        format,
        'locaux_it'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExportBaies = async (format) => {
    try {
      await handleExportFile(
        (fmt) => locauxITAPI.exportBaies(fmt),
        format,
        'baies_it'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  /* ---- RENDER ---- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Building2 size={32} /> Gestion des Locaux IT
            </h2>
            <p className="mt-2 text-slate-300 text-sm">Naviguez dans vos locaux, baies et matériels réseau.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RestrictedButton
              onClick={() => handleExportLocaux('csv')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Download size={16} /> Locaux CSV
            </RestrictedButton>
            <RestrictedButton
              onClick={() => handleExportLocaux('xlsx')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Download size={16} /> Locaux Excel
            </RestrictedButton>
            <RestrictedButton
              onClick={() => handleExportBaies('csv')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
            >
              <Download size={16} /> Baies CSV
            </RestrictedButton>
            <RestrictedButton
              onClick={() => handleExportBaies('xlsx')}
              requiredAction="export"
              className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Download size={16} /> Baies Excel
            </RestrictedButton>
            <RestrictedButton
              onClick={() => setShowLocalForm(true)}
              requiredAction="edit"
              className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
            >
              <Plus size={18} /> Ajouter un local
            </RestrictedButton>
          </div>
        </div>
      </div>

      {/* Add Local Modal */}
      {showLocalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl border-l-4 border-sky-500">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Ajouter un Local IT</h3>
              <button onClick={() => setShowLocalForm(false)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Fermer</button>
            </div>
            <form onSubmit={handleAddLocal} className="space-y-3">
              <input type="text" placeholder="Nom du local (ex: CIM6)" value={localForm.nom}
                onChange={(e) => setLocalForm({ ...localForm, nom: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowLocalForm(false)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Baie Modal */}
      {showBaieForm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div ref={baieFormRef} className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl border-l-4 border-green-500">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Ajouter une Baie</h3>
              <button onClick={() => setShowBaieForm(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Fermer</button>
            </div>
            <form onSubmit={(e) => handleAddBaie(e, showBaieForm)} className="space-y-3">
              <input type="text" placeholder="Nom de la baie (ex: Baie 1)" value={baieFormNom}
                onChange={(e) => setBaieFormNom(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowBaieForm(null)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Matériel Modal */}
      {materielModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl border-l-4 border-violet-500">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Ajouter un Matériel</h3>
              <button onClick={() => setMaterielModal(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Fermer</button>
            </div>
            <form onSubmit={handleAddMateriel} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-600">Type *</label>
                  <select value={materielForm.type_materiel}
                    onChange={(e) => setMaterielForm({ ...materielForm, type_materiel: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" required>
                    <option value="">Sélectionner un type</option>
                    {(materielModal.type === 'baie' ? TYPES_BAIE : TYPES_LOCAL).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">Nom *</label>
                  <input type="text" placeholder="Nom" value={materielForm.nom}
                    onChange={(e) => setMaterielForm({ ...materielForm, nom: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">Modèle</label>
                  <input type="text" placeholder="Modèle" value={materielForm.modele}
                    onChange={(e) => setMaterielForm({ ...materielForm, modele: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">Version</label>
                  <input type="text" placeholder="Version" value={materielForm.version}
                    onChange={(e) => setMaterielForm({ ...materielForm, version: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">OS </label>
                  <input type="text" placeholder="Système / Firmware" value={materielForm.os_firmware}
                    onChange={(e) => setMaterielForm({ ...materielForm, os_firmware: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">N° de série</label>
                  <input type="text" placeholder="N° de série" value={materielForm.numero_serie}
                    onChange={(e) => setMaterielForm({ ...materielForm, numero_serie: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">Stack rôle</label>
                  <input type="text" placeholder="Stack rôle" value={materielForm.stack_role}
                    onChange={(e) => setMaterielForm({ ...materielForm, stack_role: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-600">Stack IP</label>
                  <input type="text" placeholder="Stack IP" value={materielForm.stack_ip}
                    onChange={(e) => setMaterielForm({ ...materielForm, stack_ip: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-600">Description</label>
                  <textarea placeholder="Description" value={materielForm.description}
                    onChange={(e) => setMaterielForm({ ...materielForm, description: e.target.value })}
                    rows={2}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setMaterielModal(null)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-medium">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50">
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-[20px] bg-white p-6 shadow-2xl border-l-4 border-amber-500">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Transférer un Matériel</h3>
              <button onClick={() => setTransferModal(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Fermer</button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Destination pour <span className="font-semibold text-slate-900">{transferModal.nom}</span>
            </p>
            <form onSubmit={handleTransferMateriel} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Local destination</label>
                <select
                  value={transferForm.local_it_id}
                  onChange={(e) => setTransferForm({ local_it_id: e.target.value, baie_id: '' })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Sélectionner un local </option>
                  {locaux.map((local) => (
                    <option key={local.id} value={local.id}>{local.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Baie distination </label>
                <select
                  value={transferForm.baie_id}
                  onChange={(e) => setTransferForm({ ...transferForm, baie_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={!transferForm.local_it_id || selectedTransferBaies.length === 0}
                >
                  <option value="">Sélectionner une baie </option>
                  {selectedTransferBaies.map((baie) => (
                    <option key={baie.id} value={baie.id}>{baie.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTransferModal(null)} className="rounded-lg bg-slate-200 px-4 py-2 font-medium hover:bg-slate-300">Annuler</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                  {saving ? 'Transfert...' : 'Transférer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locaux list */}
      {loading ? (
        <div className="text-center p-12 text-slate-500">Chargement...</div>
      ) : locaux.length === 0 ? (
        <div className="text-center p-12 text-slate-400">Aucun local IT</div>
      ) : (
        <div className="space-y-4">
          {locaux.map(local => (
            <div key={local.id} className="rounded-[20px] bg-white shadow border border-slate-200 overflow-hidden">
              {/* Local header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setExpandedLocal(expandedLocal === local.id ? null : local.id)}
              >
                <div className="flex items-center">
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{local.nom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium">
                    {local.baies?.length || 0} baie(s)
                  </span>
                  <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-1 font-medium">
                    {local.materiels?.length || 0} matériel(s)
                  </span>
                  <RestrictedButton
                    onClick={() => setShowBaieForm(local.id)}
                    requiredAction="edit"
                    className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                  >
                    <Plus size={14} /> Baie
                  </RestrictedButton>
                  <RestrictedButton
                    onClick={() => openMaterielModal('local', local.id)}
                    requiredAction="edit"
                    className="flex items-center gap-1 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600"
                  >
                    <Plus size={14} /> Matériel
                  </RestrictedButton>
                  <RestrictedButton
                    onClick={() => handleDeleteLocal(local.id)}
                    requiredAction="edit"
                    className="text-red-400 hover:text-red-600 transition p-1"
                  >
                    <Trash2 size={16} />
                  </RestrictedButton>
                </div>
              </div>

              {/* Expanded local content */}
              {expandedLocal === local.id && (
                <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-4">

                  {/* Direct materiels on local */}
                  {local.materiels && local.materiels.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Matériels directs</p>
                      <MaterielTable
                        materiels={local.materiels}
                        onDelete={handleDeleteMateriel}
                        onTransfer={openTransferModal}
                        currentLocalId={local.id}
                        currentBaieId={null}
                      />
                    </div>
                  )}

                  {/* Baies */}
                  {local.baies && local.baies.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Baies</p>
                      {local.baies.map(baie => (
                        <div key={baie.id} className="rounded-[14px] border border-slate-200 overflow-hidden">
                          {/* Baie header */}
                          <div
                            className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                            onClick={() => setExpandedBaie(expandedBaie === baie.id ? null : baie.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedBaie === baie.id
                                ? <ChevronDown size={16} className="text-green-500" />
                                : <ChevronRight size={16} className="text-slate-400" />}
                              <Server size={16} className="text-green-500" />
                              <span className="font-semibold text-slate-800">{baie.nom}</span>
                              <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium">
                                {baie.materiels?.length || 0} matériel(s)
                              </span>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <RestrictedButton
                                onClick={() => openMaterielModal('baie', baie.id)}
                                requiredAction="edit"
                                className="flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-600"
                              >
                                <Plus size={13} /> Matériel
                              </RestrictedButton>
                              <RestrictedButton
                                onClick={() => handleDeleteBaie(baie.id)}
                                requiredAction="edit"
                                className="text-red-400 hover:text-red-600 transition p-1"
                              >
                                <Trash2 size={14} />
                              </RestrictedButton>
                            </div>
                          </div>

                          {/* Baie content */}
                          {expandedBaie === baie.id && (
                            <div className="px-4 py-3 border-t border-slate-100">
                              {baie.materiels && baie.materiels.length > 0
                                ? <MaterielTable
                                    materiels={baie.materiels}
                                    onDelete={handleDeleteMateriel}
                                    onTransfer={openTransferModal}
                                    currentLocalId={local.id}
                                    currentBaieId={baie.id}
                                  />
                                : <p className="text-sm text-slate-400 text-center py-4">Aucun matériel dans cette baie</p>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Aucune baie dans ce local</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MaterielTable({ materiels, onDelete, onTransfer, currentLocalId, currentBaieId }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['Type', 'Nom', 'Modèle', 'Version', 'OS', 'N° Série', 'Stack Rôle', 'Stack IP', ''].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {materiels.map(m => (
            <tr key={m.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-violet-700 whitespace-nowrap">{m.type_materiel}</td>
              <td className="px-3 py-2 whitespace-nowrap">{m.nom}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.modele || '—'}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.version || '—'}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.os_firmware || '—'}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.numero_serie || '—'}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.stack_role || '—'}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{m.stack_ip || '—'}</td>
              <td className="px-3 py-2">
                <RestrictedButton
                  onClick={() => onTransfer(m, { currentLocalId, currentBaieId })}
                  requiredAction="edit"
                  className="mr-3 text-amber-500 hover:text-amber-700"
                >
                  <ArrowRightLeft size={14} />
                </RestrictedButton>
                <RestrictedButton
                  onClick={() => onDelete(m.id)}
                  requiredAction="edit"
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </RestrictedButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
