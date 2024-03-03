const express = require("express");
const hls = require("hls-server");
const path = require("path");
const { Video, vidWatch } = require("./configVideo");
const axios = require("axios");
const fs = require("fs");

const router = express.Router();

module.exports = function (server) {
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
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

  router.get("/videos", isAuthenticated, async (req, res) => {
    try {
      const allVideos = await Video.find({});

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
            return cb(null, true); // Allow other requests to pass through
          }
          try {
            const pinataResponse = await axios.head(
              `https://gateway.pinata.cloud/ipfs/${folderCID}/${req.url}`
            );
            cb(null, pinataResponse.status === 200); // Respond based on file existence
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

            cb(null, pinataResponse.data); // Pass the stream directly
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
