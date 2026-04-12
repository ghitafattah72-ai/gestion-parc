import { useState, useCallback } from 'react';

/**
 * Hook for managing data loading, error, and pagination
 */
export const useDataLoading = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const setLoadingState = useCallback((state) => {
    setLoading(state);
  }, []);

  const setErrorState = useCallback((error) => {
    setError(error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    page,
    setLoadingState,
    setErrorState,
    resetError,
    setPage,
  };
};

/**
 * Hook for managing CRUD operations
 */
export const useCRUD = (api, onSuccess = () => {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(
    async (data) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.create(data);
        onSuccess();
        return response;
      } catch (err) {
        setError(err.message || 'Erreur lors de la création');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api, onSuccess]
  );

  const update = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.update(id, data);
        onSuccess();
        return response;
      } catch (err) {
        setError(err.message || 'Erreur lors de la mise à jour');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api, onSuccess]
  );

  const delete_ = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.delete(id);
        onSuccess();
        return response;
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api, onSuccess]
  );

  return {
    create,
    update,
    delete: delete_,
    loading,
    error,
    setError,
  };
};

/**
 * Hook for managing form state
 */
export const useForm = (initialState = {}, onSubmit) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  }, [errors]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await onSubmit(formData);
        setFormData(initialState);
      } catch (err) {
        if (err.fields) {
          setErrors(err.fields);
        }
      }
    },
    [formData, initialState, onSubmit]
  );

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    resetForm,
    errors,
    setErrors,
  };
};
