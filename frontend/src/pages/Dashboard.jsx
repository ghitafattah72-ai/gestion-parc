import React, { useEffect, useState } from 'react';
import { stockAPI, mouvementsAPI, locauxITAPI, parcAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    stock: [],
    stockByEquipment: [],
    stockTypes: {
      pc_portable: 0,
      pc_fixe: 0,
      ipo: 0,
    },
    mouvements: [],
    locaux: 0,
    parc: {
      pc_portable: 0,
      pc_fixe: 0,
      ipo: 0,
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
        stockByEquipment: stockRes.data.stats_by_equipment || [],
        stockTypes: {
          pc_portable: stockRes.data.pc_portable || 0,
          pc_fixe: stockRes.data.pc_fixe || 0,
          ipo: stockRes.data.ipo || 0,
        },
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
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] opacity-90">Bienvenue</p>
          <h2 className="mt-4 text-3xl font-bold">Tableau de bord de gestion</h2>
          <p className="mt-3 max-w-2xl text-sm text-sky-100">Suivez l'inventaire du stock, les mouvements, les locaux et l’état du parc informatique depuis un seul tableau de bord.</p>
        </div>
        <div className="rounded-[28px] bg-white p-6 shadow-lg border border-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Statut rapide</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-sm text-slate-500">Accès</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.role === 'admin' ? 'Modification' : 'Lecture'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-sm text-slate-500">Utilisateur</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.nom}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-[20px] shadow border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Stock</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard title="PC Portables" value={stats.stockTypes.pc_portable} tone="blue" alertThreshold={5} />
          <StatCard title="PC Fixes" value={stats.stockTypes.pc_fixe} tone="indigo" alertThreshold={5} />
          <StatCard title="IPO" value={stats.stockTypes.ipo} tone="violet" alertThreshold={5} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-4 rounded-[20px] shadow border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Parc</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard title="PC Portables" value={stats.parc.pc_portable} tone="emerald" alertThreshold={5} />
          <StatCard title="PC Fixes" value={stats.parc.pc_fixe} tone="teal" alertThreshold={5} />
          <StatCard title="IPO" value={stats.parc.ipo || 0} tone="cyan" alertThreshold={5} />
        </div>
      </div>

      {stats.parc?.stats?.length > 0 && (
        <div className="bg-white p-6 rounded-[28px] shadow-md border border-slate-200">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Répartition du Parc par Type</h3>
              <p className="text-sm text-slate-500">Vue globale des équipements présents dans le parc informatique.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.parc.stats} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0F766E" name="Équipements" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.stockByEquipment.length > 0 && (
        <div className="bg-white p-6 rounded-[28px] shadow-md border border-slate-200">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Répartition par Type de Stock</h3>
              <p className="text-sm text-slate-500">Pour chaque stock, affichage séparé des PC portables, PC fixes et IPO.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stockByEquipment} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type_stock" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pc_portable" fill="#2563EB" name="PC Portables" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pc_fixe" fill="#0F766E" name="PC Fixes" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ipo" fill="#7C3AED" name="IPO" radius={[6, 6, 0, 0]} />
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

function StatCard({ title, value, tone = 'blue', alertThreshold = null }) {
  const tones = {
    blue: {
      border: 'border-l-blue-500',
      title: 'text-blue-700',
      value: 'text-blue-900',
      panel: 'bg-white border-slate-200',
    },
    indigo: {
      border: 'border-l-indigo-500',
      title: 'text-indigo-700',
      value: 'text-indigo-900',
      panel: 'bg-white border-slate-200',
    },
    violet: {
      border: 'border-l-violet-500',
      title: 'text-violet-700',
      value: 'text-violet-900',
      panel: 'bg-white border-slate-200',
    },
    emerald: {
      border: 'border-l-emerald-500',
      title: 'text-emerald-700',
      value: 'text-emerald-900',
      panel: 'bg-white border-slate-200',
    },
    teal: {
      border: 'border-l-teal-500',
      title: 'text-teal-700',
      value: 'text-teal-900',
      panel: 'bg-white border-slate-200',
    },
    cyan: {
      border: 'border-l-cyan-500',
      title: 'text-cyan-700',
      value: 'text-cyan-900',
      panel: 'bg-white border-slate-200',
    },
    danger: {
      border: 'border-l-red-500',
      title: 'text-red-700',
      value: 'text-red-800',
      panel: 'bg-red-50 border-red-200',
    },
  };

  const isAlert = alertThreshold !== null && Number(value) <= alertThreshold;
  const palette = isAlert ? tones.danger : (tones[tone] || tones.blue);

  return (
    <div className={`p-6 rounded-lg border border-l-4 shadow-sm ${palette.panel} ${palette.border}`}>
      <h3 className={`text-lg font-semibold ${palette.title}`}>{title}</h3>
      <p className={`text-4xl font-bold mt-2 ${palette.value}`}>{value}</p>
    </div>
  );
}
