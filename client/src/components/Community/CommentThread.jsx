import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiMessageSquare, FiEdit, FiTrash, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useCommunityStore from '../../store/useCommunityStore';
import VoteButtons from './VoteButtons';
import CommentForm from './CommentForm';
import DOMPurify from 'dompurify';

const CommentThread = ({
  comment,
  depth = 0,
  maxDepth = 5,
  onReply,
  onVote,
  onEdit,
  onDelete,
  currentUserId
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { deleteComment: storeDeleteComment } = useCommunityStore();

  if (!comment) return null;

  const isAuthor = currentUserId && comment.author?._id === currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const reachedMaxDepth = depth >= maxDepth;

  // Border color gradient based on depth
  const borderColors = [
    'border-blue-500',
    'border-teal-500',
    'border-cyan-500',
    'border-sky-500',
    'border-indigo-500'
  ];
  const borderColor = borderColors[depth % borderColors.length];

  // Indentation based on depth - fixed mapping for Tailwind JIT
  const indentLevels = ['', 'ml-4', 'ml-8', 'ml-12'];
  const indentClass = depth > 0 ? `${indentLevels[Math.min(depth, 3)]} pl-4` : '';

  const handleReplySubmit = (newComment) => {
    if (newComment) {
      if (onReply) {
        onReply(newComment);
      }
    }
    setShowReplyForm(false);
  };

  const handleEditSubmit = (updatedComment) => {
    if (updatedComment) {
      if (onEdit) {
        onEdit(updatedComment);
      }
    }
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setShowReplyForm(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const result = await storeDeleteComment(comment._id);
    if (result.success) {
      toast.success('Comment deleted');
      if (onDelete) {
        onDelete(comment);
      }
    }
  };

  // Sanitize HTML content
  const sanitizedContent = comment.isDeleted 
    ? '<p class="text-gray-400 italic">[deleted]</p>'
    : DOMPurify.sanitize(comment.content);

  return (
    <div className={`comment-thread ${indentClass}`}>
      <div className={`relative bg-white rounded-lg border-l-4 ${borderColor} p-4 mb-3 shadow-md transition-all`}>
        {/* Comment header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold">
              {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Author info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 truncate">
                  {comment.author?.name || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400 italic">(edited)</span>
                )}
              </div>
            </div>
          </div>

          {/* Collapse button for threads with replies */}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={showReplies ? 'Hide replies' : 'Show replies'}
            >
              {showReplies ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </button>
          )}
        </div>

        {/* Comment content or edit form */}
        {isEditing ? (
          <div className="mb-3">
            <CommentForm
              questionId={comment.question}
              commentId={comment._id}
              initialContent={comment.content}
              editMode={true}
              onSubmit={handleEditSubmit}
              placeholder="Edit your comment..."
              autoFocus
            />
            <button
              onClick={handleCancelEdit}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div 
            className="prose prose-sm max-w-none mb-3 text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}

        {/* Comment actions */}
        {!comment.isDeleted && (
          <div className="flex items-center gap-4 flex-wrap">
            <VoteButtons
              itemId={comment._id}
              itemType="comment"
              initialVoteScore={comment.voteScore || 0}
              initialUserVote={comment.userVote}
              onVoteChange={onVote}
            />

            {!reachedMaxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FiMessageSquare size={14} />
                Reply
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Edit comment"
                >
                  <FiEdit size={14} />
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  aria-label="Delete comment"
                >
                  <FiTrash size={14} />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && !comment.isDeleted && (
          <div className="mt-4 pl-4 border-l-2 border-gray-200">
            <CommentForm
              questionId={comment.question}
              parentCommentId={comment._id}
              onSubmit={handleReplySubmit}
              placeholder="Write your reply..."
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {showReplies && hasReplies && (
        <div className="space-y-2">
          {(showAllReplies ? comment.replies : comment.replies.slice(0, 3)).map((reply) => (
            <CommentThread
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onVote={onVote}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
          
          {!showAllReplies && comment.replies.length > 3 && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Load {comment.replies.length - 3} more {comment.replies.length - 3 === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}

      {/* Max depth reached message */}
      {reachedMaxDepth && hasReplies && showReplies && (
        <div className="ml-4 text-sm text-gray-500 italic">
          Thread depth limit reached. Refresh page to view deeper replies.
        </div>
      )}
    </div>
  );
};

export default CommentThread;
