const { verifyToken } = require("./authController");


const getLoginPage = async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        const user = await verifyToken(token);
        if (user) {
            return res.redirect('/feed');
        }
    }
    

    res.render('login', {
        title: 'Login - MicroLog'
    });
}

const getRegisterPage = async (req, res) => {
    const token = req.cookies.token;

    if (token) {
        const user = await verifyToken(token);
        if (user) {
            return res.redirect('/feed');
        }
    }

    res.render('register', {
        title: 'Sign Up - MicroLog'
    });
}

module.exports = { getLoginPage, getRegisterPage }