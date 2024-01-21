const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const { Video, addNewVideo } = require("./configVideo");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
// router.use(express.static("public"));
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlYWU0MzJjZi1kYmEyLTRiZjAtODJjMS0yNDIyOTlkOTNlZjciLCJlbWFpbCI6Im5hbmRhbjU1cmFtZXNoQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIyYTk0Yzk4NzUwNDBkZDU4MDhmMiIsInNjb3BlZEtleVNlY3JldCI6IjFhZGIxZjc1OTg0ZGIyYzU5Nzk4NWMxNWIyYTVjYTNiNTM4YjBkN2NiNGRmMzc3ODQ2ZTNkYzZhZGMwYmIxYWYiLCJpYXQiOjE3MDQ1NTM4Mjh9.IswS8JnFwGqgc9bo2b0Rs228cH8R6_vnB6aSGsxezRc";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./videos");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/upload", isAuthenticated, async (req, res) => {
  res.render("upload.ejs", { message: "Kindly upload the file." });
});

router.use("/upload", express.static("videos"));

router.post(
  "/upload",
  isAuthenticated,
  upload.single("video"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const inputPath = req.file.path;
    console.log(inputPath);

    try {
      // Your existing code to count documents in the Video collection
      const videoCount = await Video.countDocuments();

      const outputName = `output-${req.body.vidName}`;
      const outputPath = `./videos/${outputName}.m3u8`;

      ffmpeg(inputPath, { timeout: 432000 })
        .addOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 10",
          "-hls_list_size 0",
          "-f hls",
        ])
        .output(outputPath)
        .on("end", async () => {
          console.log("Conversion finished");

          // Uploading .m3u8 file to IPFS using Pinata
          const formData = new FormData();
          formData.append("file", fs.createReadStream(outputPath));

          const pinataMetadata = JSON.stringify({
            name: outputName,
          });
          formData.append("pinataMetadata", pinataMetadata);

          const pinataOptions = JSON.stringify({
            cidVersion: 0,
          });
          formData.append("pinataOptions", pinataOptions);

          try {
            const pinataResponse = await axios.post(
              "https://api.pinata.cloud/pinning/pinFileToIPFS",
              formData,
              {
                maxBodyLength: "Infinity",
                headers: {
                  "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
                  Authorization: `Bearer ${JWT}`,
                },
              }
            );

            const ipfsCID = pinataResponse.data.IpfsHash;

            // Upload associated .ts files to IPFS and create a mapping
            const tsFilesPaths = fs
              .readdirSync("./videos")
              .filter(
                (file) => file.startsWith(outputName) && file.endsWith(".ts")
              );
            const tsFilesMapping = {};

            for (const tsFile of tsFilesPaths) {
              const tsPath = `./videos/${tsFile}`;
              const tsFormData = new FormData();
              tsFormData.append("file", fs.createReadStream(tsPath));

              const tsPinataMetadata = JSON.stringify({
                name: tsFile,
              });
              tsFormData.append("pinataMetadata", tsPinataMetadata);

              const tsPinataOptions = JSON.stringify({
                cidVersion: 0,
              });
              tsFormData.append("pinataOptions", tsPinataOptions);

              const tsPinataResponse = await axios.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                tsFormData,
                {
                  maxBodyLength: "Infinity",
                  headers: {
                    "Content-Type": `multipart/form-data; boundary=${tsFormData._boundary}`,
                    Authorization: `Bearer ${JWT}`,
                  },
                }
              );

              const tsIpfsCID = tsPinataResponse.data.IpfsHash;
              tsFilesMapping[tsFile] = tsIpfsCID;
            }

            // Create JSON object with .m3u8 and ts file mappings
            const filesMapping = {
              [`${outputName}.m3u8`]: ipfsCID,
              ...tsFilesMapping,
            };

            // Convert the object to JSON string and upload it to IPFS
            const jsonFormData = new FormData();
            jsonFormData.append(
              "file",
              Buffer.from(JSON.stringify(filesMapping)),
              {
                filename: "filesMapping.json",
                contentType: "application/json",
              }
            );

            const jsonPinataResponse = await axios.post(
              "https://api.pinata.cloud/pinning/pinFileToIPFS",
              jsonFormData,
              {
                maxBodyLength: "Infinity",
                headers: {
                  "Content-Type": `multipart/form-data; boundary=${jsonFormData._boundary}`,
                  Authorization: `Bearer ${JWT}`,
                },
              }
            );

            const jsonIpfsCID = jsonPinataResponse.data.IpfsHash;

            const newVideo = await addNewVideo({
              videoName: req.body.vidName,
              uploaderEmail: req.session.user.email,
              ipfsCID: jsonIpfsCID,
            });
            await newVideo.save();

            fs.unlinkSync(outputPath);

            for (const tsFile of tsFilesPaths) {
              const tsPath = `./videos/${tsFile}`;
              fs.unlinkSync(tsPath);
            }

            res.status(200).render("upload.ejs", {
              message: `${req.body.vidName} uploaded successfully.`,
            });
          } catch (error) {
            console.error("Error uploading files to IPFS:", error);
            res.status(500).render("upload.ejs", {
              message: "Error uploading video.",
            });
          }
        })
        .on("error", (err) => {
          console.error("Error converting video:", err);
          res.status(500).render("upload.ejs", {
            message: "Error converting video.",
          });
        })
        .run();
    } catch (error) {
      console.error("Error:", error);
      res.status(500).render("upload.ejs", {
        message: "Error uploading video.",
      });
    }
  }
);

module.exports = router;
