import {create} from 'zustand';
import axiosInstance from '../config/axios.config';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (userData) => {
    // Simulate a login API call
    const response = await axiosInstance.post('auth/login', userData);
    if (response.data.success) {
      set({ isAuthenticated: true, user: response.data.user });
    }
  },
  signup: async (userData) => {
    // Simulate a signup API call
    const response = await axiosInstance.post('auth/signup', userData);
    if (response.data.success) {
      set({ isAuthenticated: true, user: response.data.user });
    }
  },
  logout: async () => {
    // Simulate a logout API call
    await axiosInstance.post('/logout');
    set({ isAuthenticated: false, user: null });
  },
}));

export default useAuthStore;