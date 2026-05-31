import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user:    null,
  token:   localStorage.getItem('neet_token') || null,
  loading: false,
  error:   null,

  // Hydrate user from stored token
  init: async () => {
    const token = localStorage.getItem('neet_token');
    if (!token) return;
    try {
      set({ loading: true });
      const { data } = await authAPI.getMe();
      set({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem('neet_token');
      set({ user: null, token: null, loading: false });
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      localStorage.setItem('neet_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ loading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('neet_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('neet_token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
