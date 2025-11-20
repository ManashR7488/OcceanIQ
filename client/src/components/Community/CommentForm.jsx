import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from '../../config/axios.config';
import useCommunityStore from '../../store/useCommunityStore';

const CommentForm = ({
  questionId,
  parentCommentId = null,
  commentId = null,
  initialContent = '',
  editMode = false,
  onSubmit,
  placeholder = 'Add a comment...',
  autoFocus = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const maxLength = 5000;
  
  const { createComment: storeCreateComment, updateComment: storeUpdateComment } = useCommunityStore();

  const isOverLimit = content.length > maxLength;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Auto-focus if specified
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      let result;
      
      if (editMode && commentId) {
        // Edit mode: Update comment in store
        result = await storeUpdateComment(commentId, content.trim());
        
        if (result.success) {
          toast.success('Comment updated!');
          if (onSubmit) {
            onSubmit(result.comment);
          }
        }
      } else {
        // Create mode: Add comment to store
        result = await storeCreateComment(questionId, content.trim(), parentCommentId);

        if (result.success) {
          toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
          setContent('');
          
          if (onSubmit) {
            onSubmit(result.comment);
          }
        }
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'post'} comment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    setContent('');
    if (onSubmit) {
      onSubmit(null); // Signal cancel for inline replies
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <div className={`relative bg-white border-2 rounded-lg transition-all ${
        isOverLimit 
          ? 'border-red-500 focus-within:border-red-600' 
          : 'border-gray-200 focus-within:border-blue-500 focus-within:shadow-md'
      }`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-3 pr-10 resize-none outline-none rounded-lg min-h-[80px] max-h-[300px]"
          disabled={isSubmitting}
          rows={2}
        />
        
        {/* Character counter */}
        <div className={`absolute bottom-2 right-2 text-xs ${
          isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-400'
        }`}>
          {content.length} / {maxLength}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Ctrl</kbd> + 
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 ml-1">Enter</kbd> to submit
        </p>
        
        <div className="flex gap-2">
          {parentCommentId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {editMode ? 'Updating...' : 'Posting...'}
              </>
            ) : (
              <>
                <FiSend size={16} />
                {editMode ? 'Update' : (parentCommentId ? 'Reply' : 'Comment')}
              </>
            )}
          </button>
        </div>
      </div>

      {isOverLimit && (
        <p className="text-sm text-red-600 mt-1">
          Please reduce your comment to fit within {maxLength} characters.
        </p>
      )}
    </form>
  );
};

export default CommentForm;
