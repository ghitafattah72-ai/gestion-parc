import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  console.debug('API request:', config.method, config.baseURL + config.url, config.data || config.params || '');
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API response error:', error);
    return Promise.reject(error);
  }
);

// Stock API
export const stockAPI = {
  getAll: (page = 1, per_page = 10, type_stock = null, search = '') => 
    api.get('/stock/', { params: { page, per_page, type_stock, search } }),
  getById: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock/', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id) => api.delete(`/stock/${id}`),
  getStats: () => api.get('/stock/stats'),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/stock/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importTemplate: (format = 'xlsx') =>
    api.get('/stock/import-template', { params: { format }, responseType: 'blob' }),
  export: (format = 'csv', type_stock = null) => 
    api.get('/stock/export', { params: { format, type_stock }, responseType: 'blob' }),
};

// Mouvements API
export const mouvementsAPI = {
  getAll: (page = 1, per_page = 10, type_mouvement = null, search = '') =>
    api.get('/mouvements/', { params: { page, per_page, type_mouvement, search } }),
  getDechets: (page = 1, per_page = 10, search = '') =>
    api.get('/mouvements/dechets', { params: { page, per_page, search } }),
  getStockSources: (type_equipement, search = '') =>
    api.get('/mouvements/sources/stock', { params: { type_equipement, search } }),
  getParcSources: (type_equipement, search = '') =>
    api.get('/mouvements/sources/parc', { params: { type_equipement, search } }),
  getHistorique: () => api.get('/mouvements/historique'),
  restoreHistorique: (id) => api.put(`/mouvements/historique/${id}/restore`),
  deleteHistorique: (id) => api.delete(`/mouvements/historique/${id}`),
  getById: (id) => api.get(`/mouvements/${id}`),
  update: (id, data) => api.put(`/mouvements/${id}`, data),
  create: (data) => api.post('/mouvements/', data),
  delete: (id) => api.delete(`/mouvements/${id}`),
  getStats: () => api.get('/mouvements/stats'),
  export: (format = 'csv') =>
    api.get('/mouvements/export', { params: { format }, responseType: 'blob' }),
};

// Parc API
export const parcAPI = {
  getAll: (page = 1, per_page = 10, search = '') =>
    api.get('/parc/', { params: { page, per_page, search } }),
  getById: (id) => api.get(`/parc/${id}`),
  create: (data) => api.post('/parc/', data),
  update: (id, data) => api.put(`/parc/${id}`, data),
  delete: (id) => api.delete(`/parc/${id}`),
  getStats: () => api.get('/parc/stats'),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/parc/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importTemplate: (format = 'xlsx') =>
    api.get('/parc/import-template', { params: { format }, responseType: 'blob' }),
  export: (format = 'csv') =>
    api.get('/parc/export', { params: { format }, responseType: 'blob' }),
};

// Locaux IT API
export const locauxITAPI = {
  getAll: () => api.get('/locaux-it/'),
  getById: (id) => api.get(`/locaux-it/${id}`),
  create: (data) => api.post('/locaux-it/', data),
  update: (id, data) => api.put(`/locaux-it/${id}`, data),
  delete: (id) => api.delete(`/locaux-it/${id}`),
  initDefault: () => api.post('/locaux-it/default/init'),
  initDefaultBaies: () => api.post('/locaux-it/default/init-baies'),
  
  // Baies
  getBaies: (localId) => api.get(`/locaux-it/${localId}/baies`),
  getBaieById: (id) => api.get(`/locaux-it/baies/${id}`),
  createBaie: (localId, data) => api.post(`/locaux-it/${localId}/baies`, data),
  updateBaie: (id, data) => api.put(`/locaux-it/baies/${id}`, data),
  deleteBaie: (id) => api.delete(`/locaux-it/baies/${id}`),
  exportLocaux: (format = 'csv') =>
    api.get('/locaux-it/export', { params: { format }, responseType: 'blob' }),
  exportBaies: (format = 'csv') =>
    api.get('/locaux-it/baies/export', { params: { format }, responseType: 'blob' }),

  // Matériels IT (réseau)
  createMateriel: (data) => api.post('/locaux-it/materiels', data),
  transferMateriel: (id, data) => api.put(`/locaux-it/materiels/${id}/transfer`, data),
  deleteMateriel: (id) => api.delete(`/locaux-it/materiels/${id}`),
  importMateriel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/locaux-it/materiels/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importMaterielTemplate: (format = 'xlsx') =>
    api.get('/locaux-it/materiels/import-template', { params: { format }, responseType: 'blob' }),
};

// Utilisateurs API
export const utilisateursAPI = {
  getAll: () => api.get('/utilisateurs/'),
  getById: (id) => api.get(`/utilisateurs/${id}`),
  create: (data) => api.post('/utilisateurs/', data),
  updatePermissions: (id, data) => api.put(`/utilisateurs/${id}/permissions`, data),
  delete: (id) => api.delete(`/utilisateurs/${id}`),
};

// Auth API
export const authAPI = {
  login: (nom, password) => api.post('/auth/login', { nom, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (current_password, new_password) =>
    api.put('/auth/change-password', { current_password, new_password }),
};

export default api;
