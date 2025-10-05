import { create } from "zustand";
import axiosInstance from "../config/axios.config";

const useAiStore = create((set, get) => ({
  messages: [{ role: "Ai", message: "Hello! How can I assist you today?" }],
  isShowChatBot: false,
  toggleChatBot: () =>
    set((state) => ({ isShowChatBot: !state.isShowChatBot })),
  isLoading: false,
  generateText: async (prompt) => {
    set({ isLoading: true });
    try {
      set({ messages: [...get().messages, { role: "User", message: prompt }] });
      const response = await axiosInstance.post("/ai/generate-text", {
        prompt,
      });
      set({
        messages: [
          ...get().messages,
          { role: "Ai", message: response.data.text },
        ],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error generating text:", error);
      set({ isLoading: false });
    }
  },
}));

export default useAiStore;
