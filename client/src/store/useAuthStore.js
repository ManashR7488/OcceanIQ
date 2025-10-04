import { create } from "zustand";
import axiosInstance from "../config/axios.config";


const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("auth/login", userData);
      console.log(response, response.data);
      if (response.data.success) {
        set({ 
          isAuthenticated: true, 
          user: response.data.user, 
          isLoading: false,
          error: null 
        });
        return { success: true };
      } else {
        const errorMessage = response.data.message || "Login failed. Please try again.";
        set({ 
          isLoading: false, 
          error: errorMessage,
          isAuthenticated: false 
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false 
      });
      return { success: false, error: errorMessage };
    }
  },
  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("auth/signup", userData);
      if (response.data.success) {
        set({ 
          isAuthenticated: true, 
          user: response.data.user, 
          isLoading: false,
          error: null 
        });
        return { success: true };
      } else {
        const errorMessage = response.data.message || "Signup failed. Please try again.";
        set({ 
          isLoading: false, 
          error: errorMessage,
          isAuthenticated: false 
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false 
      });
      return { success: false, error: errorMessage };
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      await axiosInstance.post("auth/logout");
      set({ isAuthenticated: false, user: null, error: null });
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed. Please try again." };
    }
    finally{
      set({ isLoading: false });
    }
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("auth/profile");
      if (response.data.success) {
        set({ 
          isAuthenticated: true, 
          user: response.data.user, 
          isLoading: false 
        });
        return { success: true, user: response.data.user };
      } else {
        set({ 
          isAuthenticated: false, 
          user: null, 
          isLoading: false 
        });
        return { success: false };
      }
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
      return { success: false };
    }
  },
  updateUser: (userData) => {
    set({ user: userData });
  },
}));

export default useAuthStore;
