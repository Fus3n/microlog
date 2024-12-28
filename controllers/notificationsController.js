const User = require('../models/User');



const getNotificationPage = (req, res) => {
    res.render('notifications', {
        title: 'Notifications - MicroLog',
        user: req.user // Pass the user object to the view
    });
}


module.exports = {
    getNotificationPage
}