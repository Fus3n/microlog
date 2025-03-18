const User = require('../models/User');

const getNotificationPage = (req, res) => {
    res.render('notifications', {
        title: 'Notifications - MicroLog',
        user: req.user, // Pass the user object to the view
        notificationsAllRead: req.notificationsAllRead
    });
}


const viewNotification = async (req, res) => {
    const notificationId = req.params.id;
    console.log(notificationId);

    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'notifications.originUser',
                select: 'username'
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const notification = user.notifications.id(notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await user.save();
        
        // decide where to redirect
        try {
            if (notification.type === 'follow') {
                return res.redirect(`/profile/${notification.originUser.username}`);
            } else if (notification.type === 'comment') {
                return res.redirect(`/comment/${notification.originComment._id}`);
            } else {
                return res.redirect(`/feed`);
            }
        } catch (err) {
            res.render('404', {
                title: '404 - Page Not Found',
                user: req.user,
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getNotificationPage,
    viewNotification
}