import React, { useState } from "react";
import { FiSearch, FiCamera, FiGrid, FiUpload, FiBarChart2 } from "react-icons/fi";
import IdentifyTab from "./IdentifyTab";

const TaxonomicManagement = () => {
  const [activeTab, setActiveTab] = useState("identify");
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  // Color map for Tailwind classes (prevents purging)
  const colorMap = {
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
    blue: {
      text: "text-blue-600",
      border: "border-blue-600",
      bg: "bg-blue-50",
    },
    indigo: {
      text: "text-indigo-600",
      border: "border-indigo-600",
      bg: "bg-indigo-50",
    },
    cyan: {
      text: "text-cyan-600",
      border: "border-cyan-600",
      bg: "bg-cyan-50",
    },
  };

  // Tab configuration
  const tabs = [
    { id: "search", label: "Search", icon: FiSearch, color: "teal" },
    { id: "identify", label: "Identify Species", icon: FiCamera, color: "purple" },
    { id: "tree", label: "Tree View", icon: FiGrid, color: "blue" },
    { id: "import", label: "Bulk Import", icon: FiUpload, color: "indigo" },
    { id: "stats", label: "Statistics", icon: FiBarChart2, color: "cyan" },
  ];

  // Event handlers
  const handleSelectSpecies = (species) => {
    setSelectedSpecies(species);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Taxonomic Management System
          </h1>
          <p className="text-lg text-gray-600">
            Search species, identify from images, browse hierarchical taxonomy, import from WoRMS, and view statistics.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colors = colorMap[tab.color];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-300
                    ${
                      isActive
                        ? `${colors.text} border-b-2 ${colors.border} ${colors.bg}`
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }
                  `}
                  aria-label={`${tab.label} Tab`}
                  aria-selected={isActive}
                >
                  <Icon className="text-xl" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "search" && (
              <div className="text-center py-20">
                <FiSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Search functionality coming soon
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Search and filter species by taxonomy, location, and characteristics
                </p>
              </div>
            )}

            {activeTab === "identify" && (
              <IdentifyTab onSelectSpecies={handleSelectSpecies} />
            )}

            {activeTab === "tree" && (
              <div className="text-center py-20">
                <FiGrid className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Tree view functionality coming soon
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Browse hierarchical taxonomic classification with interactive tree
                </p>
              </div>
            )}

            {activeTab === "import" && (
              <div className="text-center py-20">
                <FiUpload className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Bulk import functionality coming soon
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Import species data in bulk from WoRMS database
                </p>
              </div>
            )}

            {activeTab === "stats" && (
              <div className="text-center py-20">
                <FiBarChart2 className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Statistics dashboard coming soon
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  View comprehensive statistics and analytics for species data
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            <strong>Taxonomic Management System</strong> - Comprehensive tools for marine species identification, 
            classification, and data management powered by iNaturalist AI and WoRMS database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxonomicManagement;
