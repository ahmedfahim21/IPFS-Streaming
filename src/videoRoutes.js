const express = require("express");
const hls = require("hls-server");
const { Video, vidWatch } = require("./configVideo");
const axios = require("axios");

const router = express.Router();

module.exports = function (server) {
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userid) {
      next();
    } else {
      res.redirect("/login");
    }
  };

  router.get("/videos/:videoID", isAuthenticated, async (req, res) => {
    const { videoID } = req.params;

    await vidWatch(videoID);

    try {
      const selectedVideo = await Video.findById(videoID);

      const folderCID = selectedVideo.ipfsCID;

      res.render("videoViewer", {
        folderCID: folderCID,
        vidName: selectedVideo.videoName,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

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

  router.get("/videos", isAuthenticated, async (req, res) => {
    try {
      let allVideos = await Video.find({});

      allVideos = allVideos.map(video => video.toObject());

      allVideos.forEach(video => {
        video.dateOfUpload = getTimeDifference(video.dateOfUpload);
      });

      res.render("videos", { videos: allVideos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const setupHLSServer = (folderCID) => {
    return {
      provider: {
        exists: async (req, cb) => {
          const ext = req.url.split(".").pop();
          if (ext !== "m3u8" && ext !== "ts") {
            return cb(null, true);
          }
          try {
            const pinataResponse = await axios.head(
              `https://gateway.pinata.cloud/ipfs/${folderCID}/${req.url}`
            );
            cb(null, pinataResponse.status === 200);
          } catch (error) {
            cb(null, false);
          }
        },
        getStream: async (req, cb) => {
          try {
            const pinataResponse = await axios.get(
              `https://gateway.pinata.cloud/ipfs/${folderCID}/${req.url}`,
              { responseType: "stream" }
            );

            cb(null, pinataResponse.data);
          } catch (error) {
            console.error("Error getting stream:", error);
            cb(null, false);
          }
        },
      },
    };
  };

  router.use("/hls", async (req, res, next) => {
    const { folderCID } = req.query;

    if (!folderCID) {
      return res.status(400).json({ error: "Missing folderCID parameter." });
    }

    const hlsServerConfig = setupHLSServer(folderCID);
    new hls(server, hlsServerConfig);

    next();
  });

  return router;
};
