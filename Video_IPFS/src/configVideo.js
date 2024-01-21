const mongoose = require("mongoose");
const connect = mongoose.connect(
  // "mongodb+srv://user:user@cluster0.zrmkzsh.mongodb.net/"
  "mongodb://localhost:27017"
);

connect
  .then(() => {
    console.log("Video Database connected successfully.");
  })
  .catch(() => {
    console.log("Video Database cannot be connected successfully.");
  });

const videoSchema = new mongoose.Schema({
  videoName: { type: String, required: true },
  uploaderEmail: { type: String, required: true },
  dateOfUpload: { type: Date, required: true },
  views: { type: Number, required: true },
  ipfsCID: { type: String, required: true },
});

const Video = mongoose.model("Video", videoSchema);

const addNewVideo = async (details) => {
  try {
    const newVideo = new Video({
      videoName: details.videoName,
      uploaderEmail: details.uploaderEmail,
      dateOfUpload: new Date(),
      views: 0, // Setting views to 0 for a new video
      ipfsCID: details.ipfsCID,
    });

    await newVideo.save();
    return newVideo; // Returning the new video object if needed
  } catch (error) {
    console.error("Error adding new video:", error);
    throw error;
  }
};

module.exports = { Video, addNewVideo };
