const User = require('../models/User');

/**
 * 
 * @desc Follow a user
 * @route POST /api/follow
 * @access Protected
 */

const Icons = {
    follow: "bi bi-person-plus-fill text-success",
    like: "bi bi-heart-fill text-danger",
    comment: "bi bi-chat-fill text-primary"
}

const followUser = async (req, res) => {
    const userToFollowId = req.body.userToFollowId

    if (!userToFollowId) {
        return res.status(400).json({
            success: false,
            message: 'User to follow ID is required'
        })
    }

    const user = req.user;

    try {
        const [userToFollow, userWhoFollowed] = await Promise.all([
            User.findByIdAndUpdate(
                userToFollowId,
                { $addToSet: { followers: user._id } },
                { new: true, projection: { followers: 1 } }
            ),
            User.findByIdAndUpdate(
                user._id,
                { $addToSet: { following: userToFollowId } }
            )
        ]);

        // send a notificaiton to userToFollow
        
        await User.findByIdAndUpdate(
            userToFollowId,
            { $addToSet: { notifications: { 
                type: 'follow',
                icon: Icons.follow,
                title: `${user.fullName || user.username} started following you`,
                text: `${user.fullName || user.username} started following you`,
                originUser: user._id,
            } } }
        ).lean().exec();


        return res.status(200).json({
            success: true,
            data: {
                newFollowersCount: userToFollow.followers.length
            }
        })
        
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Server error while following user'
        })
    }

}
const unfollowUser = async (req, res) => {
    const userToUnFollowId = req.body.userToUnFollowId

    if (!userToUnFollowId) {
        return res.status(400).json({
            success: false,
            message: 'User to follow ID is required'
        })
    }

    const user = req.user;

    try {
        // const userToUnFollow = await User.findByIdAndUpdate(
        //     userToUnFollowId,
        //     { $pull: { followers: user._id } },
        //     { new: true, projection: { followers: 1 } },
        //   );
        
        // await User.findByIdAndUpdate(
        //     user._id,
        //     { $pull: { following: userToUnFollowId } },
        // );

        const [userToUnFollow, _] = await Promise.all([
            User.findByIdAndUpdate(
                userToUnFollowId,
                { $pull: { followers: user._id } },
                { new: true, projection: { followers: 1 } },
            ),
            User.findByIdAndUpdate(
                user._id,
                { $pull: { following: userToUnFollowId } },
            )
        ])

        return res.status(200).json({
            success: true,
            data: {
                newFollowersCount: userToUnFollow.followers.length
            }
        })
        
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Server error while following user'
        })
    }
}



module.exports = { followUser, unfollowUser }