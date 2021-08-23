const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isOwner } = require("../middleware");
const { cloudinary } = require("../cloudinary");


const User = require("../models/user");
const Review = require("../models/review");

router.get("/showImage/:id/:imageId", catchAsync( async(req, res) => {
    const { id, imageId} = req.params;
    const artist = await User.findById(id);
    const image = artist.images.find(x => x.id === imageId);
    let revs = [];
    if(image.reviews.length){
        for(let rev of image.reviews){
            let newRev = await Review.findById(rev);
            await revs.push(newRev);
        }
    }

    res.render("users/showImage", { artist, image, revs });
}))

router.get("/:id/:imageId/review", isLoggedIn, catchAsync( async(req, res) => {
    const { id, imageId } = req.params;
    const artist = await User.findById(id);
    const image = artist.images.find(x => x.id === imageId);
    res.render("users/review", { artist , image});
}))

router.post("/:id/:imageId/review", isLoggedIn, catchAsync( async(req, res) => {
    const { id, imageId } = req.params;
    const artist = await User.findById(id);
    const image = artist.images.find(x => x.id === imageId);
    const { review, rating } = req.body;
    const newReview = new Review({body: review, rating});
    await image.reviews.push(newReview);
    await newReview.save();
    await artist.save();
    res.redirect("/");
}))

router.delete("/image/:id/:imageId", isLoggedIn, isOwner, catchAsync( async(req, res) => {
    const { id, imageId} = req.params;
    const artist = await User.findById(id);
    const image = artist.images.find(x => x.id === imageId);
    if(image.reviews.length){
        for(let rev of image.reviews){
            await Review.findByIdAndDelete(rev);
        }
    }
    cloudinary.uploader.destroy(image.filename);
    const index = artist.images.map(x => { return x.Id; }).indexOf(imageId);
    req.user.images.splice(index,1);
    await req.user.save();
    req.flash("success","Image successfully deleted");
    res.redirect("/");
}))

module.exports = router;