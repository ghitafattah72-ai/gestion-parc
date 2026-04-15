/**
 * Utility function to download exported files (CSV/Excel)
 * @param {Blob} data - The file data
 * @param {string} filename - Name of the file to download
 */
export const downloadFile = (data, filename) => {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.parentElement && link.parentElement.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 150);
};

/**
 * Generic export handler
 * @param {Function} apiCall - API function to call
 * @param {string} format - Format to export (csv or xlsx)
 * @param {string} filename - Base filename without extension
 * @param {Object} params - Additional parameters
 */
export const handleExportFile = async (apiCall, format, filename, params = {}) => {
  try {
    const res = await apiCall(format, params);
    const extension = format === 'xlsx' ? 'xlsx' : 'csv';
    const fullFilename = `${filename}.${extension}`;
    downloadFile(res.data, fullFilename);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    let message = 'Erreur lors de l\'export';
    const responseData = error?.response?.data;

    if (responseData instanceof Blob) {
      try {
        const text = await responseData.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            message = parsed?.message || parsed?.error || parsed?.msg || message;
          } catch {
            message = text;
          }
        }
      } catch {
        // Keep default message
      }
    } else if (responseData && typeof responseData === 'object') {
      message = responseData.message || responseData.error || responseData.msg || message;
    }

    if (message === 'Erreur lors de l\'export') {
      const status = error?.response?.status;
      if (status === 401) message = 'Session expirée. Reconnectez-vous puis réessayez.';
      else if (status === 403) message = 'Vous n\'avez pas la permission d\'exporter des données.';
      else if (status >= 500) message = 'Erreur serveur pendant l\'export.';
    }

    throw new Error(message);
  }
};
  