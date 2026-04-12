import React from 'react';
import { Download, AlertCircle } from 'lucide-react';

export function ExportButton({ onClick, format = 'csv', label = 'Exporter' }) {
  return (
    <button
      onClick={() => onClick(format)}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
    >
      <Download size={18} />
      {label} {format.toUpperCase()}
    </button>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export function ErrorAlert({ message }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
      <AlertCircle size={20} />
      {message}
    </div>
  );
}

export function SuccessAlert({ message }) {
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      {message}
    </div>
  );
}

export function WarningAlert({ message }) {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center gap-2">
      <AlertCircle size={20} />
      {message}
    </div>
  );
}
