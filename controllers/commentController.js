const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');

const { uploadToCloudinary, deleteFromCloudinary, FOLDERS } = require('../utils/cloudinaryUtils');


const { getTopLevelComments, getAllCommentsWithReplies, getCommentThread } = require('../utils/commentUtils');

const Icons = {
    follow: "bi bi-person-plus-fill text-success",
    like: "bi bi-heart-fill text-danger",
    comment: "bi bi-chat-fill text-primary"
};


/**
 * 
 * @desc Create a comment
 * @route POST /api/comment
 * @access Private
 */
const createComment = async (req, res) => {
    try {
        const { postId, parentCommentId, text } = req.body;
        const user = req.user;

        if (!postId || !text) {
            return res.status(400).json({
                success: false,
                message: 'Post ID and comment text are required'
            });
        }

        // Create the comment object
        const commentData = {
            user: user._id,
            post: postId,
            text,
        };

        // If it's a reply, add the parent comment reference
        if (parentCommentId) {
            commentData.parentComment = parentCommentId;
        }

        // Create the comment
        const newComment = await Comment.create(commentData);

        // Populate user information for the response
        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'username profilePicture')
            .lean();

        // Upload images
        let uploadedImagesRes = [] // keep track of the upload, in case something fails, delete the images

        try {
            if (req.files && Object.keys(req.files).length !== 0) {
                // get file
                const uploadedImages = [];           
    
                const { images } = req.files;

                if (Array.isArray(images)) {
                    for (const image of images) {
                        if (!image.mimetype.startsWith('image/')) {
                            return res
                                .status(400)
                                .json({ success: false, error: 'post file type is not image' });
                        }
                        const result = await uploadToCloudinary(FOLDERS.COMMENT_IMAGE, newComment._id, image);
                        uploadedImagesRes.push(result);
                        uploadedImages.push(result.secure_url);
                    }
                } else {
                    if (!images.mimetype.startsWith('image/')) {
                        return res
                            .status(400)
                            .json({ success: false, error: 'post file type is not image' });
                    }
                    const result = await uploadToCloudinary(FOLDERS.COMMENT_IMAGE, newComment._id, images);
                    uploadedImagesRes.push(result);
                    uploadedImages.push(result.secure_url);
                }

                newComment.images = uploadedImages;
                await newComment.save();
            }
    
        } catch (err) {
            console.error(err);
            try {
                deleteFromCloudinary(uploadedImagesRes);
            } catch (err) {
                console.error(err);
            }
            return res.status(500).json({
                success: false,
                message: 'Server error while creating comment',
            });
        }


        // Update post comments count
        await Post.findByIdAndUpdate(postId, {
            $inc: { commentsCount: 1 }
        });

        // If it's a reply, update the parent comment's replies count
        if (parentCommentId) {
            await Comment.findByIdAndUpdate(parentCommentId, {
                $inc: { repliesCount: 1 }
            });

            // Get the parent comment's author to send notification
            const parentComment = await Comment.findById(parentCommentId).populate('user', 'username');
            
            // Send notification to the parent comment author (if it's not the same user)
            if (parentComment && parentComment.user._id.toString() !== user._id.toString()) {
                await notifyUserParentComment(parentComment, user, text, postId, newComment._id);
            }
        } else {
            // It's a top-level comment, notify the post author
            await notifuUserPostAuthor(postId, user, text, newComment._id);
        }

        return res.status(201).json({
            success: true
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating comment'
        });
    }
};

/**
 * 
 * @desc Get comments for a post
 * @route GET /api/comments/:postId
 * @access Public
 */
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10, threaded = false } = req.query;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message: 'Post ID is required'
            });
        }

        let comments;
        if (threaded === 'true') {
            // Get all comments with their replies in a threaded structure
            comments = await getAllCommentsWithReplies(postId);
        } else {
            // Get only top-level comments with pagination
            comments = await getTopLevelComments(postId, parseInt(page), parseInt(limit));
        }

        return res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching comments'
        });
    }
};

/**
 * 
 * @desc Get a specific comment thread
 * @route GET /api/comments/thread/:commentId
 * @access Public
 */
const getCommentWithReplies = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: 'Comment ID is required'
            });
        }

        const commentThread = await getCommentThread(commentId);

        if (!commentThread) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: commentThread
        });
    } catch (error) {
        console.error('Error fetching comment thread:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching comment thread'
        });
    }
};

/**
 * 
 * @desc Delete a comment
 * @route DELETE /api/comments/:commentId
 * @access Private
 */
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const user = req.user;

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: 'Comment ID is required'
            });
        }

        // Find the comment
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if the user is the author of the comment
        if (comment.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);

        // Update post comments count
        await Post.findByIdAndUpdate(comment.post, {
            $inc: { commentsCount: -1 }
        });

        // If it's a reply, update the parent comment's replies count
        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $inc: { repliesCount: -1 }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Comment deleted.'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting comment'
        });
    }
};

/**
 * 
 * @desc Update a comment
 * @route PUT /api/comments/:commentId
 * @access Private
 */
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text, images } = req.body;
        const user = req.user;

        if (!commentId || !text) {
            return res.status(400).json({
                success: false,
                message: 'Comment ID and text are required'
            });
        }

        // Find the comment
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if the user is the author of the comment
        if (comment.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this comment'
            });
        }

        // Update the comment
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { 
                text, 
                images: images || comment.images,
                isEdited: true 
            },
            { new: true }
        ).populate('user', 'username profilePicture').lean();

        return res.status(200).json({
            success: true,
            data: updatedComment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating comment'
        });
    }
};

module.exports = {
    createComment,
    getPostComments,
    getCommentWithReplies,
    deleteComment,
    updateComment
};

async function notifuUserPostAuthor(postId, user, text, commentId) {
    const post = await Post.findById(postId).populate('user', 'username');

    // Send notification to the post author (if it's not the same user)
    if (post && post.user._id.toString() !== user._id.toString()) {
        await User.findByIdAndUpdate(
            post.user._id,
            {
                $push: {
                    notifications: {
                        type: 'comment',
                        icon: Icons.comment,
                        title: `${user.fullName || user.username} commented on your post`,
                        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                        originUser: user._id,
                        originComment: commentId,
                        post: postId
                    }
                }
            }
        );
    }
}

async function notifyUserParentComment(parentComment, user, text, postId, commentId) {
    await User.findByIdAndUpdate(
        parentComment.user._id,
        {
            $push: {
                notifications: {
                    type: 'comment',
                    icon: Icons.comment,
                    title: `${user.fullName || user.username} replied to your comment`,
                    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                    originUser: user._id,
                    originComment: commentId,
                    post: postId
                }
            }
        }
    );
}

