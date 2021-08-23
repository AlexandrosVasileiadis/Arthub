const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { validateUser, isLoggedIn } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer ({ storage });
const passport = require("passport");

const User = require("../models/user");

router.get("/artists", catchAsync( async(req, res) => {
    const artists = await User.find({});
    res.render("users/artists", { artists });
}))

router.get("/register", (req, res) => {
    res.render("users/register");
})

router.post("/register", upload.single("image"), validateUser, catchAsync(async (req, res, next) => {
    try{
        const {username, password} = req.body;
        const { filename } = req.file;
        const url = req.file.path;
        const image = {url, filename};
        const user = new User({ username, image });
        const newUser = await User.register(user, password);
        req.login(newUser, err => {
            if(err) return next(err);
            req.flash("success","Successfully registered");
            res.redirect("/");
        })
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/register");
    }
}))

router.get("/login", (req, res) => {
    res.render("users/login");
})

router.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), (req, res) => {
    req.flash("success", "Succesfully logged in");
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Successfully logged out");
    res.redirect("/");
})

router.get("/show/:id", catchAsync(async (req, res) => {
    const { id } = req.params;
    const artist = await User.findById(id);
    
    if(req.user && id == req.user._id){
        return res.render("users/profile", { artist });
    }

    res.render("users/show", { artist });
}))

router.get("/profile/:id", isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const artist = await User.findById(id);
    res.render("users/profile", { artist });
}))

router.get("/upload", isLoggedIn, (req, res) => {
    res.render("users/upload");
})

router.post("/upload", isLoggedIn, upload.single("image"), catchAsync( async(req, res) => {
    const { filename } = req.file;
    const url = req.file.path;
    const { description } = req.body;
    const image = {url, filename, description};
    req.user.images.push(image);
    await req.user.save();
    res.redirect(`/profile/${req.user._id}`);
}))

module.exports = router;