/**
 * Utility function to download exported files (CSV/Excel)
 * @param {Blob} data - The file data
 * @param {string} filename - Name of the file to download
 */
export const downloadFile = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentElement.removeChild(link);
  window.URL.revokeObjectURL(url);
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
    throw new Error('Erreur lors de l\'export');
  }
};
  