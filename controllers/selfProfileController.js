require('dotenv').config();

const { v2: cloudinary } = require('cloudinary');
const User = require('../models/User');
const { getPosts } = require("../utils/userUtils");
const sanitize = require('sanitize-html');

/**
 *
 * @desc  User profile
 * @route POST /profile
 * @access Protected/Public
 */
const getMe = async (req, res) => {
    const posts = await getPosts({ of_user: req.user._id});

    res.render('me', {
        title: `${req.user.username} - MicroLog`,
        user: req.user,
        posts
    });
};

/**
 *
 * @desc  User profile edit
 * @route POST /me/edit
 * @access Protected
 */
const profileEdit = async (req, res) => {
    res.render('profile_edit', {
        title: `${req.user.username} - MicroLog`,
        user: req.user,
    });
};

// API endpoints for updating profile information
const updateProfile = async (req, res) => {
    try {
        const updates = {};

        // Only include non-empty values in the update
        if (req.body.fullName?.trim()) updates.fullName = sanitize(req.body.fullName.trim());
        if (req.body.bio?.trim()) updates.bio = sanitize(req.body.bio.trim());
        if (req.body.location?.trim()) updates.location = sanitize(req.body.location.trim());
        if (req.body.dateOfBirth) updates.dateOfBirth = sanitize(req.body.dateOfBirth);

        if (req.body.profileVisibility)
            updates['privacySettings.profileVisibility'] = req.body.profileVisibility;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Handle profile picture upload if included
        if (req.files && Object.keys(req.files).length !== 0) {
            // get file
            const { profilePicture } = req.files;

            // make sure image type is image
            if (!profilePicture.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, error: 'file type is not image' });
            }
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            
            // Check if user already has a profile picture and delete it
            try {
                await cloudinary.uploader.destroy(`profile_pictures/${updatedUser._id}-profile`);
            } catch (error) {
                console.log('No existing profile picture found');
            }

            // Upload new profile picture
            const result = await cloudinary.uploader.upload(profilePicture.tempFilePath, {
                folder: 'profile_pictures',
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
                public_id: `${updatedUser._id}-profile`,
            });

            updatedUser.profilePicture = result.secure_url;
            await updatedUser.save();
        }

        res.status(200).json({
            success: true,
            data: updatedUser,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile',
        });
    }
};

module.exports = { getMe, profileEdit, updateProfile };
