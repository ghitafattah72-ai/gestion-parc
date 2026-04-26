import React, { useEffect, useState } from 'react';
import { stockAPI, mouvementsAPI, locauxITAPI, parcAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = {
  pc_portable: '#2563EB',
  pc_fixe: '#0F766E',
  ipo: '#7C3AED',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-sm font-semibold text-slate-800">{label}</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">{entry.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const hiddenAxisLabels = new Set(['OILJK', 'POMLI7']);
  const allowedStockTypes = ['IMS', 'FSS', 'C2S', 'COMMUN'];
  const activiteLabels = ['IMS', 'FSS', 'C2S', 'Commun'];
  const formatAxisLabel = (value) => {
    const normalized = String(value || '').trim().toUpperCase();
    return hiddenAxisLabels.has(normalized) ? '' : value;
  };
  const [stats, setStats] = useState({
    stock: [],
    stockByEquipment: [],
    stockByActivite: [],
    parcByActivite: [],
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

  const filteredStockByEquipment = stats.stockByEquipment
    .filter((item) => allowedStockTypes.includes(String(item.type_stock || '').trim().toUpperCase()))
    .sort((a, b) => {
      const aIndex = allowedStockTypes.indexOf(String(a.type_stock || '').trim().toUpperCase());
      const bIndex = allowedStockTypes.indexOf(String(b.type_stock || '').trim().toUpperCase());
      return aIndex - bIndex;
    });

  const mouvementsEntree = stats.mouvements.find((m) => m.type_mouvement === 'entrée')?.total_quantite || 0;
  const mouvementsSortie = stats.mouvements.find((m) => m.type_mouvement === 'sortie')?.total_quantite || 0;
  const mouvementsTotal = Number(mouvementsEntree) + Number(mouvementsSortie);
  const totalStockQuantite = stats.stock.reduce((acc, item) => acc + Number(item.total_quantite || 0), 0);
  const stockByEquipmentChart = allowedStockTypes.map((label) => {
    const row = filteredStockByEquipment.find(
      (item) => String(item.type_stock || '').trim().toUpperCase() === label
    );
    return {
      type_stock: label === 'COMMUN' ? 'Commun' : label,
      pc_portable: Number(row?.pc_portable || 0),
      pc_fixe: Number(row?.pc_fixe || 0),
      ipo: Number(row?.ipo || 0),
    };
  });

  const parcByActiviteChart = activiteLabels.map((label) => {
    const row = stats.parcByActivite.find(
      (item) => String(item.activite || '').trim().toUpperCase() === label.toUpperCase()
    );
    return {
      activite: label,
      pc_portable: Number(row?.pc_portable || 0),
      pc_fixe: Number(row?.pc_fixe || 0),
      ipo: Number(row?.ipo || 0),
    };
  });

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
        stockByActivite: stockRes.data.stats_by_activite || [],
        parcByActivite: parcRes.data.stats_by_activite || [],
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] bg-white p-8 shadow-sm border border-slate-200 text-slate-600">
          Chargement du dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200"></p>
            <h2 className="mt-2 text-3xl font-bold">Tableau de Bord Opérationnel</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-200">Vue synthétique du stock, du parc et des mouvements pour suivre rapidement les volumes utiles.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-slate-300">Connecté en tant que</p>
            <p className="font-semibold">{user?.nom} ({user?.role === 'admin' ? 'Modification' : 'Lecture'})</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Stock total" value={totalStockQuantite} subtitle="Unités disponibles" tone="blue" />
        <KpiCard title="Parc total" value={stats.parc.total || 0} subtitle="Équipements affectés" tone="emerald" />
        <KpiCard title="Mouvements" value={mouvementsTotal} subtitle={`Entrées ${mouvementsEntree} | Sorties ${mouvementsSortie}`} tone="violet" />
        <KpiCard title="Locaux IT" value={stats.locaux} subtitle="Sites suivis" tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-[20px] shadow border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Stock par Type d'équipement</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="PC Portables" value={stats.stockTypes.pc_portable} tone="blue" alertThreshold={5} />
            <StatCard title="PC Fixes" value={stats.stockTypes.pc_fixe} tone="indigo" alertThreshold={5} />
            <StatCard title="IPO" value={stats.stockTypes.ipo} tone="violet" alertThreshold={5} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-4 rounded-[20px] shadow border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Parc par Type d'équipement</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="PC Portables" value={stats.parc.pc_portable} tone="emerald" alertThreshold={5} />
            <StatCard title="PC Fixes" value={stats.parc.pc_fixe} tone="teal" alertThreshold={5} />
            <StatCard title="IPO" value={stats.parc.ipo || 0} tone="cyan" alertThreshold={5} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-md border border-slate-200">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Répartition par Type de Stock</h3>
            <p className="text-sm text-slate-500">IMS, FSS, C2S et Commun affichés en permanence</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockByEquipmentChart} barGap={8} barCategoryGap="30%" margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="type_stock" tickFormatter={formatAxisLabel} tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={{ stroke: '#CBD5E1' }} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={{ stroke: '#CBD5E1' }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="pc_portable" fill={CHART_COLORS.pc_portable} name="PC Portables" radius={[8, 8, 0, 0]} maxBarSize={32} />
            <Bar dataKey="pc_fixe" fill={CHART_COLORS.pc_fixe} name="PC Fixes" radius={[8, 8, 0, 0]} maxBarSize={32} />
            <Bar dataKey="ipo" fill={CHART_COLORS.ipo} name="IPO" radius={[8, 8, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-md border border-slate-200">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Répartition du Parc par Activité</h3>
            <p className="text-sm text-slate-500">IMS, FSS, C2S et Commun affichés en permanence</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parcByActiviteChart} barGap={8} barCategoryGap="30%" margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="activite" tickFormatter={formatAxisLabel} tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={{ stroke: '#CBD5E1' }} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={{ stroke: '#CBD5E1' }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="pc_portable" fill={CHART_COLORS.pc_portable} name="PC Portables" radius={[8, 8, 0, 0]} maxBarSize={32} />
            <Bar dataKey="pc_fixe" fill={CHART_COLORS.pc_fixe} name="PC Fixes" radius={[8, 8, 0, 0]} maxBarSize={32} />
            <Bar dataKey="ipo" fill={CHART_COLORS.ipo} name="IPO" radius={[8, 8, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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

function KpiCard({ title, value, subtitle, tone = 'slate' }) {
  const tones = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900',
    violet: 'from-violet-50 to-violet-100 border-violet-200 text-violet-900',
    slate: 'from-slate-50 to-slate-100 border-slate-200 text-slate-900',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
