import { useState } from 'react';
import { FiUpload, FiGrid, FiActivity, FiBarChart2 } from 'react-icons/fi';
import UploadTab from './UploadTab';
import GalleryTab from './GalleryTab';
import AnalysisTab from './AnalysisTab';
import StatsTab from './StatsTab';

const EDNAProcessing = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSample, setSelectedSample] = useState(null);

  const tabs = [
    { id: 'upload', label: 'Upload Sample', icon: FiUpload },
    { id: 'gallery', label: 'Sample Gallery', icon: FiGrid },
    { id: 'analysis', label: 'Analysis', icon: FiActivity },
    { id: 'stats', label: 'Statistics', icon: FiBarChart2 },
  ];

  // Trigger refresh when upload is successful
  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('gallery');
  };

  // Handle sample selection from gallery
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setActiveTab('analysis');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          eDNA Metabarcoding Analysis
        </h1>
        <p className="text-gray-600">
          Upload environmental DNA sequences and analyze biodiversity with metabarcoding
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'upload' && (
          <UploadTab onUploadSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'gallery' && (
          <GalleryTab 
            refreshTrigger={refreshTrigger} 
            onSelectSample={handleSelectSample}
          />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab 
            refreshTrigger={refreshTrigger}
            selectedSample={selectedSample}
          />
        )}
        {activeTab === 'stats' && (
          <StatsTab refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
};

export default EDNAProcessing;
