import React from 'react';
import { FiDatabase, FiFile, FiCalendar, FiLayers, FiActivity, FiCopy, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import useAuthStore from '../../../store/useAuthStore';
import axiosInstance from '../../../config/axios.config';
import { toast } from 'react-toastify';

const DataChatSidebar = ({ activeDataset, showDebug, onTestRetrieval, onExportChat, onDownloadDataset, onShareDataset, lastErrorDetails }) => {
  const user = useAuthStore((state) => state.user);
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };

  if (!activeDataset) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center bg-gray-50">
        <div>
          <FiDatabase size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Select a dataset to view details</p>
        </div>
      </div>
    );
  }

  const userId = user?._id;
  const sanitizedUserId = userId ? userId.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : 'N/A';

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-gray-200">
      {/* Dataset Stats */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FiDatabase size={16} />
          Dataset Information
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <FiFile className="text-gray-400 mt-0.5" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Filename</p>
              <p className="text-sm font-medium text-gray-800 truncate" title={activeDataset.filename}>
                {activeDataset.filename}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FiCalendar className="text-gray-400 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Uploaded</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(activeDataset.uploadDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FiLayers className="text-gray-400 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Size / Chunks</p>
              <p className="text-sm font-medium text-gray-800">
                {formatSize(activeDataset.size)} / <span className="text-blue-600">{activeDataset.chunksStored || 0}</span> chunks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FiActivity size={16} />
            Debug Information
          </h4>

          <div className="space-y-2 text-xs">
            {/* MongoDB _id */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">MongoDB _id:</span>
                <button
                  onClick={() => copyToClipboard(activeDataset.id, 'MongoDB ID')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy ID"
                >
                  <FiCopy size={12} />
                </button>
              </div>
              <code className="block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-mono text-xs break-all">
                {activeDataset.id}
              </code>
            </div>

            {/* Document ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Document ID:</span>
                <button
                  onClick={() => copyToClipboard(activeDataset.metadata?.documentId || 'N/A', 'Document ID')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy ID"
                >
                  <FiCopy size={12} />
                </button>
              </div>
              <code className="block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-mono text-xs break-all">
                {activeDataset.metadata?.documentId || 'N/A'}
              </code>
            </div>

            {/* User ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">User ID:</span>
                <button
                  onClick={() => copyToClipboard(userId || 'N/A', 'User ID')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy ID"
                >
                  <FiCopy size={12} />
                </button>
              </div>
              <code className="block px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-xs break-all">
                {userId || 'N/A'}
              </code>
            </div>

            {/* Sanitized User ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Sanitized User ID:</span>
                <button
                  onClick={() => copyToClipboard(sanitizedUserId, 'Sanitized User ID')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy ID"
                >
                  <FiCopy size={12} />
                </button>
              </div>
              <code className="block px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-xs break-all">
                {sanitizedUserId}
              </code>
            </div>

            {/* Test Retrieval Button */}
            <button
              onClick={onTestRetrieval}
              className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FiRefreshCw size={14} />
              Test Retrieval
            </button>

            {/* Last Error Details */}
            {lastErrorDetails && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center gap-2 mb-2 text-red-600">
                  <FiAlertTriangle size={14} />
                  <span className="font-medium">Last Error</span>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <code className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                      {lastErrorDetails.error_type || 'Unknown'}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-600">Message:</span>
                    <p className="mt-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs break-words">
                      {lastErrorDetails.error_message || 'No message available'}
                    </p>
                  </div>
                  {lastErrorDetails.query_length && (
                    <div>
                      <span className="text-gray-600">Query Length:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {lastErrorDetails.query_length} chars
                      </span>
                    </div>
                  )}
                  {lastErrorDetails.chunks_count !== undefined && (
                    <div>
                      <span className="text-gray-600">Chunks Retrieved:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {lastErrorDetails.chunks_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button 
            onClick={onExportChat}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium text-left"
          >
            Export Chat History
          </button>
          <button 
            onClick={onDownloadDataset}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium text-left"
          >
            Download Dataset
          </button>
          <button 
            onClick={onShareDataset}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium text-left"
          >
            Share Dataset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataChatSidebar;
