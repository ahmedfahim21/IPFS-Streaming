const express = require("express");
const collection = require("./configUsers");
const { Video } = require("./configVideo");

const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userid) {
        next();
    } else {
        res.redirect("/login");
    }
};


function getTimeDifference(dateOfUpload) {
    if (!(dateOfUpload instanceof Date)) {
        dateOfUpload = new Date(dateOfUpload);
    }
    var currentTime = new Date();
    var timeDifference = currentTime - dateOfUpload;
    var seconds = Math.floor(timeDifference / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var months = Math.floor(days / 30);
    if (months >= 12) {
        return Math.floor(months / 12) + " year" + (Math.floor(months / 12) > 1 ? "s" : "") + " ago";
    } else if (days >= 30) {
        return months + " month" + (months > 1 ? "s" : "") + " ago";
    } else if (hours >= 24) {
        return days + " day" + (days > 1 ? "s" : "") + " ago";
    } else if (minutes >= 60) {
        return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
    } else if (minutes >= 1) {
        return minutes + " minute" + (minutes > 1 ? "s" : "") + " ago";
    } else {
        return "Just now";
    }
}

router.get("/profile", isAuthenticated, async (req, res) => {
    let allVideos = await Video.find({ uploaderID: req.session.userid });
    allVideos = allVideos.map(video => video.toObject());
    allVideos.forEach(video => {
        video.dateOfUpload = getTimeDifference(video.dateOfUpload);
    });
    const userDetails = await collection.findById(req.session.userid);
    res.render("profile.ejs", { username: userDetails.username, email: userDetails.email, videos: allVideos });
});

module.exports = router;
