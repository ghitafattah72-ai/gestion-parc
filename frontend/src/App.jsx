import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { authAPI } from './api';

// Import pages
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Mouvements from './pages/Mouvements';
import Dechet from './pages/Dechet';
import Parc from './pages/Parc';
import LocalsIT from './pages/LocalsIT';
import Login from './pages/Login';

// Import auth context
import { AuthProvider, useAuth } from './context/AuthContext';

const HUTCHINSON_LOGO_SVG_URL = 'https://cdn.brandfetch.io/hutchinson.com/icon.svg?c=1bfwsmEH20zzEfSNTed';
const HUTCHINSON_LOGO_FALLBACK_URL = 'https://cdn.brandfetch.io/hutchinson.com/icon?c=1bfwsmEH20zzEfSNTed';

function AppContent() {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Remplissez tous les champs');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('La confirmation du nouveau mot de passe est incorrecte');
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      alert('Mot de passe modifie avec succes');
      resetPasswordForm();
    } catch (error) {
      alert(error?.response?.data?.message || error?.response?.data?.error || 'Erreur lors du changement du mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(165deg,#e6edf5_0%,#f1f5fa_40%,#e9f0f8_100%)]">
      <div className="pointer-events-none absolute -left-28 -top-24 h-72 w-72 rounded-full bg-sky-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={HUTCHINSON_LOGO_SVG_URL}
              onError={(e) => {
                if (e.currentTarget.src !== HUTCHINSON_LOGO_FALLBACK_URL) {
                  e.currentTarget.src = HUTCHINSON_LOGO_FALLBACK_URL;
                }
              }}
              alt="Hutchinson"
              className="h-10 w-10 rounded-full bg-white p-1 object-contain shadow-sm"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Hutchinson</p>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 underline decoration-4 underline-offset-4 sm:text-xl">Gestion Parc IT</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 p-1 text-sm font-semibold text-slate-600 md:flex">
            <NavButton to="/">Tableau de Bord</NavButton>
            <NavButton to="/parc">Parc</NavButton>
            <NavButton to="/stock">Stock</NavButton>
            <NavButton to="/locaux-it">Locaux IT</NavButton>
            <NavButton to="/mouvements">Mouvements</NavButton>
            <NavButton to="/dechet">Dechets</NavButton>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="hidden text-right md:block"
              title="Changer le mot de passe"
            >
              <p className="text-sm font-semibold text-slate-700">{user?.nom}</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrateur' : 'Consultation'}</p>
            </button>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>

          <nav className="-mx-1 flex w-full items-center gap-2 overflow-x-auto px-1 pb-1 pt-1 text-sm font-semibold text-slate-600 md:hidden">
            <NavButton to="/">Dashboard</NavButton>
            <NavButton to="/parc">Parc</NavButton>
            <NavButton to="/stock">Stock</NavButton>
            <NavButton to="/locaux-it">Locaux IT</NavButton>
            <NavButton to="/mouvements">Mouvements</NavButton>
            <NavButton to="/dechet">Dechets</NavButton>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/mouvements" element={<Mouvements />} />
            <Route path="/dechet" element={<Dechet />} />
            <Route path="/parc" element={<Parc />} />
            <Route path="/locaux-it" element={<LocalsIT />} />
          </Routes>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Changer le mot de passe</h3>
            <p className="mt-1 text-sm text-slate-500">Mettez a jour votre mot de passe de connexion.</p>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400"
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400"
              />
              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetPasswordForm}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  disabled={passwordLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'En cours...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        `whitespace-nowrap rounded-full px-4 py-2 transition ${
          isActive
            ? 'bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] text-white shadow-[0_8px_16px_rgba(15,23,42,0.28)]'
            : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default AppWithAuth;

