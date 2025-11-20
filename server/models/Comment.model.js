import mongoose from 'mongoose';

/**
 * Comment Model for Threaded Discussion Feature
 * 
 * Represents comments and replies in the community question forum.
 * Supports nested threading via self-referential parentComment field,
 * enabling infinite reply depth. Includes voting, soft delete, and
 * edit tracking for comprehensive discussion management.
 * 
 * THREADING ARCHITECTURE:
 * - Uses parent-child references via `parentComment` field (self-referential)
 * - `replies` array is NOT persisted in the schema - it is built at query time
 * - Static methods getThreadedComments() and getCommentWithReplies() attach
 *   `replies` arrays dynamically by traversing parentComment relationships
 * - This approach avoids data duplication and maintains single source of truth
 * - Controllers should use helper methods rather than manually building trees
 */

const commentSchema = new mongoose.Schema(
  {
    // Comment content - user's response or reply
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },

    // Author reference - user who posted the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true, // Optimize queries for user's comment history
    },

    // Question reference - every comment belongs to a question
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required'],
      index: true, // Optimize fetching all comments for a question
    },

    // Parent comment reference - enables nested threading
    // null/undefined = top-level comment
    // ObjectId = reply to another comment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true, // Optimize fetching replies to a comment
    },

    // Upvotes - users who found the comment helpful
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Downvotes - users who found the comment unhelpful
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Edit tracking - indicates if comment was modified after posting
    isEdited: {
      type: Boolean,
      default: false,
    },

    // Edit timestamp - when the comment was last edited
    editedAt: {
      type: Date,
    },

    // Soft delete - maintains thread structure while hiding content
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // Optimize filtering out deleted comments
    },

    // Deletion timestamp
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound index: Question + Creation Date
// Optimizes fetching all comments for a question chronologically
// Primary use case: Loading question discussion thread
commentSchema.index({ question: 1, createdAt: 1 });

// Compound index: Parent Comment + Creation Date
// Optimizes fetching replies to a specific comment chronologically
// Essential for nested threading and reply loading
commentSchema.index({ parentComment: 1, createdAt: 1 });

// Compound index: Question + Parent Comment
// Optimizes fetching top-level comments (where parentComment is null)
// Enables efficient separation of root comments from replies
commentSchema.index({ question: 1, parentComment: 1 });

// Compound index: Author + Question
// Optimizes finding user's comments within a specific question
// Useful for highlighting user's own comments in discussions
commentSchema.index({ author: 1, question: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

// Virtual: Vote Score
// Calculates net votes (upvotes - downvotes) for ranking comments
commentSchema.virtual('voteScore').get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Virtual: Reply Count
// Note: This is a placeholder virtual. In practice, replyCount will be
// computed via aggregation in controllers to avoid N+1 query issues.
// Controllers will populate this field manually after fetching comments.
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true,
});

// Virtual: Depth Level
// Returns 0 for top-level comments
// For nested comments, depth is calculated recursively in controllers
commentSchema.virtual('depth').get(function () {
  // Simple case: top-level comment
  if (!this.parentComment) return 0;
  
  // For nested comments, depth must be calculated by traversing parent chain
  // This is handled in controllers to avoid recursive DB queries
  // Controllers should set this field manually after population
  return this._depth || 1; // Default to 1 if not set by controller
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if this is a top-level comment (no parent)
 * @returns {boolean} - True if comment is at root level
 */
commentSchema.methods.isTopLevel = function () {
  return this.parentComment === null || this.parentComment === undefined;
};

/**
 * Check if a user has voted on this comment
 * @param {ObjectId|string} userId - ID of the user to check
 * @returns {'upvote'|'downvote'|null} - Type of vote or null if no vote
 */
commentSchema.methods.hasUserVoted = function (userId) {
  const userIdStr = userId.toString();

  const hasUpvoted = this.upvotes.some((id) => id.toString() === userIdStr);
  if (hasUpvoted) return 'upvote';

  const hasDownvoted = this.downvotes.some((id) => id.toString() === userIdStr);
  if (hasDownvoted) return 'downvote';

  return null;
};

/**
 * Toggle upvote for a user
 * If user already upvoted, removes upvote
 * If user downvoted, removes downvote and adds upvote
 * If no vote, adds upvote
 * @param {ObjectId|string} userId - ID of the user voting
 * @returns {Promise<Comment>} - Updated comment document
 */
commentSchema.methods.toggleUpvote = async function (userId) {
  const userIdStr = userId.toString();

  // Remove from downvotes if present
  this.downvotes = this.downvotes.filter((id) => id.toString() !== userIdStr);

  // Toggle upvote
  const upvoteIndex = this.upvotes.findIndex((id) => id.toString() === userIdStr);
  if (upvoteIndex > -1) {
    this.upvotes.splice(upvoteIndex, 1); // Remove upvote
  } else {
    this.upvotes.push(userId); // Add upvote
  }

  return this.save();
};

/**
 * Toggle downvote for a user
 * If user already downvoted, removes downvote
 * If user upvoted, removes upvote and adds downvote
 * If no vote, adds downvote
 * @param {ObjectId|string} userId - ID of the user voting
 * @returns {Promise<Comment>} - Updated comment document
 */
commentSchema.methods.toggleDownvote = async function (userId) {
  const userIdStr = userId.toString();

  // Remove from upvotes if present
  this.upvotes = this.upvotes.filter((id) => id.toString() !== userIdStr);

  // Toggle downvote
  const downvoteIndex = this.downvotes.findIndex((id) => id.toString() === userIdStr);
  if (downvoteIndex > -1) {
    this.downvotes.splice(downvoteIndex, 1); // Remove downvote
  } else {
    this.downvotes.push(userId); // Add downvote
  }

  return this.save();
};

/**
 * Soft delete this comment
 * Preserves thread structure by keeping the comment document
 * but replacing content with '[deleted]' placeholder
 * @returns {Promise<Comment>} - Updated comment document
 */
commentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[deleted]';
  
  return this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Fetch all comments for a question organized in threaded structure
 * Builds a nested tree with top-level comments and their replies
 * Comments are sorted in descending chronological order (newest first)
 * 
 * NOTE: Soft-deleted comments are INCLUDED to preserve thread structure.
 * Deleted comments will have content="[deleted]" and isDeleted=true.
 * This ensures reply chains remain intact even when parent comments are deleted.
 * 
 * @param {ObjectId|string} questionId - ID of the question
 * @returns {Promise<Array>} - Array of plain objects (not Mongoose docs) with nested replies
 */
commentSchema.statics.getThreadedComments = async function (questionId) {
  // Fetch all comments for the question, including soft-deleted ones
  // Soft-deleted comments preserve thread structure with placeholder content
  const allComments = await this.find({ 
    question: questionId
  })
    .populate('author', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  // Build comment lookup map for efficient nesting
  const commentMap = {};
  const topLevelComments = [];

  // First pass: Create map and identify top-level comments
  allComments.forEach((comment) => {
    comment.replies = []; // Initialize replies array
    commentMap[comment._id.toString()] = comment;

    if (!comment.parentComment) {
      topLevelComments.push(comment);
    }
  });

  // Second pass: Nest replies under parent comments
  allComments.forEach((comment) => {
    if (comment.parentComment) {
      const parentId = comment.parentComment.toString();
      const parent = commentMap[parentId];
      
      if (parent) {
        parent.replies.push(comment);
      }
    }
  });

  return topLevelComments;
};

/**
 * Fetch a comment with its nested replies up to specified depth
 * Uses recursive population for controlled depth traversal
 * 
 * PERFORMANCE NOTE: Returns plain JavaScript objects (via .lean()), NOT Mongoose documents.
 * This is optimized for read-only view rendering. Results cannot call instance methods
 * like save() or toggleUpvote(). If you need mutable documents, remove .lean() calls.
 * 
 * @param {ObjectId|string} commentId - ID of the comment
 * @param {number} depth - Maximum depth of nested replies to fetch (default: 3)
 * @returns {Promise<Object|null>} - Plain object with populated replies, or null if not found
 */
commentSchema.statics.getCommentWithReplies = async function (commentId, depth = 3) {
  if (depth <= 0) {
    // Base case: no more nesting, just fetch the comment
    return this.findById(commentId)
      .populate('author', 'name email profilePicture')
      .lean();
  }

  // Recursive case: fetch comment with one level of replies
  const comment = await this.findById(commentId)
    .populate('author', 'name email profilePicture')
    .lean();

  if (!comment) return null;

  // Fetch direct replies (one level down)
  // Include soft-deleted replies to preserve thread structure
  const replies = await this.find({ 
    parentComment: commentId
  })
    .populate('author', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  // Recursively fetch nested replies for each reply
  comment.replies = await Promise.all(
    replies.map(async (reply) => {
      const nestedReply = await this.getCommentWithReplies(reply._id, depth - 1);
      return nestedReply;
    })
  );

  return comment;
};

// ============================================================================
// CONFIGURATION
// ============================================================================

// Ensure virtual fields are included when converting to JSON/Object
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
