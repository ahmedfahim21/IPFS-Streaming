const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const collection = require("./configUsers");
const fs = require("fs");
const hls = require("hls-server");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: false,
  })
);

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await collection.findOne({ _id: req.session.user.id });
    if (user) {
      res.render("home.ejs", { username: user.username });
    } else {
      res.send("User not found.");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { error: null, mailid: null });
});

app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email });
    if (!check) {
      res.render("login.ejs", { error: "Username not found.", mailid: null });
    } else {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );
      if (!passwordMatch) {
        res.render("login.ejs", {
          error: "Incorrect Password.",
          mailid: req.body.email,
        });
      } else {
        req.session.user = {
          id: check.id,
          email: req.body.email,
        };
        res.redirect("/");
      }
    }
  } catch (error) {
    res.status(200).send(error);
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      res.redirect("/login");
    }
  });
});

const port = 5000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

const registerRoutes = require("./registerRoutes");
app.use("/", registerRoutes);

const uploadRoutes = require("./uploadRoutes");
app.use("/", uploadRoutes);

const videoRoutes = require("./videoRoutes");
app.use("/", videoRoutes(server));
