const Comment = require('../models/Comment');

// Fetch only top-level comments for a post (no replies)
const getTopLevelComments = async (postId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const comments = await Comment.find({
        post: postId,
        parentComment: null
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture')
    .lean();

    return comments;
};

// Recursively fetch all comments and their replies for a post
const getAllCommentsWithReplies = async (postId) => {
    // First get all comments for the post
    const allComments = await Comment.find({ post: postId })
        .populate('user', 'username profilePicture')
        .sort({ createdAt: 1 }) // Sort by oldest first for proper threading
        .lean();

    // Create a map of comments by their ID for easy lookup
    const commentMap = new Map();
    const topLevelComments = [];

    // First pass: create the map and identify top-level comments
    allComments.forEach(comment => {
        commentMap.set(comment._id.toString(), { ...comment, replies: [] });
        if (!comment.parentComment) {
            topLevelComments.push(commentMap.get(comment._id.toString()));
        }
    });

    // Second pass: build the reply tree
    allComments.forEach(comment => {
        if (comment.parentComment) {
            const parentComment = commentMap.get(comment.parentComment.toString());
            if (parentComment) {
                parentComment.replies.push(commentMap.get(comment._id.toString()));
            }
        }
    });

    return topLevelComments;
};

// Get a specific comment thread (comment + all its replies)
const getCommentThread = async (commentId) => {
    const comment = await Comment.findById(commentId)
        .populate('user', 'username profilePicture')
        .lean();

    if (!comment) return null;

    const replies = await Comment.find({ parentComment: commentId })
        .populate('user', 'username profilePicture')
        .sort({ createdAt: 1 })
        .lean();

    return {
        ...comment,
        replies
    };
};

module.exports = {
    getTopLevelComments,
    getAllCommentsWithReplies,
    getCommentThread
}; 