const User = require('../models/User');
const Post = require('../models/Post');


async function getUserWithUsername(username) {
    try {
        const user = await User.aggregate([
            {
                $match: { username: username }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    fullName: 1,
                    bio: 1,
                    profilePicture: 1,
                    location: 1,
                    language: 1,
                    dateOfBirth: 1,
                    isVerified: 1,
                    followersCount: { $size: "$followers" },
                    followingCount: { $size: "$following" },
                    notifications: 1,
                    createdAt: 1
                }
            }
        ]);

        if (user.length === 0) {
            return null;
        }

        return user[0];
    } catch (error) {
        console.error("Error fetching user with username:", username, "Error:", error);
        return null;
    }
}

/**
 *  @param {Object} config 
 *  @param {string} config.of_user The user id of the user whose posts are to be fetched
 * @returns {Promise<Post[]|null>}
 * 
 * @description Get all posts if user not passed
 * */
async function getPosts(config = {}) {
    if (config?.of_user) {
        const posts = await Post.find({ user: config.of_user })
            .populate('user', 'username profilePicture _id')
            .sort({ createdAt: -1 });

        return posts
    }

    const posts = await Post.find({})
        .populate('user', 'username profilePicture _id')
        .sort({ createdAt: -1 });
    return posts
}

async function getPostWithId(postId) {
    try {
        const post = await Post.findById(postId)
            .populate('user', 'username profilePicture _id');
        return post;
    } catch (error) {
        console.error("Error fetching post with id:", postId, "Error:", error);
        return null;
    }
}


module.exports = { 
    getUserWithUsername,
    getPosts,
    getPostWithId,
 };