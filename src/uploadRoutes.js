const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const { addNewVideo } = require('./configVideo');
const collection = require("./configUsers");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const router = express.Router();
require('dotenv').config();
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

router.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './videos');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userid) {
    next();
  } else {
    res.redirect('/login');
  }
};

const createTimestampFolder = () => {
  const timestamp = Date.now();
  const videosDir = path.join(__dirname, '../videos');
  fs.mkdirSync(videosDir, { recursive: true });
  const folderPath = path.join(videosDir, timestamp.toString());
  fs.mkdirSync(folderPath);
  return folderPath;
};

router.get('/upload', isAuthenticated, async (req, res) => {
  res.render('upload.ejs', { message: 'Kindly upload the file.' });
});

router.use('/upload', express.static('videos'));

router.post('/upload', isAuthenticated, upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(500).render("upload.ejs", { message: "No file uploaded." });
  }

  try {
    const timestampFolderPath = createTimestampFolder();

    const inputFilePath = req.file.path;

    const resolutions = [
      { size: "640x360", output: "360_out.m3u8" },
      { size: "800x480", output: "480_out.m3u8" },
      { size: "1280x720", output: "720_out.m3u8" },
      { size: "1920x1080", output: "1080_out.m3u8" },
    ];

    const ffmpegPromises = resolutions.map(({ size, output }) => {
      return new Promise((resolve, reject) => {
        ffmpeg(inputFilePath, { timeout: 432000 })
          .addOptions([
            "-profile:v baseline",
            "-level 3.0",
            `-s ${size}`,
            "-start_number 0",
            "-hls_time 10",
            "-hls_list_size 0",
            "-f hls",
          ])
          .output(path.join(timestampFolderPath, `${output}`))
          .on("end", () => {
            console.log(`Processing ${size} completed`);
            resolve();
          })
          .on("error", (err) => {
            console.error(`Error processing ${size}:`, err);
            res.status(500).render("upload.ejs", { message: "Error processing the video." });
            reject(err);
          })
          .run();
      });
    });

    await Promise.all(ffmpegPromises);

    try {
      const folderCID = await pinata.pinFromFS(timestampFolderPath);
      const username = await collection.findById(req.session.userid);  

      const newVideo = await addNewVideo({
        videoName: req.body.vidName,
        uploaderID: req.session.userid,
        uploaderName: username.username,
        ipfsCID: folderCID.IpfsHash,
      });
      await newVideo.save();

      fs.rmSync(timestampFolderPath, { recursive: true });
      fs.unlinkSync(inputFilePath);

      console.log("Upload success.");

      res.status(200).render("upload.ejs", {
        message: `${req.body.vidName} uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error during Pinata upload:', error.message);
      res.status(500).render("upload.ejs", {
        message: "Error uploading video to Pinata."
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("upload.ejs", {
      message: "Error uploading video.",
    });
  }
});

module.exports = router;
