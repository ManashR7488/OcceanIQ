import { create } from "zustand";
import axiosInstance from "../config/axios.config";
import { toast } from "react-toastify";

const useAiStore = create((set, get) => ({
  // Existing chatbot state
  messages: [{ role: "Ai", message: "Hello! How can I assist you today...?", timestamp: Date.now() }],
  isShowChatBot: false,
  toggleChatBot: () =>
    set((state) => ({ isShowChatBot: !state.isShowChatBot })),
  openChatBot: () => set({ isShowChatBot: true }),
  closeChatBot: () => set({ isShowChatBot: false }),
  isLoading: false,
  
  // Chat mode state
  chatMode: 'normal', // 'normal' or 'research'
  setChatMode: (mode) => set({ chatMode: mode }),
  
  // Research mode state
  researchDocument: null,
  researchLoading: false,
  researchTopic: '',
  setResearchTopic: (topic) => set({ researchTopic: topic }),
  
  // Normal chat function (existing)
  // Normal chat function (existing)
  generateText: async (prompt) => {
    set({ isLoading: true });
    const userMessage = { role: "User", message: prompt, timestamp: Date.now() };
    try {
      set({ messages: [...get().messages, userMessage] });
      const response = await axiosInstance.post("/ai/chat", {
        prompt,
      });
      // console.log(response.data);
      set({
        messages: [
          ...get().messages,
          { role: "Ai", message: response.data.message || "Sorry, I didn't get that.", timestamp: Date.now() },
        ],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error generating text:", error);
      toast.error("Failed to get AI response");
      set({ isLoading: false });
    }
  },
  
  // Research mode function (new)
  generateResearch: async (topic) => {
    set({ researchLoading: true, researchDocument: null });
    toast.info('Generating research document... This may take a minute.');
    
    try {
      const response = await axiosInstance.post("/ai/research", { 
        topic: topic || get().researchTopic 
      });
      
      set({
        researchDocument: response.data.document,
        researchLoading: false,
      });
      
      toast.success('Research document generated successfully!');
    } catch (error) {
      console.error("Error generating research:", error);
      
      const errorMessage = error.response?.data?.error || "Failed to generate research document";
      toast.error(errorMessage);
      
      set({ researchLoading: false });
    }
  },
  
  // Clear research document
  clearResearchDocument: () => set({ 
    researchDocument: null, 
    researchTopic: '' 
  }),

  // AI Analytics state
  activeTab: 'correlations',
  
  // Correlation state
  correlationData: null,
  correlationLoading: false,
  
  // Prediction state
  predictionData: null,
  predictionLoading: false,
  selectedMetric: 'abundance',
  forecastDays: 30,
  
  // Query state
  queryResponse: null,
  queryLoading: false,
  queryInput: '',
  
  // Shared filters
  dateFilters: {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchCorrelations: async (filters) => {
    set({ correlationLoading: true });
    toast.info('Analyzing correlations...');
    try {
      const params = filters || get().dateFilters;
      const response = await axiosInstance.get('/analytics/correlations', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate
        }
      });
      set({ correlationData: response.data, correlationLoading: false });
      toast.success('Correlation analysis complete');
    } catch (error) {
      console.error('Error fetching correlations:', error);
      toast.error('Failed to load correlation data');
      set({ correlationLoading: false });
    }
  },

  fetchPredictions: async (metric, forecastDays) => {
    set({ predictionLoading: true });
    toast.info('Generating predictions...');
    try {
      const selectedMetric = metric || get().selectedMetric;
      const days = forecastDays || get().forecastDays;
      const params = get().dateFilters;
      const response = await axiosInstance.get('/analytics/predictions', {
        params: {
          metric: selectedMetric,
          forecastDays: days,
          startDate: params.startDate,
          endDate: params.endDate
        }
      });
      set({ predictionData: response.data, predictionLoading: false });
      toast.success('Predictions generated successfully');
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to generate predictions');
      set({ predictionLoading: false });
    }
  },

  handleQuery: async (question, filters) => {
    set({ queryLoading: true });
    try {
      const params = filters || get().dateFilters;
      const response = await axiosInstance.post('/analytics/query', {
        question: question,
        filters: {
          startDate: params.startDate,
          endDate: params.endDate
        }
      });
      set({ queryResponse: response.data, queryLoading: false });
    } catch (error) {
      console.error('Error processing query:', error);
      set({ queryLoading: false });
    }
  },

  setDateFilters: (filters) => set({ dateFilters: filters }),

  setPredictionParams: (metric, days) => {
    const updates = {};
    if (metric !== undefined) updates.selectedMetric = metric;
    if (days !== undefined) updates.forecastDays = days;
    set(updates);
  },

  setQueryInput: (text) => set({ queryInput: text }),

  resetAiState: () => set({
    activeTab: 'correlations',
    chatMode: 'normal',
    researchDocument: null,
    researchLoading: false,
    researchTopic: '',
    correlationData: null,
    correlationLoading: false,
    predictionData: null,
    predictionLoading: false,
    queryResponse: null,
    queryLoading: false,
    queryInput: '',
    selectedMetric: 'abundance',
    forecastDays: 30,
    dateFilters: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  }),
}));

export default useAiStore;
