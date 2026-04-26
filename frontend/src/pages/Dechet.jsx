import React, { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { mouvementsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { handleExportFile } from '../utils/fileExport';

export default function Dechet() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    loadDechets();
  }, [page, search]);

  const loadDechets = async () => {
    try {
      setLoading(true);
      const res = await mouvementsAPI.getDechets(page, 10, search);
      setItems(res.data.items || []);
      setPages(Math.max(1, res.data.pages || 1));
    } catch (error) {
      console.error('Erreur chargement dechets:', error);
      setItems([]);
      setPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      await handleExportFile(
        (fmt) => mouvementsAPI.exportDechets(fmt),
        format,
        'dechets'
      );
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold">Déchets</h2>
        <p className="mt-2 text-slate-200">Historique des sorties vers déchets depuis le stock.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={!hasPermission('export')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-400/60 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={!hasPermission('export')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-400/60 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent p-2 text-slate-700 outline-none"
            placeholder="Rechercher dans les déchets..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-100">
              <tr>
                <th className="p-3 text-left">Equipement</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Model</th>
                <th className="p-3 text-left">N Serie</th>
                <th className="p-3 text-left">Type Stock</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Motif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="7" className="p-4 text-center">Aucun mouvement dechet</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{item.nom_equipement}</td>
                    <td className="p-3">{item.type_equipement || '-'}</td>
                    <td className="p-3">{item.model_equipement || '-'}</td>
                    <td className="p-3">{item.numero_serie || '-'}</td>
                    <td className="p-3">{item.type_stock || '-'}</td>
                    <td className="p-3">{item.date_mouvement ? new Date(item.date_mouvement).toLocaleDateString() : '-'}</td>
                    <td className="p-3">{item.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Precedent
        </button>
        <span className="text-sm text-slate-600">Page {page} / {pages}</span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
          disabled={page >= pages}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
