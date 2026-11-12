import { create } from "zustand";
import axiosInstance from "../config/axios.config";
import { toast } from "react-toastify";
import useAuthStore from "./useAuthStore";

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
      
      // Check both 'error' (Node backend) and 'detail' (FastAPI) fields
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           "Failed to generate research document";
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

  // Data Chat state
  uploadedDatasets: [],        // [{ id, filename, uploadDate, size, chunksStored, metadata }]
  activeDatasetId: null,        // Currently selected dataset for chat
  dataChatMessages: {},         // { [datasetId]: [{ role, message, timestamp, sources? }] }
  dataChatLoading: false,       // Legacy - kept for backward compatibility
  dataUploadLoading: false,     // Upload-specific loading state
  dataChatMessageLoading: false, // Chat send-specific loading state
  dataChatInput: '',            // Current input text
  uploadProgress: null,         // { percent, status } for upload feedback

  // Data Chat Actions
  uploadDataFile: async (file) => {
    const userId = useAuthStore.getState().user?._id;
    
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    // Validate file type
    const allowedExtensions = ['csv', 'json', 'xml', 'nc'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      toast.error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 50MB limit');
      return;
    }

    set({ dataUploadLoading: true, uploadProgress: { percent: 0, status: 'Uploading...' } });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const response = await axiosInstance.post('/ai/data-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          set({ uploadProgress: { percent, status: 'Uploading...' } });
        }
      });

      if (response.data.success) {
        // Verify id is present before updating state
        if (!response.data.id) {
          toast.error('Dataset uploaded but could not be saved. Please try again.');
          set({ dataUploadLoading: false, uploadProgress: null });
          return;
        }

        const dataset = {
          id: response.data.id, // MongoDB _id (not document_id)
          filename: response.data.filename,
          uploadDate: new Date().toISOString(),
          size: file.size,
          chunksStored: response.data.chunks_stored,
          metadata: {
            ...response.data.metadata,
            documentId: response.data.document_id,
            chunksStored: response.data.chunks_stored
          }
        };

        set({
          uploadedDatasets: [...get().uploadedDatasets, dataset],
          activeDatasetId: dataset.id,
          dataChatMessages: {
            ...get().dataChatMessages,
            [dataset.id]: []
          },
          dataUploadLoading: false,
          uploadProgress: null
        });

        console.log('Dataset uploaded:', {
          id: dataset.id,
          filename: dataset.filename,
          chunks: dataset.chunksStored,
          metadata: dataset.metadata
        });

        toast.success(`${file.name} uploaded successfully!`);
      } else {
        // Handle success === false
        const errorMessage = response.data.error || 
                             response.data.message || 
                             'Failed to upload file';
        toast.error(errorMessage);
        set({ dataUploadLoading: false, uploadProgress: null });
      }
    } catch (error) {
      console.error('Error uploading data file:', error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.details || 
                           'Failed to upload file';
      toast.error(errorMessage);
      set({ dataUploadLoading: false, uploadProgress: null });
    }
  },

  sendDataChatMessage: async (message, datasetId) => {
    const userId = useAuthStore.getState().user?._id;
    const activeId = datasetId || get().activeDatasetId;

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    if (!activeId) {
      toast.error('No dataset selected');
      return;
    }

    if (!message || message.trim().length === 0) {
      return;
    }

    set({ dataChatMessageLoading: true });

    // Optimistic update - add user message immediately
    const userMessage = {
      role: 'user',
      message: message.trim(),
      timestamp: Date.now()
    };

    const currentMessages = get().dataChatMessages[activeId] || [];
    set({
      dataChatMessages: {
        ...get().dataChatMessages,
        [activeId]: [...currentMessages, userMessage]
      },
      dataChatInput: '' // Clear input
    });

    try {
      // Get conversation history (last 10 messages)
      const history = currentMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.message
      }));

      // Single request - backend/microservice handle retries and fallback
      // No frontend retry loop to avoid compounding delays
      const response = await axiosInstance.post('/ai/data-chat', {
        query: message.trim(),
        dataset_id: activeId,
        conversation_history: history
      });

      if (response.data.success) {
        // Validate response structure
        if (!response.data.response || typeof response.data.response !== 'string') {
          console.error('[DataChat] Invalid response structure:', response.data);
          throw new Error('Invalid response format from server');
        }

        const aiMessage = {
          role: 'assistant',
          message: response.data.response,
          timestamp: Date.now(),
          sources: response.data.sources || []
        };

        // Validate aiMessage before adding to state
        if (!aiMessage.message) {
          console.error('[DataChat] aiMessage has no message content:', aiMessage);
          throw new Error('Empty response from AI');
        }

        const updatedMessages = get().dataChatMessages[activeId] || [];
        set({
          dataChatMessages: {
            ...get().dataChatMessages,
            [activeId]: [...updatedMessages, aiMessage]
          },
          dataChatMessageLoading: false
        });
      } else {
        // Handle success === false (structured error from microservice)
        const errorMessage = response.data.response || 
                             response.data.error || 
                             response.data.message || 
                             'Failed to get AI response';
        
        const errorMsg = {
          role: 'assistant',
          message: errorMessage,
          timestamp: Date.now(),
          isError: true,
          error_details: response.data.error_details || null,
          sources: response.data.sources || []
        };

        const updatedMessages = get().dataChatMessages[activeId] || [];
        set({
          dataChatMessages: {
            ...get().dataChatMessages,
            [activeId]: [...updatedMessages, errorMsg]
          },
          dataChatMessageLoading: false
        });

        // Only show toast for non-LLM errors (network, validation, etc.)
        if (!response.data.error_details) {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('[DataChat] Error sending message:', error);
      console.error('[DataChat] Error details:', {
        activeId,
        userId,
        message: message.substring(0, 100),
        errorResponse: error.response?.data,
        errorStatus: error.response?.status
      });
      
      let errorMessage = 'Failed to get AI response';
      let errorTip = '💡 Tip: Try asking about specific data fields (e.g., "What is the average temperature?" or "Show me salinity trends")';
      
      // Check for specific error types
      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        errorMessage = 'Request timeout after multiple retry attempts (100+ seconds). The query is too complex or the dataset is very large.';
        errorTip = '💡 Tip: Try a simpler question, reduce conversation history, or use a smaller dataset. The backend already retried with both AI models.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Dataset not found. Please re-upload your data.';
        errorTip = '💡 Tip: Check that you have selected the correct dataset from the sidebar.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid query format. Please try rephrasing your question.';
        errorTip = '💡 Tip: Try simpler questions like "What is the average?" or "Show me the data summary".';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while processing your query.';
        errorTip = '💡 Tip: The AI service may be temporarily unavailable. The backend already tried fallback models.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Add error message to chat with helpful context
      const errorMsg = {
        role: 'assistant',
        message: `❌ ${errorMessage}\n\n${errorTip}`,
        timestamp: Date.now(),
        isError: true,
        error_details: error.response?.data?.error_details || null
      };

      const updatedMessages = get().dataChatMessages[activeId] || [];
      set({
        dataChatMessages: {
          ...get().dataChatMessages,
          [activeId]: [...updatedMessages, errorMsg]
        },
        dataChatMessageLoading: false
      });

      toast.error(errorMessage);
    }
  },

  fetchUserDatasets: async () => {
    const userId = useAuthStore.getState().user?._id;
    
    if (!userId) {
      return; // Not authenticated, skip
    }
    
    try {
      const response = await axiosInstance.get('/data/datasets');
      
      if (response.data.success) {
        const datasets = response.data.datasets.map(ds => ({
          id: ds.id || ds._id,
          filename: ds.filename,
          uploadDate: ds.uploadDate,
          size: ds.fileSize,
          chunksStored: ds.metadata?.chunksStored,
          metadata: ds.metadata
        }));
        
        set({
          uploadedDatasets: datasets,
          activeDatasetId: datasets.length > 0 ? datasets[0].id : null,
          // Initialize empty chat messages for each dataset
          dataChatMessages: datasets.reduce((acc, ds) => {
            acc[ds.id] = [];
            return acc;
          }, {})
        });
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      // Silent fail - user can still upload new datasets
    }
  },

  deleteDataset: async (datasetId) => {
    try {
      await axiosInstance.delete(`/data/datasets/${datasetId}`);
      
      // Existing local state cleanup
      const datasets = get().uploadedDatasets.filter(ds => ds.id !== datasetId);
      const messages = { ...get().dataChatMessages };
      delete messages[datasetId];

      let newActiveId = get().activeDatasetId;
      if (newActiveId === datasetId) {
        newActiveId = datasets.length > 0 ? datasets[0].id : null;
      }

      set({
        uploadedDatasets: datasets,
        dataChatMessages: messages,
        activeDatasetId: newActiveId
      });

      toast.success('Dataset deleted');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    }
  },

  setActiveDataset: (datasetId) => set({ activeDatasetId: datasetId }),

  setDataChatInput: (text) => set({ dataChatInput: text }),

  resetDataChat: () => set({
    uploadedDatasets: [],
    activeDatasetId: null,
    dataChatMessages: {},
    dataChatLoading: false,
    dataUploadLoading: false,
    dataChatMessageLoading: false,
    dataChatInput: '',
    uploadProgress: null
  }),

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
    },
    // Also reset data-chat state
    uploadedDatasets: [],
    activeDatasetId: null,
    dataChatMessages: {},
    dataChatLoading: false,
    dataUploadLoading: false,
    dataChatMessageLoading: false,
    uploadProgress: null
  }),
}));

export default useAiStore;
