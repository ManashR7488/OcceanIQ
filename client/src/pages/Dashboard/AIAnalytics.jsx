import React, { useEffect } from 'react';
import useAiStore from '../../store/useAiStore';
import { FiCpu, FiBarChart2, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';

function AIAnalytics() {
  const { openChatBot, toggleChatBot } = useAiStore();

  // Auto-open modal when component mounts
  useEffect(() => {
    openChatBot();
    
    // Clean up: close modal when component unmounts
    return () => {
      // Optional: you can leave it open or close it
    };
  }, [openChatBot]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 hover:-translate-y-1 transition-transform">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full">
                <FiCpu size={48} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
              AI-Powered Analytics
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access advanced AI analytics including correlation analysis, predictive trends, and natural language queries
            </p>
          </div>

          {/* Open AI Assistant Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={toggleChatBot}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white text-lg font-semibold rounded-lg hover:from-cyan-700 hover:via-blue-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-3"
            >
              <FiCpu size={24} />
              Open AI Assistant
            </button>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Correlations Card */}
            <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 hover:border-cyan-400 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <FiBarChart2 className="text-3xl text-cyan-600" />
                <h3 className="text-lg font-bold text-gray-800">Correlations</h3>
              </div>
              <p className="text-sm text-gray-600">
                Analyze relationships between environmental parameters and species distribution patterns
              </p>
            </div>

            {/* Predictions Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <FiTrendingUp className="text-3xl text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Predictions</h3>
              </div>
              <p className="text-sm text-gray-600">
                Forecast future biodiversity trends and environmental conditions using machine learning
              </p>
            </div>

            {/* AI Chat Card */}
            <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <FiMessageSquare className="text-3xl text-teal-600" />
                <h3 className="text-lg font-bold text-gray-800">AI Chat</h3>
              </div>
              <p className="text-sm text-gray-600">
                Query marine data using natural language and get intelligent insights instantly
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Powered by advanced AI models</span> to provide accurate analysis and predictions for marine biodiversity research
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIAnalytics;
 
