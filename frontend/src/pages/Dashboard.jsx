import React, { useEffect, useState } from 'react';
import { stockAPI, mouvementsAPI, locauxITAPI, parcAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    stock: [],
    mouvements: [],
    locaux: 0,
    parc: {
      pc_portable: 0,
      pc_fixe: 0,
      imprimante: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [stockRes, mouvementsRes, locauxRes, parcRes] = await Promise.all([
        stockAPI.getStats(),
        mouvementsAPI.getStats(),
        locauxITAPI.getAll(),
        parcAPI.getStats(),
      ]);

      setStats({
        stock: stockRes.data.stats,
        mouvements: mouvementsRes.data.stats,
        locaux: locauxRes.data?.length || 0,
        parc: parcRes.data,
      });
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Nombre de Stocks" value={stats.stock?.length || 0} color="from-sky-500 to-sky-600" />
        <StatCard title="Mouvements Actifs" value={stats.mouvements?.length || 0} color="from-emerald-500 to-emerald-600" />
        <StatCard title="Locaux IT" value={stats.locaux} color="from-violet-500 to-violet-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard title="PC Portables" value={stats.parc.pc_portable} color="from-rose-500 to-rose-600" />
        <StatCard title="PC Fixes" value={stats.parc.pc_fixe} color="from-amber-500 to-amber-600" />
        <StatCard title="Imprimantes" value={stats.parc.imprimante} color="from-indigo-500 to-indigo-600" />
      </div>

      {stats.stock.length > 0 && (
        <div className="bg-white p-6 rounded-[28px] shadow-md border border-slate-200">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Quantités par Type de Stock</h3>
              <p className="text-sm text-slate-500">Analyse visuelle de la disponibilité par catégorie.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stock}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type_stock" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_quantite" fill="#3B82F6" name="Quantité Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Résumé du Système</h3>
        <div className="space-y-2 text-gray-700">
          <p>✓ Application de gestion centralisée du parc informatique</p>
          <p>✓ Gestion des stocks par type (FSS, IMS, C2S, Commun)</p>
          <p>✓ Suivi des mouvements d'équipements</p>
          <p>✓ Gestion des locaux IT et des baies</p>
          <p>✓ Import/Export de données Excel</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-lg shadow`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}
