const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * 
 * @desc  User Registration
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {

        // Check if email or username already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email 
                    ? 'User with that email already exists' 
                    : 'Username already exists'
            });
        }

        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // token
        const token = jwt.sign(
            {id: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '30d'}
        )

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });


        res.status(201).json({ success: true })


    } catch (err) {
        console.error(err); 
        res.status(500).json({
            success: false,
            message: 'Server error while trying to create an account'
        })
    }
}

/**
 * 
 * @desc  User Login
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })
                        .select('password role _id');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // check password match

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        const token = jwt.sign(
            {id: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '30d'}
        )

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });


        res.status(200).json({
            success: true,
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error while trying to login user'
        })
    }
}

// @desc Logout User
// @route POST /api/auth/logout
// @access Private
const logoutUser = (req, res) => {
    // Clear the HTTP-only cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.redirect("/");
};


const getUserWithId = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -passwordResetToken -passwordResetExpires -passwordChangedAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false, 
            message: 'Server error while fetching user'
        });
    }
}

const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .select("-password -passwordResetToken -passwordResetExpires -passwordChangedAt");
        return user
    } catch (err) {
        return null
    }
}

const userExists = async (id) => {
    
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserWithId,
    verifyToken
}