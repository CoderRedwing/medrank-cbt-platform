import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user:    null,
  token:   localStorage.getItem('neet_token') || null,
  loading: false,
   initializing: !!localStorage.getItem('neet_token'),
  error:   null,

  // Hydrate user from stored token
  init: async () => {
    const token = localStorage.getItem('neet_token');
    if (!token){
      set({ initializing: false });
      return;
    } 
      
    try {
      set({ loading: true });
      const { data } = await authAPI.getMe();
      set({ user: data.user, token});
    } catch {
      localStorage.removeItem('neet_token');
      set({ user: null, token: null});
    } finally{
      set({ initializing: false , loading: false});
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
      const data = err.response?.data;
      const msg = data?.message 
  || data?.errors?.[0]?.msg  // ← validation errors
  || 'Registration failed';
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
    } finally{
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // Even if server call fails, clear local state
    }
    localStorage.removeItem('neet_token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  setUser: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),
}));


export default useAuthStore;
