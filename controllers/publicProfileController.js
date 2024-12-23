const User = require('../models/User');
const Post = require('../models/Post');
const { verifyToken } = require("../controllers/authController");
const { getUserWithUsername, getPosts } = require("../utils/userUtils");
const sanitize = require('sanitize-html');


const getPublicProfile = async (req, res) => {
    const username = req.params.username;
    if (!username) {
        return res.status(404).render('404', {
            title: '404 - Page Not Found'
        });
    }

    const viewingUser = await getUserWithUsername(username);

    if (!viewingUser) {
        return res.status(404).render('404', {
            title: '404 - Page Not Found'
        });
    }

    const token = req.cookies.token;
    let user = null;

    if (token) {
        user = await verifyToken(token);
        if (user && user._id.toString() === viewingUser._id.toString()) {
            return res.redirect('/me');
        }
    }

    // fetch all posts for this user
    const posts = await getPosts({ of_user: viewingUser._id});


    let isFollowing = false;
    if (user) {
        const viewingUserData = await User.findOne({ username: username }).select('followers');
        if (viewingUserData) {
             isFollowing = viewingUserData.followers.includes(user._id);
             user.isFollowing = isFollowing
        }
    }

    res.render('profile', {
        title: `${req.params.username} - MicroLog`,
        viewingUser,
        user,
        posts,
        sanitize,
        isFollowing
    });
}


module.exports = {
    getPublicProfile
}