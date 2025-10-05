import { useState, useRef } from 'react';
import { FiUpload } from 'react-icons/fi';
import { validateFileSize, validateFileType } from '../../utils/fileUtils';

/**
 * File upload component with drag-and-drop functionality
 */
function FileUpload({
  onFileSelect,
  acceptedTypes = ['csv', 'json'],
  maxSizeMB = 100,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSelectFile = (file) => {
    setError(null);

    // Validate file type
    const typeValidation = validateFileType(file, acceptedTypes);
    if (!typeValidation.valid) {
      setError(typeValidation.error);
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, maxSizeMB);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error);
      return;
    }

    // File is valid, call callback
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-cyan-500 bg-cyan-50' 
            : 'border-gray-300 bg-white hover:border-cyan-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="File input"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-cyan-100' : 'bg-gray-100'}
            transition-colors duration-200
          `}>
            <FiUpload 
              className={`
                w-8 h-8
                ${isDragging ? 'text-cyan-600' : 'text-gray-600'}
                transition-colors duration-200
              `}
            />
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {isDragging ? 'Drop file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-400">
            <p>Accepted formats: {acceptedTypes.map(t => t.toUpperCase()).join(', ')}</p>
            <p>Maximum file size: {maxSizeMB} MB</p>
          </div>
        </div>

        {/* Screen reader announcements */}
        {isDragging && (
          <div className="sr-only" role="status" aria-live="polite">
            File is over the drop zone. Release to upload.
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div 
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
