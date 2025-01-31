require('dotenv').config();

const { v2: cloudinary } = require('cloudinary');

const { verifyToken } = require("./authController");
const { getPostWithId } = require('../utils/userUtils'); 

const Post = require('../models/Post');
const User = require('../models/User');
const sanitize = require('sanitize-html');

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
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const uploadToCloudinary = async (image) => {
                // Upload photo to folder post_image/post_id/post_id-filename
                const result = await cloudinary.uploader.upload(image.tempFilePath, {
                    folder: `post_images/${post._id}`,
                    public_id: `${post._id}-${image.name}`,
                });

                return result;  
            }

            if (Array.isArray(images)) {
                for (const image of images) {
                    /**
                     * @type {File}
                     * @description The current image being processed for upload.
                     */
                    if (!image.mimetype.startsWith('image/')) {
                        return res
                            .status(400)
                            .json({ success: false, error: 'post file type is not image' });
                    }
                    const result = await uploadToCloudinary(image);
                    uploadedImagesRes.push(result);
                    uploadedImages.push(result.secure_url);
                }
            } else {
                if (!images.mimetype.startsWith('image/')) {
                    return res
                        .status(400)
                        .json({ success: false, error: 'post file type is not image' });
                }
                const result = await uploadToCloudinary(images);
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
        for (const image of uploadedImagesRes) {
            cloudinary.uploader.destroy(image.public_id)
            .then(() => console.log("Image deleted successfully"))
            .catch((error) => console.error(error));
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

        

        res.render('post', {
            title: `${post.user.username} - MicroLog`,
            post,
            user,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).render('500', {
            title: '500 - Server Error'
        });
    }
};

const likePost = async (req, res) => {};

const commmentOnPost = async (req, res) => {};

module.exports = {
    createPost,
    getPostPage,
    likePost,
    commmentOnPost,
};
