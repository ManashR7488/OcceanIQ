import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const UploadZone = ({ onUpload, loading, progress, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedFormats = ['.csv', '.json', '.xml', '.nc'];
  const maxSizeMB = 50;

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(ext)) {
      return { valid: false, error: `Invalid format. Accepted: ${acceptedFormats.join(', ')}` };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return { valid: false, error: `File too large. Max size: ${maxSizeMB}MB` };
    }

    return { valid: true };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || loading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const colors = {
      csv: 'text-green-600',
      json: 'text-yellow-600',
      xml: 'text-orange-600',
      nc: 'text-blue-600'
    };
    return colors[ext] || 'text-gray-600';
  };

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative p-6 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-teal-50 scale-[1.02]'
            : loading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        {/* Animated gradient border on drag */}
        {isDragOver && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 opacity-20 animate-pulse pointer-events-none" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          disabled={disabled || loading}
          className="hidden"
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Upload Icon or Progress */}
          {loading ? (
            <div className="relative mb-3">
              {/* Progress Ring */}
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - (progress || 0) / 100)}`}
                  className="transition-all duration-300"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiUpload size={24} className="text-blue-600 animate-pulse" />
              </div>
            </div>
          ) : selectedFile && !loading ? (
            <div className="mb-3 p-3 bg-green-50 rounded-full">
              <FiCheck size={32} className="text-green-600" />
            </div>
          ) : (
            <div
              className={`mb-3 p-3 rounded-full transition-all duration-300 ${
                isDragOver
                  ? 'bg-gradient-to-br from-blue-600 to-teal-600 scale-110'
                  : 'bg-gradient-to-br from-blue-100 to-teal-100'
              }`}
            >
              <FiUpload
                size={32}
                className={isDragOver ? 'text-white' : 'text-blue-600'}
              />
            </div>
          )}

          {/* Text */}
          <div>
            {loading ? (
              <>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  Uploading {selectedFile?.name}...
                </p>
                <p className="text-xs text-gray-600">{progress?.percent || 0}% complete</p>
              </>
            ) : selectedFile && !loading ? (
              <>
                <p className="text-sm font-medium text-green-700 mb-1 flex items-center justify-center gap-2">
                  <FiFile className={getFileIcon()} />
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {isDragOver ? 'Drop file to upload' : 'Upload Dataset'}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supported: {acceptedFormats.join(', ')} • Max {maxSizeMB}MB
                </p>
              </>
            )}
          </div>

          {/* Upload Button (when file selected but not uploading) */}
          {selectedFile && !loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpload(selectedFile);
                setSelectedFile(null);
              }}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all font-medium text-sm shadow-md hover:shadow-lg"
            >
              Confirm Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
