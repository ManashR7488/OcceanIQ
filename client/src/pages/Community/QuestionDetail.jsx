import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash, FiCheckCircle, FiShare2, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from '../../config/axios.config';
import useAuthStore from '../../store/useAuthStore';
import useCommunityStore from '../../store/useCommunityStore';
import QuestionCard from '../../components/Community/QuestionCard';
import CommentThread from '../../components/Community/CommentThread';
import CommentForm from '../../components/Community/CommentForm';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    currentQuestion, 
    comments, 
    currentQuestionLoading, 
    fetchQuestionById, 
    updateQuestion, 
    deleteQuestion 
  } = useCommunityStore();

  useEffect(() => {
    fetchQuestionById(id);
  }, [id, fetchQuestionById]);

  const handleCommentSubmit = (newComment) => {
    // Comments are already updated in store by CommentForm
  };

  const handleMarkResolved = async () => {
    try {
      const response = await axios.put(`/community/questions/${id}`, {
        isResolved: !currentQuestion.isResolved
      });

      if (response.data.success) {
        updateQuestion(response.data.question);
        toast.success(
          currentQuestion.isResolved 
            ? 'Question marked as unresolved' 
            : 'Question marked as resolved'
        );
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question status');
    }
  };

  const handleEdit = () => {
    // Navigate to edit form with question data in state
    navigate(`/app/community/edit/${id}`, { 
      state: { 
        question: {
          title: currentQuestion.title,
          content: currentQuestion.content,
          tags: currentQuestion.tags,
          imageUrl: currentQuestion.imageUrl
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteQuestion(id);
      if (result.success) {
        toast.success('Question deleted successfully');
        navigate('/app/community');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleCommentEdit = async (updatedComment) => {
    // Comments are already updated in store
  };

  const handleCommentDelete = async (comment) => {
    // This is handled by CommentThread which calls store action
  };

  const handleShare = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast.error('Sharing is not supported in this browser');
      return;
    }
    
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  if (currentQuestionLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !currentQuestionLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Question not found</h2>
          <p className="text-gray-600 mb-6">
            The question you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/app/community')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isAuthor = user && currentQuestion.author?._id === user._id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md rounded-lg shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 truncate flex-1">
          {currentQuestion.title}
        </h1>
        <div className="flex gap-2">
          {isAuthor && (
            <button
              onClick={handleMarkResolved}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentQuestion.isResolved
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={currentQuestion.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
            >
              {currentQuestion.isResolved ? <FiCheckCircle size={18} /> : <FiClock size={18} />}
              {currentQuestion.isResolved ? 'Resolved' : 'Mark Resolved'}
            </button>
          )}
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Share question"
          >
            <FiShare2 size={20} />
          </button>
        </div>
      </div>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        variant="detail"
        showActions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={user?._id}
      />

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>Responses</span>
          <span className="text-sm font-normal text-gray-500">
            ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
          </span>
        </h2>

        {/* Add Comment Form */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <CommentForm
            questionId={id}
            onSubmit={handleCommentSubmit}
            placeholder="Share your thoughts or provide an answer..."
          />
        </div>

        {/* Comments Thread */}
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600">
              Be the first to share your thoughts on this question!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                onReply={handleCommentSubmit}
                onEdit={handleCommentEdit}
                onDelete={handleCommentDelete}
                currentUserId={user?._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
