import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FiX,
  FiBarChart2,
  FiTrendingUp,
  FiMessageSquare,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiMinus,
  FiSend,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiMaximize2,
  FiCalendar,
  FiActivity,
  FiSearch,
  FiCopy,
  FiMenu,
  FiClock,
  FiUser,
} from "react-icons/fi";
import { BsRobot } from "react-icons/bs";
import {
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
} from "recharts";
import useAiStore from "../../store/useAiStore";
import { toast } from "react-toastify";
import {
  generateResearchReportPDF,
  previewResearchDocument,
} from "../../utils/pdfGenerator";

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
    dateFilters,
    selectedMetric,
    forecastDays,
    fetchCorrelations,
    fetchPredictions,
    setDateFilters,
    setPredictionParams,
    resetAiState,
    messages,
    generateText,
    isLoading,
    chatMode,
    setChatMode,
    researchDocument,
    researchLoading,
    generateResearch,
    clearResearchDocument,
  } = useAiStore();

  const chatMessagesEndRef = useRef(null);
  const modalRef = useRef(null);
  const chatInputRef = useRef(null);
  const [chatInput, setChatInput] = useState("");
  const [localResearchTopic, setLocalResearchTopic] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "chat" && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // ESC key handler, focus trap, and Ctrl+K shortcut
  useEffect(() => {
    if (!isShowChatBot) return;

    const handleKeyDown = (e) => {
      // ESC to close
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      // Ctrl+K or Cmd+K to focus chat input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Switch to chat tab if not already there
        if (activeTab !== "chat") {
          setActiveTab("chat");
        }
        // Focus chat input after a brief delay to ensure tab switch completes
        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 100);
        return;
      }

      // Focus trap
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first element when modal opens
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        "button, [href], input, select, textarea"
      );
      if (firstFocusable) firstFocusable.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isShowChatBot, activeTab, setActiveTab]);

  // Example questions
  const exampleQuestions = [
    "What is the correlation between temperature and species diversity?",
    "Show me biodiversity trends in the last 30 days",
    "Which environmental factors most affect species abundance?",
  ];

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get trend icon
  const getTrendIcon = (direction) => {
    if (direction === "increasing")
      return <FiArrowUp className="text-green-500" />;
    if (direction === "decreasing")
      return <FiArrowDown className="text-red-500" />;
    return <FiMinus className="text-gray-500" />;
  };

  // Performance Optimization: Prepare chart data for predictions
  // ✅ Implemented: useMemo for chart data preparation to prevent unnecessary recalculations
  // 📝 Future enhancements (deferred):
  //    - Debouncing for date filter inputs (currently using explicit button trigger)
  //    - Lazy loading of chart components with React.lazy/Suspense (bundle size optimization)
  //    - Chart data pagination for large datasets
  const prepareChartData = useMemo(() => {
    if (!predictionData) return [];

    const historical = Array.isArray(predictionData.historical)
      ? predictionData.historical
      : [];
    const forecast = Array.isArray(predictionData.forecast)
      ? predictionData.forecast
      : [];

    const historicalData = historical.map((h) => ({
      timestamp: new Date(h.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: h.value,
      type: "historical",
    }));

    const forecastData = forecast.map((f) => ({
      timestamp: new Date(f.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      predicted: f.predicted,
      lower: f.lower,
      range: Math.max(0, (f.upper ?? f.lower) - (f.lower ?? f.upper)),
      type: "forecast",
    }));

    return [...historicalData, ...forecastData];
  }, [predictionData]);

  const handleClose = () => {
    closeChatBot();
    resetAiState();
  };

  const handleFetchCorrelations = () => {
    // Date validation
    if (dateFilters.startDate > dateFilters.endDate) {
      toast.warning("Start date must be before end date");
      return;
    }
    fetchCorrelations();
  };

  const handleFetchPredictions = () => {
    fetchPredictions();
  };

  const handleSubmitQuery = () => {
    if (!queryInput.trim()) {
      toast.warning("Please enter a question");
      return;
    }
    handleQuery(queryInput);
  };

  const handleSendMessage = async () => {
    const msg = chatInput.trim();
    setChatInput("");
    if (!msg) {
      toast.warning("Please enter a message");
      return;
    }
    await generateText(msg);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateResearch = async () => {
    const topic = localResearchTopic.trim();
    if (!topic) {
      toast.warning("Please enter a research topic");
      return;
    }
    await generateResearch(topic);
  };

  const handleDownloadPDF = async () => {
    if (!researchDocument) return;

    try {
      toast.info("Generating PDF...");
      await generateResearchReportPDF(researchDocument);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePreviewDocument = () => {
    if (!researchDocument) return;
    previewResearchDocument(researchDocument);
  };

  const handleNewResearch = () => {
    clearResearchDocument();
    setLocalResearchTopic("");
  };

  if (!isShowChatBot) return null;

  // Sidebar navigation items
  const sidebarItems = [
    { id: "correlations", icon: FiBarChart2, label: "Correlations" },
    { id: "predictions", icon: FiTrendingUp, label: "Predictions" },
    { id: "chat", icon: FiMessageSquare, label: "AI Chat" },
  ];

  return (
    <div
      className="h-screen w-full p-4 bg-gradient-to-br from-gray-900/80 via-blue-900/60 to-gray-900/80 backdrop-blur-md fixed top-0 left-0 flex justify-center items-center z-[500] overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Modal Container - Centered with max dimensions */}
      <div
        ref={modalRef}
        className="max-w-full max-h-full w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">🌊</span>
            </div>
            <h1
              id="ai-modal-title"
              className="text-2xl font-bold tracking-tight"
            >
              AI-Powered Marine Analytics
            </h1>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close AI Analytics Modal"
            className="p-2 text-white hover:bg-red-500 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Main Content Area - Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div
            className={`${
              isSidebarCollapsed ? "w-20" : "w-80"
            } bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col transition-all duration-300 hidden md:flex`}
          >
            {/* Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-4 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
            >
              <FiMenu size={20} />
            </button>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                        : "text-gray-700 hover:bg-gray-200 hover:scale-102"
                    }`}
                    title={item.label}
                  >
                    <Icon
                      size={22}
                      className={`${
                        isActive ? "text-white" : "text-gray-600"
                      } group-hover:text-current transition-colors flex-shrink-0`}
                    />
                    {!isSidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            {!isSidebarCollapsed && (
              <div className="p-4 bg-blue-50 border-t border-blue-100 rounded-tl-2xl">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-blue-700">💡 Tip:</span>{" "}
                  Use Ctrl+K to quickly focus chat input
                </p>
              </div>
            )}
          </div>

          {/* Mobile Navigation - Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30 flex justify-around items-center py-2 shadow-lg">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
              {/* Tab 1: Correlations */}
              {activeTab === "correlations" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Date Filters Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FiCalendar className="text-blue-600" size={20} />
                      <h2 className="text-lg font-semibold text-gray-800">
                        Date Range Selection
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateFilters.startDate}
                          onChange={(e) =>
                            setDateFilters({
                              ...dateFilters,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateFilters.endDate}
                          onChange={(e) =>
                            setDateFilters({
                              ...dateFilters,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleFetchCorrelations}
                        disabled={correlationLoading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        {correlationLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <FiActivity size={18} />
                            Analyze Correlations
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Loading State with Skeleton */}
                  {correlationLoading && (
                    <div className="space-y-4 animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-32 bg-gray-200 rounded-xl"
                          ></div>
                        ))}
                      </div>
                      <div className="h-96 bg-gray-200 rounded-xl"></div>
                    </div>
                  )}

                  {/* Results */}
                  {correlationData && !correlationLoading && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Synthetic data notice */}
                      {correlationData.synthetic && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 shadow-sm">
                          <FiAlertCircle className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-800">
                              Synthetic Data Notice
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              {correlationData.message}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Top Insights Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(correlationData?.insights || []).map(
                          (insight, index) => (
                            <div
                              key={index}
                              className={`relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                                insight.significance === "high"
                                  ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-100"
                                  : insight.significance === "medium"
                                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-yellow-100"
                                  : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50"
                              } ${
                                insight.significance === "high"
                                  ? "animate-pulse-subtle"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-700">
                                  {insight.parameter} vs {insight.metric}
                                </span>
                                <span
                                  className={`text-3xl font-bold ${
                                    Math.abs(insight.correlation) > 0.7
                                      ? "text-green-600"
                                      : Math.abs(insight.correlation) > 0.4
                                      ? "text-yellow-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {insight.correlation?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {insight.description}
                              </p>
                              {/* Significance Badge */}
                              <div className="absolute top-2 right-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    insight.significance === "high"
                                      ? "bg-green-200 text-green-800"
                                      : insight.significance === "medium"
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {insight.significance}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Scatter Plot Card */}
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              Scatter Plot Analysis
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Visual correlation between environmental
                              parameters
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              toast.info("Export feature coming soon!")
                            }
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <FiDownload size={16} />
                            Export
                          </button>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                          <ScatterChart>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="x"
                              name="Temperature"
                              unit="°C"
                              label={{
                                value: "Temperature (°C)",
                                position: "insideBottom",
                                offset: -5,
                                style: {
                                  fill: "#4b5563",
                                  fontWeight: 600,
                                },
                              }}
                              tick={{ fill: "#6b7280" }}
                            />
                            <YAxis
                              dataKey="y"
                              name="Abundance"
                              label={{
                                value: "Species Abundance",
                                angle: -90,
                                position: "insideLeft",
                                style: {
                                  fill: "#4b5563",
                                  fontWeight: 600,
                                },
                              }}
                              tick={{ fill: "#6b7280" }}
                            />
                            <Tooltip
                              cursor={{ strokeDasharray: "3 3" }}
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow:
                                  "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: "20px" }}
                            />
                            <Scatter
                              name="Temperature vs Abundance"
                              data={correlationData?.scatterData || []}
                              fill="#0891b2"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Predictions */}
              {activeTab === "predictions" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Controls Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FiTrendingUp className="text-blue-600" size={20} />
                      <h2 className="text-lg font-semibold text-gray-800">
                        Forecast Configuration
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {/* Metric Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Metric
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            {
                              value: "abundance",
                              label: "Abundance",
                              icon: "🐟",
                            },
                            {
                              value: "diversity",
                              label: "Diversity",
                              icon: "🌊",
                            },
                            {
                              value: "temperature",
                              label: "Temperature",
                              icon: "🌡️",
                            },
                            {
                              value: "salinity",
                              label: "Salinity",
                              icon: "💧",
                            },
                          ].map((metric) => (
                            <button
                              key={metric.value}
                              onClick={() =>
                                setPredictionParams(metric.value, undefined)
                              }
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedMetric === metric.value
                                  ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                              }`}
                            >
                              <span className="text-lg">{metric.icon}</span>
                              {metric.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Forecast Period */}
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Forecast Period
                          </label>
                          <select
                            value={forecastDays}
                            onChange={(e) =>
                              setPredictionParams(
                                undefined,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          >
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                          </select>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-2">
                          {[
                            { days: 7, label: "1W" },
                            { days: 14, label: "2W" },
                            { days: 30, label: "1M" },
                            { days: 60, label: "2M" },
                          ].map((preset) => (
                            <button
                              key={preset.days}
                              onClick={() =>
                                setPredictionParams(undefined, preset.days)
                              }
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                forecastDays === preset.days
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleFetchPredictions}
                          disabled={predictionLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          {predictionLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <FiTrendingUp size={18} />
                              Generate Forecast
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {predictionLoading && (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-xl"></div>
                      <div className="h-96 bg-gray-200 rounded-xl"></div>
                    </div>
                  )}

                  {/* Results */}
                  {predictionData && !predictionLoading && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Synthetic data notice */}
                      {predictionData.synthetic && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 shadow-sm">
                          <FiAlertCircle className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-800">
                              Synthetic Data Notice
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              {predictionData.message}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Trend Indicator Card */}
                      {predictionData?.trend && (
                        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-xl shadow-md border border-blue-200 p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
                                {getTrendIcon(
                                  predictionData.trend.direction ?? "stable"
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">
                                  Trend Direction
                                </p>
                                <p className="text-2xl font-bold text-gray-800 capitalize mt-1">
                                  {predictionData.trend.direction ?? "stable"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-600">
                                Change Rate
                              </p>
                              <p
                                className={`text-3xl font-bold mt-1 ${
                                  Number(
                                    predictionData?.trend?.percentage ?? 0
                                  ) > 0
                                    ? "text-green-600"
                                    : Number(
                                        predictionData?.trend?.percentage ?? 0
                                      ) < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {Number(predictionData?.trend?.percentage ?? 0) >
                                0
                                  ? "+"
                                  : ""}
                                {Number(predictionData?.trend?.percentage ?? 0)}
                                %
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Forecast Chart Card */}
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {selectedMetric.charAt(0).toUpperCase() +
                                selectedMetric.slice(1)}{" "}
                              Forecast
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Historical data and {forecastDays}-day prediction
                              with confidence intervals
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              toast.info("Zoom feature coming soon!")
                            }
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <FiMaximize2 size={16} />
                            Fullscreen
                          </button>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={prepareChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="timestamp"
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                              angle={-45}
                              textAnchor="end"
                              height={70}
                            />
                            <YAxis tick={{ fill: "#6b7280" }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow:
                                  "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: "20px" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#0891b2"
                              fill="#0891b2"
                              fillOpacity={0.3}
                              name="Historical"
                            />

                            {/* Confidence band */}
                            <Area
                              type="monotone"
                              dataKey="lower"
                              stackId="ci"
                              stroke="none"
                              fill="transparent"
                              isAnimationActive={false}
                            />
                            <Area
                              type="monotone"
                              dataKey="range"
                              stackId="ci"
                              stroke="none"
                              fill="#a5b4fc"
                              fillOpacity={0.35}
                              name="Confidence interval"
                              isAnimationActive={false}
                            />

                            {/* Forecast line on top */}
                            <Line
                              type="monotone"
                              dataKey="predicted"
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={false}
                              name="Forecast"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Anomalies Timeline */}
                      {predictionData?.anomalies &&
                        predictionData.anomalies.length > 0 && (
                          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                              Detected Anomalies
                            </h3>
                            <div className="space-y-3">
                              {predictionData.anomalies.map(
                                (anomaly, index) => (
                                  <div
                                    key={index}
                                    className={`relative pl-8 pb-3 border-l-2 last:border-l-0 ${
                                      anomaly.severity === "high"
                                        ? "border-red-400"
                                        : "border-yellow-400"
                                    }`}
                                  >
                                    {/* Timeline Dot */}
                                    <div
                                      className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${
                                        anomaly.severity === "high"
                                          ? "bg-red-500 border-red-600"
                                          : "bg-yellow-500 border-yellow-600"
                                      }`}
                                    ></div>

                                    <div
                                      className={`p-4 rounded-lg ${
                                        anomaly.severity === "high"
                                          ? "bg-red-50 border border-red-200"
                                          : "bg-yellow-50 border border-yellow-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <FiClock
                                              size={14}
                                              className="text-gray-600"
                                            />
                                            <p className="text-sm font-semibold text-gray-800">
                                              {formatDate(anomaly.timestamp)}
                                            </p>
                                          </div>
                                          <p className="text-xs text-gray-600">
                                            Value:{" "}
                                            <span className="font-medium">
                                              {anomaly.value?.toFixed(2) ||
                                                "N/A"}
                                            </span>{" "}
                                            | Z-score:{" "}
                                            <span className="font-medium">
                                              {anomaly.zScore || "N/A"}
                                            </span>
                                          </p>
                                        </div>
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            anomaly.severity === "high"
                                              ? "bg-red-200 text-red-800"
                                              : "bg-yellow-200 text-yellow-800"
                                          }`}
                                        >
                                          {anomaly.severity?.toUpperCase() ||
                                            "UNKNOWN"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AI Chat */}
              {activeTab === "chat" && (
                <div className="h-full flex flex-col animate-fadeIn">
                  {/* Mode Toggle - Segmented Control */}
                  <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChatMode("normal")}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          chatMode === "normal"
                            ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <BsRobot className="text-lg" />
                        <span>Normal Chat</span>
                      </button>
                      <button
                        onClick={() => setChatMode("research")}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          chatMode === "research"
                            ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <FiSearch className="text-lg" />
                        <span>Research Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Normal Chat Mode */}
                  {chatMode === "normal" && (
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Chat Messages Area */}
                      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-teal-50 rounded-xl p-4 space-y-4 shadow-inner">
                        {messages.length === 0 && !isLoading && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center mb-4">
                              <FiMessageSquare className="text-blue-600 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              Start a Conversation
                            </h3>
                            <p className="text-gray-600 max-w-md">
                              Ask me anything about marine species, ocean data,
                              or environmental trends
                            </p>
                          </div>
                        )}

                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              msg.role === "User"
                                ? "justify-end"
                                : "justify-start"
                            } animate-slideIn`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl p-4 shadow-md transition-all hover:shadow-lg ${
                                msg.role === "User"
                                  ? "bg-gradient-to-br from-blue-600 to-teal-600 text-white"
                                  : "bg-white text-gray-800 border border-gray-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {msg.role === "Ai" && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    <BsRobot />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-semibold opacity-75">
                                      {msg.role === "User"
                                        ? "You"
                                        : "AI Assistant"}
                                    </p>
                                    {msg.timestamp && (
                                      <span className="text-xs opacity-50">
                                        {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.message}
                                  </p>
                                </div>
                                {msg.role === "User" && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                                    <FiUser />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Typing Indicator */}
                        {isLoading && (
                          <div className="flex justify-start animate-slideIn">
                            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                                  <BsRobot />
                                </div>
                                <div className="flex items-center gap-1">
                                  <p className="text-sm text-gray-600 mr-2">
                                    AI is thinking
                                  </p>
                                  <div
                                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={chatMessagesEndRef} />
                      </div>

                      {/* Example Questions */}
                      {messages.length === 0 && !isLoading && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-600 mb-3">
                            💡 Quick questions to get started:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {exampleQuestions.map((question, index) => (
                              <button
                                key={index}
                                onClick={() => setChatInput(question)}
                                className="p-3 text-xs bg-white text-left text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all border border-gray-200 shadow-sm hover:shadow-md transform hover:scale-102"
                              >
                                <span className="font-medium">
                                  {question}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat Input Area */}
                      <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                        <textarea
                          ref={chatInputRef}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                          rows="3"
                          className="w-full px-4 py-3 focus:outline-none resize-none text-sm"
                        />
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              {chatInput.length} characters
                            </p>
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !chatInput.trim()}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
                    </div>
                  )}

                  {/* Research Mode */}
                  {chatMode === "research" && (
                    <div className="flex-1 flex flex-col min-h-0">
                      {!researchDocument ? (
                        <>
                          {/* Research Input */}
                          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-xl p-8">
                            <div className="max-w-2xl w-full space-y-6">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full mb-4 shadow-lg animate-pulse-subtle">
                                  <FiSearch className="text-white text-4xl" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                                  AI Research Agent
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                  Enter a marine research topic and our AI will
                                  generate a comprehensive research document
                                  with citations and references.
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                  Research Topic
                                </label>
                                <textarea
                                  value={localResearchTopic}
                                  onChange={(e) =>
                                    setLocalResearchTopic(e.target.value)
                                  }
                                  placeholder='e.g., "Marine ichthyofauna biodiversity of Odisha coast" or "Impact of ocean acidification on coral reefs"'
                                  rows="4"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm"
                                  disabled={researchLoading}
                                />

                                <div className="flex items-center justify-between mt-3">
                                  <p className="text-xs text-gray-500">
                                    {localResearchTopic.length} characters
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Recommended: 50-200 characters
                                  </p>
                                </div>

                                <button
                                  onClick={handleGenerateResearch}
                                  disabled={
                                    researchLoading ||
                                    !localResearchTopic.trim()
                                  }
                                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                >
                                  {researchLoading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                      Generating Research Document...
                                    </>
                                  ) : (
                                    <>
                                      <FiSearch />
                                      Generate Research Document
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Example Topics */}
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-3">
                                  📚 Example research topics:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {[
                                    "Marine biodiversity of Bay of Bengal",
                                    "Ocean temperature trends and climate change",
                                    "Coral reef ecosystem health indicators",
                                    "Deep sea fish species distribution",
                                  ].map((topic, index) => (
                                    <button
                                      key={index}
                                      onClick={() =>
                                        setLocalResearchTopic(topic)
                                      }
                                      disabled={researchLoading}
                                      className="px-4 py-3 text-sm bg-white text-left text-blue-700 rounded-lg hover:bg-blue-50 transition-all border border-blue-200 disabled:opacity-50 shadow-sm hover:shadow-md transform hover:scale-102"
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
                          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                            {/* Document Header */}
                            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white px-6 py-5">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <FiDownload className="text-white" />
                                  </div>
                                  <div>
                                    <h3
                                      className="text-lg font-bold"
                                      dangerouslySetInnerHTML={{
                                        __html: researchDocument.title,
                                      }}
                                    />
                                    <p className="text-sm opacity-90 mt-1">
                                      Generated on{" "}
                                      {new Date().toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleNewResearch}
                                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm font-medium"
                                >
                                  <FiRefreshCw />
                                  New Research
                                </button>
                              </div>
                            </div>

                            {/* Document Preview */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                                <style
                                  dangerouslySetInnerHTML={{
                                    __html: researchDocument.css,
                                  }}
                                />
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: researchDocument.body,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-lg">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="text-green-600">✓</span>{" "}
                                Research document ready for download
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      window.location.href
                                    );
                                    toast.success("Link copied to clipboard!");
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <FiCopy />
                                  Copy Link
                                </button>
                                <button
                                  onClick={handlePreviewDocument}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <FiEye />
                                  Preview
                                </button>
                                <button
                                  onClick={handleDownloadPDF}
                                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
      </div>

    </div>
  );
};



export default AiCard;
