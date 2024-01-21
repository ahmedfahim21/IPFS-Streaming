const express = require("express");
const hls = require("hls-server");
const path = require("path");
const { Video } = require("./configVideo");
const axios = require("axios");
const fs = require("fs");

const router = express.Router();
router.use(express.static("videos"));

let filesMapping; // Declare filesMapping as a global variable

module.exports = function (server) {
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  };

  router.get("/videos/:videoName", isAuthenticated, async (req, res) => {
    const { videoName } = req.params;

    try {
      const selectedVideo = await Video.findOne({ videoName });

      const jsonIpfsCID = selectedVideo.ipfsCID;

      const jsonPinataResponse = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${jsonIpfsCID}`
      );

      filesMapping = jsonPinataResponse.data;

      res.render("videoViewer", {
        filesMap: JSON.stringify(filesMapping),
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

  const setupHLSServer = () => {
    const downloadsFolder = path.join(__dirname, "..", "downloads");

    // Ensure the downloads folder exists
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder);
    }

    return {
      provider: {
        exists: async (req, cb) => {
          const ext = req.url.split(".").pop();
          if (ext !== "m3u8" && ext !== "ts") {
            return cb(null, true); // Allow other requests to pass through
          }

          const filename = path.basename(req.url, path.extname(req.url)); // Extract filename without extension
          const ipfsCID = filesMapping[filename + "." + ext]; // Get the CID for the requested file

          try {
            const pinataResponse = await axios.head(
              `https://gateway.pinata.cloud/ipfs/${ipfsCID}`
            );
            cb(null, pinataResponse.status === 200); // Respond based on CID existence
          } catch (error) {
            cb(null, false);
          }
        },
        getManifestStream: async (req, cb) => {
          const ext = req.url.split(".").pop();
          if (ext === "m3u8") {
            const filename = path.basename(req.url, ".m3u8");
            const ipfsCID = filesMapping[filename + ".m3u8"];
            const localFilePath = path.join(
              downloadsFolder,
              filename + ".m3u8"
            );

            try {
              const pinataResponse = await axios.get(
                `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
                { responseType: "stream" }
              );

              // Save the manifest file to the downloads folder
              const stream = pinataResponse.data.pipe(
                fs.createWriteStream(localFilePath)
              );
              stream.on("finish", () => {
                cb(null, fs.createReadStream(localFilePath));
              });
            } catch (error) {
              console.error("Error getting manifest stream:", error);
              cb(null, false);
            }
          }
        },

        getSegmentStream: async (req, cb) => {
          const ext = req.url.split(".").pop();
          if (ext === "ts") {
            const filename = path.basename(req.url, ".ts");
            const ipfsCID = filesMapping[filename + ".ts"];
            const localFilePath = path.join(downloadsFolder, filename + ".ts");

            try {
              const pinataResponse = await axios.get(
                `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
                { responseType: "arraybuffer" }
              );

              // Save the segment file to the downloads folder
              fs.writeFileSync(localFilePath, Buffer.from(pinataResponse.data));

              // Return the buffer for the segment stream
              cb(null, fs.createReadStream(localFilePath));
            } catch (error) {
              console.error("Error getting segment stream:", error);
              cb(null, false);
            }
          }
        },
      },
    };
  };

  const hlsServerConfig = setupHLSServer();
  new hls(server, hlsServerConfig);

  return router;
};
