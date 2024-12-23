const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
        },
        images: {
            type: [String],
            default: [],
        },
        title: {
            type: String,
        },
        tags: {
            type: [String],
            default: [],
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        views: {
            type: Number,
            default: 0,
        },
        visibility: {
            type: String,
            enum: ['public', 'followers', 'private'],
            default: 'public',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
