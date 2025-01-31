const { verifyToken } = require("../controllers/authController");
const Post = require("../models/Post");
const { getPosts } = require("../utils/userUtils");

/**
 * 
 * @desc  User Registration
 * @route POST /feed
 * @access Public
 */
const getFeed = async (req, res) => { 
    const token = req.cookies.token;
    let user;

    if (token) {
        user = await verifyToken(token);
    }

    // query all posts with user info
    const posts = await getPosts();

    res.render('feed', {
        title: 'Feed - MicroLog',
        user,
        posts,
    });
}

module.exports = { getFeed }