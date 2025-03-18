const jwt = require("jsonwebtoken");
const User = require("../models/User");


const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        // return res.status(401).json({ 
        //     success: false, 
        //     message: 'Not authorized' 
        // });

        return res.redirect('/?msg=' + encodeURIComponent('not-authorized'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id)
            .select("-password -passwordResetToken -passwordResetExpires -passwordChangedAt")
            .populate({
                path: 'notifications.originUser',
                select: 'username'
            })
            .then(user => {
                user.notifications.sort((a, b) => b.createdAt - a.createdAt);
                return user;
            });
        
        // Check if all notifications are read
        const allNotificationsRead = req.user.notifications.every(notification => notification.isRead);
        req.notificationsAllRead = allNotificationsRead;


        next();
    } catch (error) {
        console.error(error);
        return res.redirect('/');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
          return res.status(403).json({success: false, error: `User role ${req.user.role} is not authorized to access this route`})
      }
      next()
    };
};

module.exports = { protect, authorize };