const express = require("express");
const bcrypt = require("bcrypt");
const collection = require("./configUsers");

const router = express.Router();

router.get("/register", async (req, res) => {
  if (req.session && req.session.userid) {
    res.redirect("/")
  } else {
    res.render("register.ejs", { error: null });
  }
});

router.post("/register", async (req, res) => {
  const data = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };
  try {
    const existingUsrNm = await collection.findOne({ username: data.username });
    const existingEmail = await collection.findOne({ email: data.email });
    if (existingUsrNm) {
      res.render("register.ejs", { error: "Username already exists." });
    } else if (existingEmail) {
      res.render("register.ejs", { error: "Email already exists." });
    } else {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
      const userData = await collection.insertMany(data);
      res.redirect("/login");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
