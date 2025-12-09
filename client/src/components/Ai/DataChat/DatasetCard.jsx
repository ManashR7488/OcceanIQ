import React from 'react';
import { FiDatabase, FiTrash2, FiDownload, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

const DatasetCard = ({ dataset, isActive, onSelect, onDelete, onDownload }) => {
  const getStatusBadge = () => {
    const status = dataset.status || 'ready';
    
    const statusConfig = {
      uploading: { icon: FiLoader, color: 'bg-blue-100 text-blue-700', text: 'Uploading', animate: 'animate-spin' },
      processing: { icon: FiLoader, color: 'bg-yellow-100 text-yellow-700', text: 'Processing', animate: 'animate-spin' },
      ready: { icon: FiCheck, color: 'bg-green-100 text-green-700', text: 'Ready', animate: '' },
      error: { icon: FiAlertCircle, color: 'bg-red-100 text-red-700', text: 'Error', animate: '' },
      empty: { icon: FiAlertCircle, color: 'bg-gray-100 text-gray-700', text: 'Empty', animate: '' }
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className={config.animate} />
        {config.text}
      </span>
    );
  };
  
  const getFileTypeIcon = () => {
    const ext = dataset.filename?.split('.').pop()?.toLowerCase();
    const colors = {
      csv: 'text-green-600',
      json: 'text-yellow-600',
      xml: 'text-orange-600',
      nc: 'text-blue-600'
    };
    return colors[ext] || 'text-gray-600';
  };
  
  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onSelect(dataset.id)}
      className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
        isActive
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-teal-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Gradient border effect on active */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 opacity-10 pointer-events-none" />
      )}
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FiDatabase className={`flex-shrink-0 ${getFileTypeIcon()}`} size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate" title={dataset.filename}>
                {dataset.filename}
              </p>
              <p className="text-xs text-gray-500">{formatDate(dataset.uploadDate)}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Size:</span>
            <span>{formatSize(dataset.size)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Chunks:</span>
            <span className="font-semibold text-blue-600">{dataset.chunksStored || 0}</span>
          </div>
        </div>
        
        {/* Actions - Show on hover or when active */}
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${
          isActive || 'opacity-0 group-hover:opacity-100'
        }`}>
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(dataset);
              }}
              className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1"
              title="Download dataset"
            >
              <FiDownload size={14} />
              Download
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dataset.id);
            }}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1"
            title="Delete dataset"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;
