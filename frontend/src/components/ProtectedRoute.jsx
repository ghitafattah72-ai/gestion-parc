import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

export function ProtectedRoute({ children, requiredAction = 'edit' }) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return null;
  }

  if (!hasPermission(requiredAction)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <Lock size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Refusé</h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Votre rôle actuel: <strong>{user.role === 'admin' ? '👑 Administrateur' : '👁️ Consultation'}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Contactez un administrateur pour obtenir les permissions requises.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export function RestrictedButton({ children, requiredAction = 'edit', ...props }) {
  const { hasPermission } = useAuth();

  return (
    <button
      {...props}
      disabled={!hasPermission(requiredAction) || props.disabled}
      className={props.className + (hasPermission(requiredAction) ? '' : ' opacity-50 cursor-not-allowed')}
      title={!hasPermission(requiredAction) ? 'Vous n\'avez pas les permissions pour cette action' : ''}
    >
      {children}
    </button>
  );
}
