const mongoose = require("mongoose");
const connect = mongoose.connect(
  "mongodb+srv://user:user@cluster0.uzems9o.mongodb.net/"
  // "mongodb://localhost:27017"
);

connect
  .then(() => {
    console.log("Users Database connected successfully.");
  })
  .catch(() => {
    console.log("Users Database cannot be connected successfully.");
  });

const loginSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const collection = new mongoose.model("users", loginSchema);

module.exports = collection;
