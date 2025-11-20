import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const SUGGESTED_TAGS = [
  'biodiversity',
  'oceanography',
  'methodology',
  'species-identification',
  'data-analysis',
  'climate-change',
  'marine-conservation',
  'edna',
  'taxonomy',
  'fieldwork'
];

const TagInput = ({ 
  tags = [], 
  onChange, 
  maxTags = 5, 
  placeholder = 'Add tags...' 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => 
      !tags.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const validateTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    
    if (!trimmed) {
      return { valid: false, error: 'Tag cannot be empty' };
    }
    if (trimmed.length > 30) {
      return { valid: false, error: 'Tag cannot exceed 30 characters' };
    }
    if (tags.includes(trimmed)) {
      return { valid: false, error: 'Tag already added' };
    }
    if (tags.length >= maxTags) {
      return { valid: false, error: `Maximum ${maxTags} tags allowed` };
    }
    return { valid: true, tag: trimmed };
  };

  const addTag = (tag) => {
    const validation = validateTag(tag);
    
    if (validation.valid) {
      onChange([...tags, validation.tag]);
      setInputValue('');
      setError('');
      setShowSuggestions(false);
    } else {
      setError(validation.error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
  };

  return (
    <div className="tag-input-container">
      <div className="flex flex-wrap gap-2 p-3 bg-white border-2 border-gray-200 rounded-lg focus-within:border-blue-500 transition-colors min-h-[50px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm rounded-full hover:from-blue-600 hover:to-teal-600 transition-all"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <FiX size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={tags.length >= maxTags}
          className="flex-1 min-w-[150px] outline-none bg-transparent text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
        />
      </div>

      {/* Tag count and error */}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-sm ${tags.length >= maxTags ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          {tags.length} / {maxTags} tags
        </span>
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 font-semibold">Suggested tags</div>
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-sm text-gray-700"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Press Enter or comma to add tags. Use relevant keywords to help others find your question.
      </p>
    </div>
  );
};

export default TagInput;
