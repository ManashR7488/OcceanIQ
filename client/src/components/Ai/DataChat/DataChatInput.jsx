import React, { useRef, useEffect } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

const DataChatInput = ({ value, onChange, onSend, disabled, loading, suggestions }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    textareaRef.current?.focus();
  };

  const charCount = value.length;
  const maxChars = 1000;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && !value && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2 font-medium">Example questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled || loading}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="relative flex items-end gap-2">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || loading}
              placeholder={
                disabled
                  ? 'Select a dataset to start chatting...'
                  : loading
                  ? 'AI is thinking...'
                  : 'Ask a question about your data... (Ctrl+Enter to send)'
              }
              rows={1}
              className={`w-full px-4 py-3 pr-16 border rounded-xl resize-none focus:outline-none transition-all ${
                disabled || loading
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              } ${isOverLimit ? 'border-red-500' : ''}`}
              style={{ maxHeight: '120px' }}
            />

            {/* Character Counter */}
            <div
              className={`absolute bottom-2 right-2 text-xs ${
                isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-400'
              }`}
            >
              {charCount}/{maxChars}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={onSend}
            disabled={disabled || loading || !value.trim() || isOverLimit}
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all transform ${
              disabled || loading || !value.trim() || isOverLimit
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
            title={loading ? 'Sending...' : 'Send message (Ctrl+Enter)'}
          >
            {loading ? (
              <FiLoader size={20} className="animate-spin" />
            ) : (
              <FiSend size={20} />
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-2 text-xs text-gray-500 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Enter</kbd> to send
        </p>
      </div>
    </div>
  );
};

export default DataChatInput;
