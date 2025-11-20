import Question from "../models/Question.model.js";
import Comment from "../models/Comment.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  CLOUDINARY_FOLDER_COMMUNITY,
} from "../config/cloudinary.config.js";

/**
 * Helper function to get pagination parameters from request query
 * @param {Object} req - Express request object
 * @returns {Object} Pagination parameters
 */
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Create a new question with optional image upload
 * POST /api/community/questions
 */
export const createQuestion = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { title, content } = req.body;
    let { tags } = req.body;

    // Parse tags if sent as JSON string
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        tags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }

    // Ensure tags is an array
    const parsedTags = Array.isArray(tags) ? tags : tags ? [tags] : [];

    // Validate tag lengths
    if (parsedTags.some(tag => tag.length > 60)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Each tag must be 60 characters or less",
      });
    }

    // Validate required fields
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Title and content are required",
      });
    }

    // Validate lengths
    if (title.trim().length > 200) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Title must not exceed 200 characters",
      });
    }

    if (content.trim().length > 10000) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content must not exceed 10000 characters",
      });
    }

    // Prepare question data
    const questionData = {
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
      tags: parsedTags,
    };

    // Handle optional image upload
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: CLOUDINARY_FOLDER_COMMUNITY,
        });

        questionData.imageUrl = uploadResult.secure_url;
        questionData.cloudinaryPublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error in createQuestion:", uploadError);
        // Continue without image - save question even if image upload fails
        console.log("Proceeding to save question without image");
      }
    }

    // Create question
    const question = await Question.create(questionData);

    // Populate author details
    await question.populate("author", "name email profilePicture");

    const executionTime = Date.now() - startTime;
    if (executionTime > 3000) {
      console.warn(`createQuestion took ${executionTime}ms`);
    }

    res.status(201).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Error in createQuestion:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to create question",
    });
  }
};

/**
 * Get paginated list of questions with filters
 * GET /api/community/questions
 */
export const getQuestions = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { tags, author, isResolved, isPinned, search } = req.query;

    // Build query filter
    const filter = {};

    if (tags) {
      filter.tags = Array.isArray(tags) ? { $in: tags } : tags;
    }

    if (author) {
      filter.author = author;
    }

    if (isResolved !== undefined) {
      filter.isResolved = isResolved === "true";
    }

    if (isPinned !== undefined) {
      filter.isPinned = isPinned === "true";
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Execute query with pagination
    // Note: .populate('commentCount') triggers count aggregation for the virtual field
    // This executes in parallel with Mongoose batching for performance
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("author", "name email profilePicture")
        .populate("commentCount")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Question.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // Add per-user vote state to each question
    const questionsWithVoteState = questions.map((question) => {
      const voteScore = question.upvotes.length - question.downvotes.length;
      const hasUpvoted = question.upvotes.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
      const hasDownvoted = question.downvotes.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
      const userVote = hasUpvoted ? "upvote" : hasDownvoted ? "downvote" : null;

      return {
        ...question,
        voteScore,
        userVote,
      };
    });

    const executionTime = Date.now() - startTime;
    if (executionTime > 3000) {
      console.warn(`getQuestions took ${executionTime}ms`);
    }

    res.status(200).json({
      success: true,
      results: questionsWithVoteState,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error in getQuestions:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to fetch questions",
    });
  }
};

/**
 * Get single question by ID with threaded comments
 * GET /api/community/questions/:id
 */
export const getQuestionById = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;

    // Increment view count atomically
    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("author", "name email profilePicture");

    if (!question) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Question not found",
      });
    }

    // Fetch threaded comments using static method
    const comments = await Comment.getThreadedComments(id);

    const executionTime = Date.now() - startTime;
    if (executionTime > 3000) {
      console.warn(`getQuestionById took ${executionTime}ms`);
    }

    res.status(200).json({
      success: true,
      question,
      comments,
    });
  } catch (error) {
    console.error("Error in getQuestionById:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to fetch question",
    });
  }
};

/**
 * Update question (author only)
 * PUT /api/community/questions/:id
 */
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Question not found",
      });
    }

    // Verify ownership
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "AuthorizationError",
        message: "You are not authorized to update this question",
      });
    }

    // Validate updates
    if (title && title.trim().length > 200) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Title must not exceed 200 characters",
      });
    }

    if (content && content.trim().length > 10000) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content must not exceed 10000 characters",
      });
    }

    // Track if content has changed for edit tracking
    const titleChanged = title && title.trim() !== question.title;
    const contentChanged = content && content.trim() !== question.content;

    // Update allowed fields
    if (title) question.title = title.trim();
    if (content) question.content = content.trim();
    if (tags) question.tags = Array.isArray(tags) ? tags : [tags];

    // Mark as edited if content or title changed
    if (titleChanged || contentChanged) {
      question.isEdited = true;
      question.editedAt = new Date();
    }

    await question.save();
    await question.populate("author", "name email profilePicture");

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Error in updateQuestion:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to update question",
    });
  }
};

/**
 * Delete question with cascade delete of comments (author or admin only)
 * DELETE /api/community/questions/:id
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Question not found",
      });
    }

    // Verify ownership or admin role
    const isAuthor = question.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        error: "AuthorizationError",
        message: "You are not authorized to delete this question",
      });
    }

    // Delete image from Cloudinary if exists
    if (question.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(question.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with question deletion even if image deletion fails
      }
    }

    // Hard deletion strategy: Questions and their comments are fully removed from the database.
    // This is intentional - unlike comment soft-deletion which preserves thread structure,
    // question deletion represents complete removal of the discussion.
    // Cascade delete all comments
    await Comment.deleteMany({ question: id });

    // Delete question
    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: "Question and associated comments deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to delete question",
    });
  }
};

/**
 * Toggle upvote or downvote on question
 * POST /api/community/questions/:id/vote
 */
export const toggleQuestionVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid vote type. Must be 'upvote' or 'downvote'",
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Question not found",
      });
    }

    // Toggle vote using instance methods
    if (voteType === "upvote") {
      await question.toggleUpvote(req.user._id);
    } else {
      await question.toggleDownvote(req.user._id);
    }

    // Determine user's current vote status
    const hasUpvoted = question.upvotes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    const hasDownvoted = question.downvotes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      voteScore: question.voteScore,
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length,
      userVote: hasUpvoted ? "upvote" : hasDownvoted ? "downvote" : null,
    });
  } catch (error) {
    console.error("Error in toggleQuestionVote:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to toggle vote",
    });
  }
};

/**
 * Create a comment or reply
 * POST /api/community/questions/:questionId/comments
 */
export const createComment = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, parentComment } = req.body;

    // Validate content
    if (!content?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content is required",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content must not exceed 5000 characters",
      });
    }

    // Verify question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Question not found",
      });
    }

    // Verify parent comment if provided
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({
          error: "NotFoundError",
          message: "Parent comment not found",
        });
      }

      // Ensure parent comment belongs to same question
      if (parentCommentDoc.question.toString() !== questionId) {
        return res.status(400).json({
          error: "ValidationError",
          message: "Parent comment does not belong to this question",
        });
      }
    }

    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      author: req.user._id,
      question: questionId,
      parentComment: parentComment || null,
    });

    // Populate author details
    await comment.populate("author", "name email profilePicture");

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Error in createComment:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to create comment",
    });
  }
};

/**
 * Update comment (author only)
 * PUT /api/community/comments/:id
 */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content is required",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Content must not exceed 5000 characters",
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Comment not found",
      });
    }

    // Verify ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "AuthorizationError",
        message: "You are not authorized to update this comment",
      });
    }

    // Update comment
    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate("author", "name email profilePicture");

    res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Error in updateComment:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to update comment",
    });
  }
};

// Helper function to iteratively delete all child comments using DFS with stack
const cascadeDeleteComments = async (commentId) => {
  let deletedCount = 0;
  
  // Use a stack for iterative depth-first traversal
  const stack = [commentId];
  const toDelete = [];
  
  // Build list of all descendants using DFS
  while (stack.length > 0) {
    const currentId = stack.pop();
    toDelete.push(currentId);
    
    // Find all direct children
    const children = await Comment.find({ parentComment: currentId });
    
    // Add children to stack for processing
    for (const child of children) {
      stack.push(child._id);
    }
  }
  
  // Soft delete all descendants (excluding the parent which is in toDelete[0])
  for (let i = toDelete.length - 1; i > 0; i--) {
    const comment = await Comment.findById(toDelete[i]);
    if (comment) {
      await comment.softDelete();
      deletedCount++;
    }
  }
  
  return deletedCount;
};

/**
 * Soft delete comment (author or admin only)
 * DELETE /api/community/comments/:id
 * 
 * Note: This only soft-deletes the target comment itself.
 * Nested replies are kept intact to preserve thread structure.
 * The deleted comment will show as '[deleted]' in the thread.
 */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Comment not found",
      });
    }

    // Verify ownership or admin role
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        error: "AuthorizationError",
        message: "You are not authorized to delete this comment",
      });
    }

    // Cascade delete all child comments first
    const totalDeleted = await cascadeDeleteComments(id);
    
    // Soft delete the parent comment (preserves data but marks as deleted)
    await comment.softDelete();

    res.status(200).json({
      success: true,
      message: `Comment and ${totalDeleted} replies deleted successfully`,
      totalDeleted: totalDeleted + 1,
    });
  } catch (error) {
    console.error("Error in deleteComment:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to delete comment",
    });
  }
};

/**
 * Toggle upvote or downvote on comment
 * POST /api/community/comments/:id/vote
 */
export const toggleCommentVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid vote type. Must be 'upvote' or 'downvote'",
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        error: "NotFoundError",
        message: "Comment not found",
      });
    }

    // Toggle vote using instance methods
    if (voteType === "upvote") {
      await comment.toggleUpvote(req.user._id);
    } else {
      await comment.toggleDownvote(req.user._id);
    }

    // Determine user's current vote status
    const hasUpvoted = comment.upvotes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    const hasDownvoted = comment.downvotes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      voteScore: comment.voteScore,
      upvotes: comment.upvotes.length,
      downvotes: comment.downvotes.length,
      userVote: hasUpvoted ? "upvote" : hasDownvoted ? "downvote" : null,
    });
  } catch (error) {
    console.error("Error in toggleCommentVote:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to toggle vote",
    });
  }
};
