require('dotenv').config();
const express = require('express');
const path = require('path');
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload')


const connectDB = require("./db")
const { registerUser, loginUser, logoutUser } = require("./controllers/authController");
const { getFeed } = require("./controllers/feedController");
const { getMe, profileEdit, updateProfile } = require("./controllers/selfProfileController");
const { getPublicProfile } = require("./controllers/publicProfileController");
const { getLanding } = require("./controllers/landingController");
const { getLoginPage, getRegisterPage } = require("./controllers/loginRegisterController")
const { createPost, getPostPage } = require("./controllers/postController")
const { followUser, unfollowUser } = require("./controllers/followController")
const { getNotificationPage } = require("./controllers/notificationsController")

const { protect } = require("./middleware/auth");


// Initialize Express app
const app = express();

// DB connection
connectDB();

// Live Reload Configuration
const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});

// Middleware
app.use(cookieParser());
app.use(connectLiveReload());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({useTempFiles: true})) // configure it

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Home page
app.get("/", getLanding);

// Authentication Routes
app.get("/login", getLoginPage);
app.get("/register", getRegisterPage);

app.get("/forgot-password", (req, res) => {
    res.render('forgot-password', {
        title: 'Reset Password - MicroLog'
    });
});

// Feed Routes
app.get("/feed", getFeed);

app.get("/explore", (req, res) => {
    // TODO: Fetch trending/popular posts from MongoDB
    res.json({ notImplementedyet: true });
});

// Profile Routes
app.get("/me", protect, getMe);
app.get("/notifications", protect, getNotificationPage)
app.get("/me/edit", protect, profileEdit);
app.put("/me/edit", protect, updateProfile);

// public profile
app.get("/profile/:username", getPublicProfile);

// API routes for Auth
app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);
app.get("/api/auth/logout", logoutUser);

// API routes for user follow
app.post("/api/follow", protect, followUser);
app.post("/api/unfollow", protect, unfollowUser);


// API Routes for Posts
app.post("/api/post", protect, createPost);
app.get("/post/:id", getPostPage);


// Error Handling Middleware
app.use((req, res, next) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', {
        title: '500 - Server Error'
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// module.exports = app