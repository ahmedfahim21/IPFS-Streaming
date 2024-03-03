const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const { Video, addNewVideo } = require('./configVideo');
const ffmpeg = require('fluent-ffmpeg');

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
  if (req.session && req.session.user) {
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
    return res.status(400).send('No file uploaded.');
  }

  try {
    const timestampFolderPath = createTimestampFolder();

    const inputFilePath = req.file.path;
    const outputFileName = 'output';

    ffmpeg(inputFilePath)
      .addOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
      ])
      .output(path.join(timestampFolderPath, `${outputFileName}.m3u8`))
      .on('end', async () => {
        try {
          const folderCID = await pinata.pinFromFS(timestampFolderPath);

          const newVideo = await addNewVideo({
            videoName: req.body.vidName,
            uploaderEmail: req.session.user.email,
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
      })
      .on('error', (error) => {
        console.error('Error generating HLS files:', error);
        res.status(500).render("upload.ejs", { message: "Error generating HLS files." });
      })
      .run();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("upload.ejs", {
      message: "Error uploading video.",
    });
  }
});

module.exports = router;
