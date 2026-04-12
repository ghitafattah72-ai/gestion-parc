import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

// Import pages
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Mouvements from './pages/Mouvements';
import Parc from './pages/Parc';
import LocalsIT from './pages/LocalsIT';
import Login from './pages/Login';

// Import auth context
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion Parc IT</h1>
          </div>

          <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
            <NavButton to="/">Tableau de Bord</NavButton>
            <NavButton to="/stock">Stock</NavButton>
            <NavButton to="/mouvements">Mouvements</NavButton>
            <NavButton to="/parc">Parc</NavButton>
            <NavButton to="/locaux-it">Locaux IT</NavButton>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm text-slate-700 font-semibold">{user?.nom}</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrateur' : 'Consultation'}</p>
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] mb-6">
          <div className="rounded-[28px] bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-white shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] opacity-90">Bienvenue</p>
            <h2 className="mt-4 text-3xl font-bold">Tableau de bord de gestion</h2>
            <p className="mt-3 max-w-2xl text-sm text-sky-100">Suivez l’inventaire du stock, les mouvements, les locaux et l’état du parc informatique depuis un seul tableau de bord.</p>
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-lg border border-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Statut rapide</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Accès</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.role === 'admin' ? 'Modification' : 'Lecture'}</p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Utilisateur</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.nom}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-sm border border-slate-200">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/mouvements" element={<Mouvements />} />
            <Route path="/parc" element={<Parc />} />
            <Route path="/locaux-it" element={<LocalsIT />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return <AppContent />;
}

function NavButton({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default AppWithAuth;

