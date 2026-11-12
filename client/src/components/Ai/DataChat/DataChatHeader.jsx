import React from 'react';
import { FiDatabase, FiUpload, FiHelpCircle, FiActivity } from 'react-icons/fi';

const DataChatHeader = ({ activeDataset, onUpload, onToggleDebug, showDebug }) => {
  return (
    <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
      <div className="flex items-center justify-between">
        {/* Title and Active Dataset */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <FiDatabase size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Data Chat</h3>
            {activeDataset ? (
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>Active:</span>
                <span className="font-medium truncate max-w-xs" title={activeDataset.filename}>
                  {activeDataset.filename}
                </span>
              </div>
            ) : (
              <p className="text-sm opacity-75">No dataset selected</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Debug Toggle */}
          <button
            onClick={onToggleDebug}
            className={`p-2 rounded-lg transition-all ${
              showDebug
                ? 'bg-white/30 text-white'
                : 'hover:bg-white/10 text-white/80 hover:text-white'
            }`}
            title="Toggle debug info"
          >
            <FiActivity size={20} />
          </button>

          {/* Upload Button */}
          <button
            onClick={onUpload}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all font-medium flex items-center gap-2"
            title="Upload new dataset"
          >
            <FiUpload size={18} />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Help Button */}
          <button
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
            title="Help & shortcuts"
          >
            <FiHelpCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataChatHeader;
