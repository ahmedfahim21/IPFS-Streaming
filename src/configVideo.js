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
  uploaderID: { type: String, required: true },
  uploaderName: { type: String, required: true },
  dateOfUpload: { type: Date, required: true },
  views: { type: Number, required: true },
  ipfsCID: { type: String, required: true },
});

const Video = mongoose.model("Videos", videoSchema);

const addNewVideo = async (details) => {
  try {
    const newVideo = new Video({
      videoName: details.videoName,
      uploaderID: details.uploaderID,
      uploaderName: details.uploaderName,
      dateOfUpload: new Date(),
      views: 0,
      ipfsCID: details.ipfsCID,
    });

    await newVideo.save();
    return newVideo;
  } catch (error) {
    console.error("Error adding new video:", error);
    throw error;
  }
};

const vidWatch = async (_id) => {
  try {
    const video = await Video.findById(_id);

    video.views += 1;

    await video.save();
    return video;
  } catch (error) {
    console.error("Error updating video views:", error);
    throw error;
  }
};

module.exports = { Video, addNewVideo, vidWatch };