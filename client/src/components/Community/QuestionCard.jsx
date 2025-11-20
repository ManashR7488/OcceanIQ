import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  FiMessageSquare,
  FiEye,
  FiEdit,
  FiTrash,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { TfiPin } from "react-icons/tfi";
import VoteButtons from "./VoteButtons";
import DOMPurify from "dompurify";

const QuestionCard = ({
  question,
  variant = "list", // 'list' or 'detail'
  onVote,
  onEdit,
  onDelete,
  showActions = false,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!question) return null;

  const isAuthor = currentUserId && question.author?._id === currentUserId;
  const isListView = variant === "list";

  // Strip HTML and truncate content for list view
  const getContentPreview = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    const text = tmp.textContent || "";
    return text.length > 200 ? text.substring(0, 200) + "..." : text;
  };

  // Sanitize HTML content for detail view
  const sanitizedContent = DOMPurify.sanitize(question.content);

  const handleCardClick = () => {
    if (isListView) {
      navigate(`/app/community/${question._id}`);
    }
  };

  return (
    <div
      className={`question-card bg-linear-to-br h-fit from-cyan-50 to-cyan-400 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 ${
        isListView ? "cursor-pointer" : ""
      }`}
      onClick={isListView ? handleCardClick : undefined}
    >
      <div className="p-6">
        {/* Badges */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {question.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
              <TfiPin size={12} />
              Pinned
            </span>
          )}
          {question.isResolved && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              <FiCheckCircle size={12} />
              Resolved
            </span>
          )}
          {!question.isResolved && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              <FiClock size={12} />
              Open
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className={`font-bold text-gray-900 mb-3 ${
            isListView ? "text-xl line-clamp-2" : "text-2xl"
          }`}
        >
          {question.title}
        </h2>

        {/* Content */}
        <div className="mb-4">
          {isListView ? (
            <p className="text-gray-600 text-sm line-clamp-3">
              {getContentPreview(question.content)}
            </p>
          ) : (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
        </div>

        {/* Image */}
        {question.imageUrl && (
          <div className="mb-4">
            <img
              src={question.imageUrl}
              alt="Question attachment"
              className={`rounded-lg border border-gray-200 ${
                isListView
                  ? "max-h-48 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  : imageExpanded
                  ? "w-full cursor-pointer"
                  : "max-h-96 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isListView) setImageExpanded(!imageExpanded);
              }}
            />
          </div>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-800 text-xs font-medium rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author and metadata */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {question.author?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Author info */}
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {question.author?.name || "Unknown User"}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(question.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {/* Stats and actions */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Vote buttons */}
            <div onClick={(e) => e.stopPropagation()}>
              <VoteButtons
                itemId={question._id}
                itemType="question"
                initialVoteScore={question.voteScore || 0}
                initialUserVote={question.userVote}
                onVoteChange={onVote}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1" title="Comments">
                <FiMessageSquare size={16} />
                {question.commentCount || 0}
              </span>
              <span className="flex items-center gap-1" title="Views">
                <FiEye size={16} />
                {question.viewCount || 0}
              </span>
            </div>

            {/* Action buttons */}
            {showActions && isAuthor && !isListView && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onEdit}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label="Edit question"
                  title="Edit"
                >
                  <FiEdit size={18} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete question"
                  title="Delete"
                >
                  <FiTrash size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
