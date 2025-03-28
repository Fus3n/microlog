const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 250,
    },
    profilePicture: {
      type: String,
    },
    location: {
        type: String,
    },
    language: {
      type: String,
      default: 'en',
    },
    dateOfBirth: {
      type: Date
    },
    notifications: [{
      icon: { type: String }, // icon name or url
      title: { type: String },
      text: { type: String, required: true },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      type: { 
        type: String, 
        enum: ['like', 'comment', 'follow', 'other', 'system']
      },
      originUser: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true
      }, // The user the post was triggered by, if none then current user is the origin
      originPost: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
      }, // The post the notification was triggered by
      originComment: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment'
      }, // If notification is about a specific comment
    }],
    notificationSettings: {
      like: {type: Boolean, default: true},
      comment: {type: Boolean, default: true},
      follow: {type: Boolean, default: true},
      other: {type: Boolean, default: true},
    },
    privacySettings: {
      profileVisibility: {type: String, enum: ['public', 'followers', 'private'], default: 'public'},
      postVisibility: {type: String, enum: ['public', 'followers', 'private'], default: 'public'}
    },
    lastLogin: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    isUnderReiview: {
      type: Boolean,
      default: false
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    bannedReason: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }],
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('User', userSchema);