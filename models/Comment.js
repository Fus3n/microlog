const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        text: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        repliesCount: {
            type: Number,
            default: 0,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        visibility: {
            type: String,
            enum: ['public', 'followers', 'private'],
            default: 'public',
        },
    },
    { timestamps: true }
);

// Index for efficient querying
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema); 