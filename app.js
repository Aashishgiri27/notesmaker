const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// saurabh sharma;
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
// for form handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const multer = require("multer");
const crypto = require("crypto");
const datamodels = require("./models/datamodel");
const usermodel = require("./models/usermodel");



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, bytes) {
      const fn = bytes.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    });
  },
});

const upload = multer({ storage: storage });


app.get("/admin", async (req, res) => {
  const user=await usermodel.find({})
  // console.log(user)
   res.render("admin",{data:user})

});

app.get("/data/:id",async(req,res)=>{
  
  const userdata= await usermodel.findOne({_id:req.params.id})
  // console.log(userdata)
  const filedata=await datamodels.find({user:req.params.id})
  // console.log(filedata)
  res.render("userdetail",{user:userdata,data:filedata});
})





app.get("/upload/:id", async(req, res) => {
  const user= await usermodel.findOne({_id: req.params.id})
  res.render("imageupload", { message: "",userdata: user });
});

app.post("/upload", checklogin, upload.single("image"), async (req, res) => {
  // console.log(req.file)
  try {
    // console.log(req.user)
    const user = await usermodel.findOne({ email: req.body.email });
    if (req.user.email === user.email) {
      user.profilepic = req.file.filename;
      // console.log(user.profilepic)
      await user.save();
      res.redirect("/view");
    }
  } catch (error) {
    console.log(user)
    res.render("imageupload", { message: "Invaild Email" });
  }
});

app.get("/", function (req, res) {
  res.render("login", { message: "" });
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signup", async function (req, res) {
  const { username, email, password } = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await usermodel.create({
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
  try {
    let user = await usermodel.findOne({ email: req.body.email });
    if (!user) {
      return res.render("login", {
        message: "Email and Password do not match",
      });
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (result) {
        let token = jwt.sign({ email: user.email }, "notepad");
        res.cookie("token", token);
        res.redirect("/view");
      } else {
        return res.render("login", { message: "Incorrect password" });
      }
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

app.get("/logout", checklogin, function (req, res) {
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
    // console.log(data);
    next();
  }
}








app.get("/view", checklogin, async function (req, res) {
  let user = await usermodel
    .findOne({ email: req.user.email })
    .populate("file");
    const message = req.query.message || "";
  // console.log(user);

  res.render("index", { user: user ,message});
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

app.get("/read/:id", checklogin, async function (req, res) {
  let showdata = await datamodels.findOne({ _id: req.params.id });
  // console.log(showdata);
  res.render("read", { showdata: showdata });
});

app.get("/delete/:id", checklogin, async function (req, res) {
  // let deletedata= await datamodels.findOne({_id:req.params.id});
  await datamodels.findOneAndDelete({ _id: req.params.id });
  res.redirect("/view?message=Notes Deleted");
});

app.get("/edit/:id", checklogin, async function (req, res) {
  let editdata = await datamodels.findOne({ _id: req.params.id });
  // console.log(deletedata)
  res.render("update", { editdata: editdata });
});

app.post("/update/:id", checklogin, async function (req, res) {
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
