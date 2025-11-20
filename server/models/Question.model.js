import mongoose from 'mongoose';

/**
 * Question Model for Community Discussion Feature
 * 
 * Represents user-submitted questions in the marine research community forum.
 * Supports rich text content, image attachments, tagging, voting, and moderation.
 * Designed for efficient querying by tags, author, resolution status, and popularity.
 */

const questionSchema = new mongoose.Schema(
  {
    // Question title - concise summary of the inquiry
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true, // Enable efficient title-based searches
    },

    // Question content - detailed description supporting HTML for rich text
    content: {
      type: String,
      required: [true, 'Question content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },

    // Author reference - user who posted the question
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Question author is required'],
      index: true, // Optimize queries for user's question history
    },

    // Optional image attachment (uploaded via Cloudinary)
    imageUrl: {
      type: String,
      trim: true,
    },

    // Cloudinary public ID for image management and transformations
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },

    // Tags for categorization and filtering (e.g., biodiversity, oceanography, methodology)
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.every((tag) => tag.length <= 60);
        },
        message: 'Each tag must be 60 characters or less',
      },
    },

    // View count - tracks question popularity
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },

    // Upvotes - users who found the question helpful
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Downvotes - users who found the question unhelpful
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Pinned status - moderators can highlight important questions
    isPinned: {
      type: Boolean,
      default: false,
      index: true, // Optimize filtering for pinned questions
    },

  // Resolved status - marks questions that have received satisfactory answers
  isResolved: {
    type: Boolean,
    default: false,
    index: true, // Optimize filtering for open vs. resolved questions
  },

  // Edit tracking - marks questions that have been edited after creation
  isEdited: {
    type: Boolean,
    default: false,
  },

  // Edit timestamp - records when the question was last edited
  editedAt: {
    type: Date,
  },
},
{
  timestamps: true, // Auto-generates createdAt and updatedAt
}
);// ============================================================================
// INDEXES
// ============================================================================

// Text index for full-text search on title and content
// Enables efficient keyword-based question discovery
questionSchema.index({ title: 'text', content: 'text' });

// Simple index: Creation Date (descending)
// Supports global sorting by recency without additional filters
// Essential for "Recent Questions" feeds and homepage listings
questionSchema.index({ createdAt: -1 });

// Compound index: Tags + Creation Date
// Optimizes queries for tag-based filtering sorted chronologically
// Common pattern: "Show me all 'biodiversity' questions, newest first"
questionSchema.index({ tags: 1, createdAt: -1 });

// Compound index: Author + Creation Date
// Optimizes queries for user's question history sorted by date
// Enables efficient "My Questions" views
questionSchema.index({ author: 1, createdAt: -1 });

// Compound index: Resolution Status + Creation Date
// Optimizes queries for open questions or resolved questions chronologically
// Useful for "Unanswered Questions" feeds
questionSchema.index({ isResolved: 1, createdAt: -1 });

// Compound index: Pinned + Creation Date
// Ensures pinned questions appear first, then sorted by date
// Used in main question feed with moderator highlights
questionSchema.index({ isPinned: -1, createdAt: -1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

// Virtual: Vote Score
// Calculates net votes (upvotes - downvotes) for ranking questions
questionSchema.virtual('voteScore').get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Virtual: Comments Array
// Populates all Comment documents associated with this question
// Use .populate('comments') in controllers to load the full comment thread
questionSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'question',
});

// Virtual: Comment Count
// Provides efficient count without loading all comment documents
// Use .populate('commentCount') for just the number of comments
questionSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'question',
  count: true,
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if a user has voted on this question
 * @param {ObjectId|string} userId - ID of the user to check
 * @returns {'upvote'|'downvote'|null} - Type of vote or null if no vote
 */
questionSchema.methods.hasUserVoted = function (userId) {
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
 * @returns {Promise<Question>} - Updated question document
 */
questionSchema.methods.toggleUpvote = async function (userId) {
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
 * @returns {Promise<Question>} - Updated question document
 */
questionSchema.methods.toggleDownvote = async function (userId) {
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

// ============================================================================
// CONFIGURATION
// ============================================================================

// Ensure virtual fields are included when converting to JSON/Object
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Question = mongoose.model('Question', questionSchema);

export default Question;
