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

    if (token) {
        user = await verifyToken(token);
    }
    res.render('index', {
        title: 'MicroLog - Share Your Thoughts',
        user: user
    });
}

module.exports = { getLanding }