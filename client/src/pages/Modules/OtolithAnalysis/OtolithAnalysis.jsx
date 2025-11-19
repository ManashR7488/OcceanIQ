import React, { useState } from "react";
import { FiUpload, FiImage, FiBarChart2, FiPieChart } from "react-icons/fi";
import UploadTab from "./UploadTab";
import GalleryTab from "./GalleryTab";
import AnalysisTab from "./AnalysisTab";
import StatsTab from "./StatsTab";

const OtolithAnalysis = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedOtolith, setSelectedOtolith] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Color map for Tailwind classes (prevents purging)
  const colorMap = {
    cyan: {
      text: "text-cyan-600",
      border: "border-cyan-600",
      bg: "bg-cyan-50",
    },
    blue: {
      text: "text-blue-600",
      border: "border-blue-600",
      bg: "bg-blue-50",
    },
    teal: {
      text: "text-teal-600",
      border: "border-teal-600",
      bg: "bg-teal-50",
    },
    purple: {
      text: "text-purple-600",
      border: "border-purple-600",
      bg: "bg-purple-50",
    },
  };

  // Tab configuration
  const tabs = [
    { id: "upload", label: "Upload", icon: FiUpload, color: "cyan" },
    { id: "gallery", label: "Gallery", icon: FiImage, color: "blue" },
    {
      id: "analysis",
      label: "Analysis",
      icon: FiBarChart2,
      color: "teal",
      disabled: !selectedOtolith,
    },
    { id: "stats", label: "Statistics", icon: FiPieChart, color: "purple" },
  ];

  // Event handlers
  const handleUploadSuccess = () => {
    setActiveTab("gallery");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectOtolith = (otolith) => {
    setSelectedOtolith(otolith);
    setActiveTab("analysis");
  };

  const handleAnalysisComplete = (updatedOtolith) => {
    setSelectedOtolith(updatedOtolith);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Otolith Analysis Module
          </h1>
          <p className="text-lg text-gray-600">
            Upload otolith images to Cloudinary and analyze morphometric
            characteristics with AI-powered species identification
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;
              const colors = colorMap[tab.color];

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-300
                    ${
                      isActive
                        ? `${colors.text} border-b-2 ${colors.border} ${colors.bg}`
                        : isDisabled
                        ? "text-gray-400 cursor-not-allowed opacity-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }
                  `}
                  aria-label={`${tab.label} Tab`}
                  aria-selected={isActive}
                  aria-disabled={isDisabled}
                >
                  <Icon className="text-xl" />
                  <span>{tab.label}</span>
                  {isDisabled && (
                    <span className="text-xs text-gray-400">(Select sample)</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "upload" && (
              <UploadTab onUploadSuccess={handleUploadSuccess} />
            )}
            {activeTab === "gallery" && (
              <GalleryTab
                onSelectOtolith={handleSelectOtolith}
                refreshTrigger={refreshTrigger}
              />
            )}
            {activeTab === "analysis" && selectedOtolith && (
              <AnalysisTab
                otolith={selectedOtolith}
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}
            {activeTab === "stats" && (
              <StatsTab refreshTrigger={refreshTrigger} />
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Two-step process: Upload images to Cloudinary first, then analyze
            morphometrics and identify species.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtolithAnalysis;
