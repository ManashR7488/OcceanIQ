import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Write your content here...', 
  maxLength = 10000,
  readOnly = false 
}) => {
  // Strip HTML tags to count actual text length
  const getTextLength = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent?.length || 0;
  };

  const currentLength = getTextLength(value);
  const isOverLimit = currentLength > maxLength;

  // Configure Quill toolbar modules
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false // Strip formatting on paste
    }
  }), []);

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'blockquote', 'code-block'
  ];

  const handleChange = (content) => {
    const textLength = getTextLength(content);
    if (textLength <= maxLength) {
      onChange(content);
    }
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
        className={`bg-white rounded-lg border-2 transition-all ${
          isOverLimit 
            ? 'border-red-500 focus-within:border-red-600' 
            : 'border-gray-200 focus-within:border-blue-500'
        }`}
        aria-label={placeholder}
      />
      <div className={`flex justify-end mt-2 text-sm ${
        isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'
      }`}>
        {currentLength} / {maxLength} characters
        {isOverLimit && (
          <span className="ml-2 text-red-600">
            ({currentLength - maxLength} over limit)
          </span>
        )}
      </div>
      {isOverLimit && (
        <p className="text-red-600 text-sm mt-1">
          Please reduce your content to fit within the character limit.
        </p>
      )}
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 200px;
          font-size: 1rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f8fafc;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
