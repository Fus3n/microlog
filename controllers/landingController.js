const { verifyToken } = require("./authController");

/**
 * 
 * @desc  Landing page
 * @route POST /
 * @access Public
 */
const getLanding = async (req, res) => { 
    const token = req.cookies.token;
    let user;
    let message = null;

    if (req.query.msg === 'not-authorized') {
        message = 'Not authorized. Please log in to continue.';
    }

    if (token) {
        user = await verifyToken(token);
    }
    res.render('index', {
        title: 'MicroLog - Share Your Thoughts',
        user: user,
        message: message
    });
}

module.exports = { getLanding }