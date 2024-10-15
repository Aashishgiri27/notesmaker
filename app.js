const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// ejs setup
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
// for form handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const datamodels = require("./models/datamodel");
const usermodels = require("./models/usermodel");
const usermodel = require("./models/usermodel");

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signup", async function (req, res) {
  const { username, email, password } = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await usermodels.create({
        username: username,
        email: email,
        password: hash,
      });

      let token = jwt.sign({ email }, "notepad");
      res.cookie("token", token);
      //   console.log(user)
      setTimeout(() => {
        res.redirect("/view");
      }, 2000);
    });
  });
});

app.post("/login", async function (req, res) {
  let user = await usermodels.findOne({ email: req.body.email });
  if (!user) res.send("something is wrong");
  bcrypt.compare(req?.body?.password, user?.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: user.email }, "notepad");
      res.cookie("token", token);
      res.redirect("/view");
    } else {
      res.redirect("/signup");
    }
  });
});

app.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/");
});

function checklogin(req, res, next) {
  // console.log(req.cookies.token);
  if (req.cookies.token == "") {
    res.redirect("/signup");
  } else {
    let data = jwt.verify(req.cookies.token, "notepad");
    req.user = data;
    next();
  }
}

app.get("/view", checklogin, async function (req, res) {
  let user = await usermodel
    .findOne({ email: req.user.email })
    .populate("file");

  // console.log(user);

  res.render("index", { user: user });
});

app.post("/create", checklogin, async function (req, res) {
  const user = await usermodel.findOne({ email: req.user.email });
  const { name, textarea } = req.body;
  let filecreated = await datamodels.create({
    user: user._id,
    name: name,
    data: textarea,
  });
  user.file.push(filecreated._id);
  await user.save();
  res.redirect("/view");
});

app.get("/read/:id", checklogin,async function (req, res) {
  let showdata = await datamodels.findOne({ _id: req.params.id });
  // console.log(showdata);
  res.render("read", { showdata: showdata });
});

app.get("/delete/:id",checklogin, async function (req, res) {
  // let deletedata= await datamodels.findOne({_id:req.params.id});
  await datamodels.findOneAndDelete({ _id: req.params.id });
  res.redirect("/view");
});

app.get("/edit/:id", checklogin,async function (req, res) {
  let editdata = await datamodels.findOne({ _id: req.params.id });
  // console.log(deletedata)
  res.render("update", { editdata: editdata });
});

app.post("/update/:id",checklogin, async function (req, res) {
  let { name, textarea } = req.body;
  let editdata = await datamodels.findOneAndUpdate(
    { _id: req.params.id },
    { name, data: textarea },
    { new: true }
  );
  // console.log(editdata);
  res.redirect("/view");
});

app.listen(8080, function () {
  console.log("running");
});
