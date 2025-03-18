require('dotenv').config();

const { uploadToCloudinary, deleteFromCloudinary, FOLDERS } = require('../utils/cloudinaryUtils');

const { verifyToken } = require("./authController");
const { getPostWithId } = require('../utils/userUtils'); 

const Post = require('../models/Post');
const User = require('../models/User');
const sanitize = require('sanitize-html');

const { getTopLevelComments, getCommentThread } = require('../utils/commentUtils');


/**
 * Extracts hashtags from text content
 * @param {string} text - The text to extract hashtags from
 * @returns {string[]} Array of hashtags without the # symbol
 */
const extractHashtags = (text) => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const hashtags = text.match(/#[\w\d]+/g) || [];

    // Remove # symbol and return unique hashtags
    return [...new Set(hashtags.map((tag) => tag.slice(1)))];
};

const createPost = async (req, res) => {
    // the route is protected with middleware, so we have acesss to user with req.user
    /**
     * @type {User}
     */
    const user = req.user;

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'You must be logged in to create a post',
        });
    }

    const { content } = req.body;

    if (!content) {
        return res.status(400).json({
            success: false,
            message: 'Post content cannot be empty',
        });
    }

    // keep track of the upload, in case something fails, delete the images
    let uploadedImagesRes = []

    try {
        const tags = extractHashtags(content);
        const post = await Post.create({ text: sanitize(content), user: user._id, tags });

        // Handle profile picture upload if included

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
                    const result = await uploadToCloudinary(FOLDERS.POST_IMAGE, post._id, image);
                    uploadedImagesRes.push(result);
                    uploadedImages.push(result.secure_url);
                }
            } else {
                if (!images.mimetype.startsWith('image/')) {
                    return res
                        .status(400)
                        .json({ success: false, error: 'post file type is not image' });
                }
                const result = await uploadToCloudinary(FOLDERS.POST_IMAGE, post._id, images);
                uploadedImagesRes.push(result);
                uploadedImages.push(result.secure_url);
            }

            post.images = uploadedImages;
            await post.save();
        }

        res.status(201).json({
            success: true,
            data: post,
        });
    } catch (err) {
        console.error(err);
        try {
            deleteFromCloudinary(uploadedImagesRes);
        } catch (err) {
            console.error(err);
        }
        res.status(500).json({
            success: false,
            message: 'Server error while creating post',
        });
    }
};

const getPostPage = async (req, res) => {
    const postId = req.params.id;

    if (!postId) {
        return res.status(404).render('404', {
            title: '404 - Page Not Found'
        });
    }

    try {
        // get post of user  
        const post = await getPostWithId(postId)    
        if (!post) {
            return res.status(404).render('404', {
                title: '404 - Page Not Found'
            });
        }   

        const token = req.cookies.token;
        let user;

        if (token) {
            user = await verifyToken(token);
        }

        const comments = await getTopLevelComments(postId);

        const viewedPosts = req.cookies.viewedPosts || {};
        const hasViewed = viewedPosts[postId];

        if (!hasViewed) {
            post.views += 1;
            await post.save();

            // Set/update the cookie
            viewedPosts[postId] = true; // mark this post as viewed
            res.cookie('viewedPosts', viewedPosts, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // Expires in 30 days 
                httpOnly: true,
            });
        }

        res.render('post', {
            title: `${post.user.username} - MicroLog`,
            post,
            user,
            comments
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).render('500', {
            title: '500 - Server Error'
        });
    }
};

const getPostCommentThread = async (req, res) => {
    try {
        const commentId = req.params.commentId;

        if (!commentId) {
            return res.status(400).json({
                success: false,
                message: 'Post ID and Comment ID are required'
            });
        }

        const commentThread = await getCommentThread(commentId);
        commentThread.post = await Post.findById(commentThread.post)
            .populate('user', 'username profilePicture')
            .lean();

        if (!commentThread) {
            return res.status(404).json({
                success: false,
                message: 'Comment thread not found'
            });
        }
        const token = req.cookies.token;
        let user;

        if (token) {
            user = await verifyToken(token);
        }

        const commentText = commentThread.text.length > 30 ? commentThread.text.substring(0, 27) + '...' : commentThread.text;

        res.render('comment', {
            title: `${commentText ?? 'Comment'} - MicroLog`,
            comment: commentThread,
            post: commentThread.post,
            user,
        });

    } catch (error) {
        console.error('Error fetching comment thread:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const likePost = async (req, res) => {};

module.exports = {
    createPost,
    getPostPage,
    likePost,
    getPostCommentThread
};
