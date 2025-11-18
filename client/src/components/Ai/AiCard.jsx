import React, { useState, useEffect } from 'react';
import { FiX, FiBarChart2, FiTrendingUp, FiMessageSquare, FiAlertCircle, FiArrowUp, FiArrowDown, FiMinus, FiSend, FiDownload, FiEye, FiRefreshCw } from 'react-icons/fi';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import useAiStore from '../../store/useAiStore';
import { toast } from 'react-toastify';
import { generateResearchReportPDF, previewResearchDocument } from '../../utils/pdfGenerator';

const AiCard = () => {
  const {
    isShowChatBot,
    closeChatBot,
    activeTab,
    setActiveTab,
    correlationData,
    correlationLoading,
    predictionData,
    predictionLoading,
    queryResponse,
    queryLoading,
    dateFilters,
    selectedMetric,
    forecastDays,
    queryInput,
    fetchCorrelations,
    fetchPredictions,
    handleQuery,
    setDateFilters,
    setPredictionParams,
    setQueryInput,
    resetAiState,
    messages,
    generateText,
    isLoading,
    chatMode,
    setChatMode,
    researchDocument,
    researchLoading,
    researchTopic,
    setResearchTopic,
    generateResearch,
    clearResearchDocument,
  } = useAiStore();

  const chatMessagesEndRef = React.useRef(null);
  const modalRef = React.useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [localResearchTopic, setLocalResearchTopic] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'chat' && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // ESC key handler and focus trap
  useEffect(() => {
    if (!isShowChatBot) return;

    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleFocusTrap = (e) => {
      if (!modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleFocusTrap);

    // Focus first element when modal opens
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea');
      if (firstFocusable) firstFocusable.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isShowChatBot]);

  // Example questions
  const exampleQuestions = [
    "What is the correlation between temperature and species diversity?",
    "Show me biodiversity trends in the last 30 days",
    "Which environmental factors most affect species abundance?"
  ];

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get trend icon
  const getTrendIcon = (direction) => {
    if (direction === 'increasing') return <FiArrowUp className="text-green-500" />;
    if (direction === 'decreasing') return <FiArrowDown className="text-red-500" />;
    return <FiMinus className="text-gray-500" />;
  };

  // Prepare chart data for predictions
  const prepareChartData = () => {
    if (!predictionData) return [];
    
    const historical = Array.isArray(predictionData.historical) ? predictionData.historical : [];
    const forecast = Array.isArray(predictionData.forecast) ? predictionData.forecast : [];
    
    const historicalData = historical.map(h => ({
      timestamp: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: h.value,
      type: 'historical'
    }));

    const forecastData = forecast.map(f => ({
      timestamp: new Date(f.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predicted,
      lower: f.lower,
      range: Math.max(0, (f.upper ?? f.lower) - (f.lower ?? f.upper)),
      type: 'forecast'
    }));

    return [...historicalData, ...forecastData];
  };

  const handleClose = () => {
    closeChatBot();
    resetAiState();
  };

  const handleFetchCorrelations = () => {
    // Date validation
    if (dateFilters.startDate > dateFilters.endDate) {
      toast.warning('Start date must be before end date');
      return;
    }
    fetchCorrelations();
  };

  const handleFetchPredictions = () => {
    fetchPredictions();
  };

  const handleSubmitQuery = () => {
    if (!queryInput.trim()) {
      toast.warning('Please enter a question');
      return;
    }
    handleQuery(queryInput);
  };

  const handleSendMessage = async () => {
    const msg = chatInput.trim();
    setChatInput('');
    if (!msg) {
      toast.warning('Please enter a message');
      return;
    }
    await generateText(msg);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateResearch = async () => {
    const topic = localResearchTopic.trim();
    if (!topic) {
      toast.warning('Please enter a research topic');
      return;
    }
    await generateResearch(topic);
  };

  const handleDownloadPDF = async () => {
    if (!researchDocument) return;
    
    try {
      toast.info('Generating PDF...');
      await generateResearchReportPDF(researchDocument);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePreviewDocument = () => {
    if (!researchDocument) return;
    previewResearchDocument(researchDocument);
  };

  const handleNewResearch = () => {
    clearResearchDocument();
    setLocalResearchTopic('');
  };

  if (!isShowChatBot) return null;

  return (
    <div 
      className='h-screen w-full bg-[#0000006e] backdrop-blur-[4px] fixed top-0 left-0 flex justify-center items-center z-[500] overflow-y-auto py-8'
      role='dialog'
      aria-modal='true'
      aria-labelledby='ai-modal-title'
    >
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className='max-w-7xl h-[98%] w-full mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto'
      >
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10'>
          <h1 
            id='ai-modal-title'
            className='text-2xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent'
          >
            AI-Powered Marine Analytics
          </h1>

          {/* Tabbed Navigation */}
        <div className='flex border-b border-gray-200 px-6 bg-gray-50'>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'correlations'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FiBarChart2 size={18} />
            Correlations
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'predictions'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FiTrendingUp size={18} />
            Predictions
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FiMessageSquare size={18} />
            AI Chat
          </button>
        </div>

          <button
            onClick={handleClose}
            aria-label='Close AI Analytics Modal'
            className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
          >
            <FiX size={24} />
          </button>
        </div>

        

        {/* Content Area */}
        <div className='p-6 h-full'>
          {/* Tab 1: Correlations */}
          {activeTab === 'correlations' && (
            <div className='space-y-6'>
              {/* Date Filters */}
              <div className='bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4'>
                <div className='flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium text-gray-700'>Start Date:</label>
                    <input
                      type='date'
                      value={dateFilters.startDate}
                      onChange={(e) => setDateFilters({ ...dateFilters, startDate: e.target.value })}
                      className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium text-gray-700'>End Date:</label>
                    <input
                      type='date'
                      value={dateFilters.endDate}
                      onChange={(e) => setDateFilters({ ...dateFilters, endDate: e.target.value })}
                      className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <button
                    onClick={handleFetchCorrelations}
                    disabled={correlationLoading}
                    className='px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-md hover:from-cyan-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {correlationLoading ? 'Analyzing...' : 'Analyze Correlations'}
                  </button>
                </div>
              </div>

              {correlationLoading && (
                <div className='flex justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-600'></div>
                </div>
              )}

              {correlationData && !correlationLoading && (
                <div className='space-y-6'>
                  {/* Synthetic data notice */}
                  {correlationData.synthetic && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3'>
                      <FiAlertCircle className='text-yellow-600 text-xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='text-sm font-medium text-yellow-800'>Synthetic Data</p>
                        <p className='text-sm text-yellow-700'>{correlationData.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Top insights */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {(correlationData?.insights || []).map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          insight.significance === 'high' ? 'border-green-500 bg-green-50' :
                          insight.significance === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-gray-700'>
                            {insight.parameter} vs {insight.metric}
                          </span>
                          <span className={`text-2xl font-bold ${
                            Math.abs(insight.correlation) > 0.7 ? 'text-green-600' :
                            Math.abs(insight.correlation) > 0.4 ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {insight.correlation?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <p className='text-xs text-gray-600'>{insight.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Scatter plot */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Scatter Plot Analysis</h3>
                    <ResponsiveContainer width='100%' height={400}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis
                          dataKey='x'
                          name='Temperature'
                          unit='°C'
                          label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          dataKey='y'
                          name='Abundance'
                          label={{ value: 'Species Abundance', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter
                          name='Temperature vs Abundance'
                          data={correlationData?.scatterData || []}
                          fill='#0891b2'
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Predictions */}
          {activeTab === 'predictions' && (
            <div className='space-y-6'>
              {/* Controls */}
              <div className='bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4'>
                <div className='flex flex-wrap items-center gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-700 block mb-2'>Metric:</label>
                    <div className='flex gap-2'>
                      {['abundance', 'diversity', 'temperature', 'salinity'].map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setPredictionParams(metric, undefined)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedMetric === metric
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {metric.charAt(0).toUpperCase() + metric.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-700 block mb-2'>Forecast Period:</label>
                    <select
                      value={forecastDays}
                      onChange={(e) => setPredictionParams(undefined, parseInt(e.target.value))}
                      className='px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='7'>7 days</option>
                      <option value='14'>14 days</option>
                      <option value='30'>30 days</option>
                      <option value='60'>60 days</option>
                    </select>
                  </div>

                  <button
                    onClick={handleFetchPredictions}
                    disabled={predictionLoading}
                    className='px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-md hover:from-blue-700 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto'
                  >
                    {predictionLoading ? 'Generating...' : 'Generate Forecast'}
                  </button>
                </div>
              </div>

              {predictionLoading && (
                <div className='flex justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600'></div>
                </div>
              )}

              {predictionData && !predictionLoading && (
                <div className='space-y-6'>
                  {/* Synthetic data notice */}
                  {predictionData.synthetic && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3'>
                      <FiAlertCircle className='text-yellow-600 text-xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='text-sm font-medium text-yellow-800'>Synthetic Data</p>
                        <p className='text-sm text-yellow-700'>{predictionData.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Trend indicator */}
                  {predictionData?.trend && (
                    <div className='bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='text-3xl'>
                            {getTrendIcon(predictionData.trend.direction ?? 'stable')}
                          </div>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Trend Direction</p>
                            <p className='text-xl font-bold text-gray-800 capitalize'>
                              {predictionData.trend.direction ?? 'stable'}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium text-gray-600'>Change Rate</p>
                          <p className={`text-2xl font-bold ${
                            Number(predictionData?.trend?.percentage ?? 0) > 0 ? 'text-green-600' :
                            Number(predictionData?.trend?.percentage ?? 0) < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {Number(predictionData?.trend?.percentage ?? 0) > 0 ? '+' : ''}
                            {Number(predictionData?.trend?.percentage ?? 0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forecast chart */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                      {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Forecast
                    </h3>
                    <ResponsiveContainer width='100%' height={400}>
                      <AreaChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis
                          dataKey='timestamp'
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor='end'
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type='monotone'
                          dataKey='value'
                          stroke='#0891b2'
                          fill='#0891b2'
                          fillOpacity={0.3}
                          name='Historical'
                        />
                        
                        {/* Confidence band */}
                        <Area 
                          type='monotone' 
                          dataKey='lower' 
                          stackId='ci' 
                          stroke='none' 
                          fill='transparent' 
                          isAnimationActive={false} 
                        />
                        <Area 
                          type='monotone' 
                          dataKey='range' 
                          stackId='ci' 
                          stroke='none' 
                          fill='#ddd6fe' 
                          fillOpacity={0.35} 
                          name='Confidence interval' 
                          isAnimationActive={false} 
                        />
                        
                        {/* Forecast line on top */}
                        <Line 
                          type='monotone' 
                          dataKey='predicted' 
                          stroke='#7c3aed' 
                          strokeWidth={2} 
                          dot={false} 
                          name='Forecast' 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Anomalies */}
                  {predictionData?.anomalies && predictionData.anomalies.length > 0 && (
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800 mb-3'>Detected Anomalies</h3>
                      <div className='space-y-2'>
                        {predictionData.anomalies.map((anomaly, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              anomaly.severity === 'high' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                            }`}
                          >
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-sm font-medium text-gray-800'>
                                  {formatDate(anomaly.timestamp)}
                                </p>
                                <p className='text-xs text-gray-600'>
                                  Value: {anomaly.value?.toFixed(2) || 'N/A'} (Z-score: {anomaly.zScore || 'N/A'})
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                anomaly.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {anomaly.severity?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: AI Chat */}
          {activeTab === 'chat' && (
            <div className='h-[calc(100vh-200px)] flex flex-col'>
              {/* Mode Toggle */}
              <div className='flex gap-2 mb-4 bg-gray-100 p-2 rounded-lg'>
                <button
                  onClick={() => setChatMode('normal')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                    chatMode === 'normal'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiMessageSquare className='inline mr-2' />
                  Normal Mode
                </button>
                <button
                  onClick={() => setChatMode('research')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                    chatMode === 'research'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiBarChart2 className='inline mr-2' />
                  Research Mode
                </button>
              </div>

              {/* Normal Chat Mode */}
              {chatMode === 'normal' && (
                <>
                  {/* Chat Messages Area */}
                  <div className='flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-cyan-50 rounded-lg p-4 space-y-4'>
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'User' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 shadow-md ${
                            msg.role === 'User'
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className='flex items-start gap-2'>
                            {msg.role === 'Ai' && (
                              <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm'>
                                AI
                              </div>
                            )}
                            <div className='flex-1'>
                              <p className='text-xs font-semibold mb-1 opacity-75'>
                                {msg.role === 'User' ? 'You' : 'AI Assistant'}
                              </p>
                              <p className='text-sm whitespace-pre-wrap break-words'>{msg.message}</p>
                            </div>
                            {msg.role === 'User' && (
                              <div className='flex-shrink-0 w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold text-sm'>
                                U
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoading && (
                      <div className='flex justify-start'>
                        <div className='bg-white rounded-lg p-4 shadow-md border border-gray-200'>
                          <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm'>
                              AI
                            </div>
                            <div className='flex gap-1'>
                              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
                              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
                              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Example Questions */}
                  <div className='mt-4'>
                    <p className='text-xs font-medium text-gray-600 mb-2'>Quick questions:</p>
                    <div className='flex flex-wrap gap-2'>
                      {exampleQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setChatInput(question)}
                          className='px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors border border-teal-200'
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Input Area */}
                  <div className='bg-white rounded-lg border border-gray-300 shadow-lg mt-4'>
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder='Type your message here... (Press Enter to send, Shift+Enter for new line)'
                      rows='3'
                      className='w-full px-4 py-3 focus:outline-none resize-none rounded-t-lg'
                    />
                    <div className='flex items-center justify-between px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200'>
                      <p className='text-xs text-gray-500'>
                        Ask about marine species, ocean data, or environmental trends
                      </p>
                      <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !chatInput.trim()}
                        className='px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                      >
                        {isLoading ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FiSend />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Research Mode */}
              {chatMode === 'research' && (
                <div className='flex-1 flex flex-col'>
                  {!researchDocument ? (
                    <>
                      {/* Research Input */}
                      <div className='flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-8'>
                        <div className='max-w-2xl w-full space-y-6'>
                          <div className='text-center'>
                            <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-4'>
                              <FiBarChart2 className='text-white text-3xl' />
                            </div>
                            <h3 className='text-2xl font-bold text-gray-800 mb-2'>
                              AI Research Agent
                            </h3>
                            <p className='text-gray-600'>
                              Enter a marine research topic and our AI will generate a comprehensive research document with citations and references.
                            </p>
                          </div>

                          <div className='bg-white rounded-lg p-6 shadow-lg'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                              Research Topic
                            </label>
                            <textarea
                              value={localResearchTopic}
                              onChange={(e) => setLocalResearchTopic(e.target.value)}
                              placeholder='e.g., "Marine ichthyofauna biodiversity of Odisha coast" or "Impact of ocean acidification on coral reefs"'
                              rows='4'
                              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none'
                              disabled={researchLoading}
                            />
                            
                            <button
                              onClick={handleGenerateResearch}
                              disabled={researchLoading || !localResearchTopic.trim()}
                              className='w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg'
                            >
                              {researchLoading ? (
                                <>
                                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                                  Generating Research Document...
                                </>
                              ) : (
                                <>
                                  <FiBarChart2 />
                                  Generate Research Document
                                </>
                              )}
                            </button>
                          </div>

                          {/* Example Topics */}
                          <div>
                            <p className='text-xs font-medium text-gray-600 mb-2'>Example topics:</p>
                            <div className='flex flex-wrap gap-2'>
                              {[
                                'Marine biodiversity of Bay of Bengal',
                                'Ocean temperature trends and climate change',
                                'Coral reef ecosystem health indicators',
                                'Deep sea fish species distribution'
                              ].map((topic, index) => (
                                <button
                                  key={index}
                                  onClick={() => setLocalResearchTopic(topic)}
                                  disabled={researchLoading}
                                  className='px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-50'
                                >
                                  {topic}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Research Document Display */}
                      <div className='flex-1 flex flex-col bg-white rounded-lg border border-gray-300 overflow-hidden'>
                        {/* Document Header */}
                        <div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <h3 className='text-lg font-bold' dangerouslySetInnerHTML={{ __html: researchDocument.title }} />
                              <p className='text-sm opacity-90 mt-1'>
                                Generated on {new Date().toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <button
                              onClick={handleNewResearch}
                              className='px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center gap-2'
                            >
                              <FiRefreshCw />
                              New Research
                            </button>
                          </div>
                        </div>

                        {/* Document Preview */}
                        <div className='flex-1 overflow-y-auto p-6 bg-gray-50'>
                          <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8'>
                            <style dangerouslySetInnerHTML={{ __html: researchDocument.css }} />
                            <div dangerouslySetInnerHTML={{ __html: researchDocument.body }} />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='bg-white border-t border-gray-300 px-6 py-4 flex items-center justify-between'>
                          <p className='text-sm text-gray-600'>
                            Research document ready for download
                          </p>
                          <div className='flex gap-3'>
                            <button
                              onClick={handlePreviewDocument}
                              className='px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium'
                            >
                              <FiEye />
                              Preview in New Tab
                            </button>
                            <button
                              onClick={handleDownloadPDF}
                              className='px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg'
                            >
                              <FiDownload />
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCard;