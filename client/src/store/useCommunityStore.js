import { create } from "zustand";
import axiosInstance from "../config/axios.config";
import { toast } from "react-toastify";

const useCommunityStore = create((set, get) => ({
  // Questions list state
  questions: [],
  questionsLoading: false,
  questionsError: null,
  justCreatedQuestion: false,
  createdQuestionTimestamp: null,
  
  // Pagination state
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
    total: 0
  },
  
  // Filters state
  filters: {
    search: '',
    tags: '',
    isResolved: '',
    isPinned: '',
    sortBy: 'recent'
  },
  
  // Single question detail state
  currentQuestion: null,
  currentQuestionLoading: false,
  
  // Comments state
  comments: [],
  commentsLoading: false,

  // Fetch questions list with filters and pagination
  fetchQuestions: async (pageNum = 1, append = false) => {
    const { justCreatedQuestion, createdQuestionTimestamp } = get();
    // If we just created a question very recently, skip refetch to avoid overwriting optimistic update
    // But only for first-page non-append fetches; allow pagination to work normally
    if (justCreatedQuestion && createdQuestionTimestamp && pageNum === 1 && !append) {
      const age = Date.now() - createdQuestionTimestamp;
      if (age < 5000) {
        return; // preserve optimistic created question for at least 5s
      }
    }

    set({ questionsLoading: true, questionsError: null });
    
    // Clear the flag only when we proceed with a first-page non-append fetch
    // This allows pagination (append=true) to work without clearing the protection
    if (pageNum === 1 && !append) {
      set({ justCreatedQuestion: false, createdQuestionTimestamp: null });
    }

    try {
      const { filters, pagination } = get();
      
      const params = {
        page: pageNum,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.tags && { tags: filters.tags }),
        ...(filters.isResolved && { isResolved: filters.isResolved }),
        ...(filters.isPinned && { isPinned: filters.isPinned }),
        ...(filters.sortBy && { sortBy: filters.sortBy })
      };

      const response = await axiosInstance.get('/community/questions', { params });

      if (response.data.success) {
        set({
          questions: append 
            ? [...get().questions, ...response.data.results]
            : response.data.results,
          pagination: {
            ...pagination,
            page: pageNum,
            hasMore: response.data.pagination.hasMore,
            total: response.data.pagination.total
          },
          questionsLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      const errorMessage = 'Failed to load questions';
      set({ questionsError: errorMessage, questionsLoading: false });
      toast.error(errorMessage);
    }
  },

  // Set filters and reset to page 1
  setFilters: (newFilters) => {
    set({ 
      filters: { ...get().filters, ...newFilters },
      pagination: { ...get().pagination, page: 1 }
    });
    get().fetchQuestions(1, false);
  },

  // Fetch single question with comments
  fetchQuestionById: async (id) => {
    set({ currentQuestionLoading: true });
    
    try {
      const response = await axiosInstance.get(`/community/questions/${id}`);

      if (response.data.success) {
        set({
          currentQuestion: response.data.question,
          comments: response.data.comments || [],
          currentQuestionLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      set({ currentQuestionLoading: false });
      toast.error('Failed to load question');
      throw error;
    }
  },

  // Create new question (optimistic update)
  createQuestion: async (formData) => {
    try {
      const response = await axiosInstance.post('/community/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const newQuestion = response.data.question;
        
        // Add to questions array at the beginning
        set({
          questions: [newQuestion, ...get().questions]
        });
        // mark that we just created a question to avoid immediate refetch overwriting it
        set({ justCreatedQuestion: true, createdQuestionTimestamp: Date.now() });
        // auto-clear after 5 seconds
        setTimeout(() => {
          const { createdQuestionTimestamp: ts } = get();
          // only clear if timestamp hasn't changed (avoid clearing a newer create)
          if (ts && Date.now() - ts >= 5000) {
            set({ justCreatedQuestion: false, createdQuestionTimestamp: null });
          }
        }, 5000);
        
        return { success: true, question: newQuestion };
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error(error.response?.data?.message || 'Failed to create question');
      return { success: false, error };
    }
  },

  clearJustCreatedFlag: () => {
    set({ justCreatedQuestion: false, createdQuestionTimestamp: null });
  },

  // Update question - purely local state update
  updateQuestion: (updatedQuestion) => {
    // Update in questions list
    set({
      questions: get().questions.map(q => 
        q._id === updatedQuestion._id ? { ...q, ...updatedQuestion } : q
      )
    });
    
    // Update current question if viewing it
    if (get().currentQuestion?._id === updatedQuestion._id) {
      set({ currentQuestion: updatedQuestion });
    }
    
    return { success: true, question: updatedQuestion };
  },

  // Delete question
  deleteQuestion: async (id) => {
    try {
      await axiosInstance.delete(`/community/questions/${id}`);
      
      // Remove from questions list
      set({
        questions: get().questions.filter(q => q._id !== id)
      });
      
      // Clear current question if it's the deleted one
      if (get().currentQuestion?._id === id) {
        set({ currentQuestion: null, comments: [] });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error(error.response?.data?.message || 'Failed to delete question');
      return { success: false, error };
    }
  },

  // Create comment (optimistic update)
  createComment: async (questionId, content, parentCommentId = null) => {
    try {
      const response = await axiosInstance.post(
        `/community/questions/${questionId}/comments`,
        { content, parentComment: parentCommentId }
      );

      if (response.data.success) {
        const newComment = response.data.comment;
        
        // Add to comments array
        if (parentCommentId) {
          // For nested replies, insert in-place without refetch
          const insertReplyRecursive = (comments, parentId, reply) => {
            return comments.map(comment => {
              if (comment._id === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), reply]
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: insertReplyRecursive(comment.replies, parentId, reply)
                };
              }
              return comment;
            });
          };
          
          set({
            comments: insertReplyRecursive(get().comments, parentCommentId, newComment)
          });
        } else {
          // For top-level comments, add directly
          set({
            comments: [...get().comments, newComment]
          });
        }
        
        // Increment commentCount on currentQuestion and in questions list
        const currentQuestion = get().currentQuestion;
        if (currentQuestion && currentQuestion._id === questionId) {
          const updatedCurrentQuestion = {
            ...currentQuestion,
            commentCount: (currentQuestion.commentCount || 0) + 1
          };
          set({ currentQuestion: updatedCurrentQuestion });
          
          // Also update in questions list
          set({
            questions: get().questions.map(q =>
              q._id === questionId
                ? { ...q, commentCount: (q.commentCount || 0) + 1 }
                : q
            )
          });
        }
        
        return { success: true, comment: newComment };
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to post comment');
      return { success: false, error };
    }
  },

  // Update comment
  updateComment: async (commentId, content) => {
    try {
      const response = await axiosInstance.put(
        `/community/comments/${commentId}`,
        { content }
      );

      if (response.data.success) {
        const updatedComment = response.data.comment;
        
        // Update comment in the array (recursive for nested)
        const updateCommentsRecursive = (comments) => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, ...updatedComment };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentsRecursive(comment.replies)
              };
            }
            return comment;
          });
        };
        
        set({
          comments: updateCommentsRecursive(get().comments)
        });
        
        return { success: true, comment: updatedComment };
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to update comment');
      return { success: false, error };
    }
  },

  // Helper function to count nested comments
  countNestedComments: (comment) => {
    if (!comment) return 0;
    const count = 1 + (comment.replies?.reduce((sum, reply) => sum + get().countNestedComments(reply), 0) || 0);
    return count;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    try {
      const response = await axiosInstance.delete(`/community/comments/${commentId}`);
      
      // Get total deleted count from server response
      const totalToDelete = response.data.totalDeleted || 1;
      
      // Remove comment from the array (recursive for nested)
      const deleteCommentsRecursive = (comments) => {
        return comments.filter(comment => {
          if (comment._id === commentId) {
            return false;
          }
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = deleteCommentsRecursive(comment.replies);
          }
          return true;
        });
      };
      
      set({
        comments: deleteCommentsRecursive(get().comments)
      });
      
      // Decrement commentCount on currentQuestion and in questions list
      const currentQuestion = get().currentQuestion;
      if (currentQuestion) {
        const updatedCurrentQuestion = {
          ...currentQuestion,
          commentCount: Math.max(0, (currentQuestion.commentCount || 0) - totalToDelete)
        };
        set({ currentQuestion: updatedCurrentQuestion });
        
        // Also update in questions list
        set({
          questions: get().questions.map(q =>
            q._id === currentQuestion._id
              ? { ...q, commentCount: Math.max(0, (q.commentCount || 0) - totalToDelete) }
              : q
          )
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
      return { success: false, error };
    }
  },

  // Toggle question vote (optimistic update)
  toggleQuestionVote: async (questionId, voteType) => {
    try {
      const response = await axiosInstance.post(
        `/community/questions/${questionId}/vote`,
        { voteType }
      );

      if (response.data.success) {
        const { voteScore, userVote } = response.data;
        
        // Update in questions list
        set({
          questions: get().questions.map(q => 
            q._id === questionId 
              ? { ...q, voteScore, userVote } 
              : q
          )
        });
        
        // Update current question if viewing it
        if (get().currentQuestion?._id === questionId) {
          set({
            currentQuestion: {
              ...get().currentQuestion,
              voteScore,
              userVote
            }
          });
        }
        
        return { success: true, voteScore, userVote };
      }
    } catch (error) {
      console.error('Error toggling question vote:', error);
      toast.error(error.response?.data?.message || 'Failed to register vote');
      return { success: false, error };
    }
  },

  // Toggle comment vote (optimistic update)
  toggleCommentVote: async (commentId, voteType) => {
    try {
      const response = await axiosInstance.post(
        `/community/comments/${commentId}/vote`,
        { voteType }
      );

      if (response.data.success) {
        const { voteScore, userVote } = response.data;
        
        // Update comment in the array (recursive for nested)
        const updateCommentVotesRecursive = (comments) => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, voteScore, userVote };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentVotesRecursive(comment.replies)
              };
            }
            return comment;
          });
        };
        
        set({
          comments: updateCommentVotesRecursive(get().comments)
        });
        
        return { success: true, voteScore, userVote };
      }
    } catch (error) {
      console.error('Error toggling comment vote:', error);
      toast.error(error.response?.data?.message || 'Failed to register vote');
      return { success: false, error };
    }
  },

  // Reset all community state
  resetCommunityState: () => {
    set({
      questions: [],
      questionsLoading: false,
      questionsError: null,
      justCreatedQuestion: false,
      createdQuestionTimestamp: null,
      pagination: {
        page: 1,
        limit: 20,
        hasMore: true,
        total: 0
      },
      filters: {
        search: '',
        tags: '',
        isResolved: '',
        isPinned: '',
        sortBy: 'recent'
      },
      currentQuestion: null,
      currentQuestionLoading: false,
      comments: [],
      commentsLoading: false
    });
  }
}));

export default useCommunityStore;
