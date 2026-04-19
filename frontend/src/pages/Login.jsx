import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const HUTCHINSON_LOGO_SVG_URL = 'https://cdn.brandfetch.io/hutchinson.com/icon.svg?c=1bfwsmEH20zzEfSNTed';
const HUTCHINSON_LOGO_FALLBACK_URL = 'https://cdn.brandfetch.io/hutchinson.com/icon?c=1bfwsmEH20zzEfSNTed';

function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      login(response.data.user, response.data.token);
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Erreur d\'authentification'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(155deg,#eef2f7_0%,#e3e9f1_48%,#f6f8fb_100%)] px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-slate-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center justify-center">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src={HUTCHINSON_LOGO_SVG_URL}
              onError={(e) => {
                if (e.currentTarget.src !== HUTCHINSON_LOGO_FALLBACK_URL) {
                  e.currentTarget.src = HUTCHINSON_LOGO_FALLBACK_URL;
                }
              }}
              alt="Logo Hutchinson"
              className="h-16 w-16 rounded-full bg-white p-2 shadow-sm"
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">HUTCHINSON</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Connexion</h1>
            <p className="mt-2 text-sm text-slate-500">Identifiez-vous pour acceder a votre espace.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nom d'utilisateur</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  placeholder="Entrez votre utilisateur"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Mot de passe</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  placeholder="Entrez votre mot de passe"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  disabled={loading}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#334155_100%)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-slate-500">Hutchinson - Gestion du Parc IT</p>
        </section>
      </div>
    </div>
  );
}

export default Login;
