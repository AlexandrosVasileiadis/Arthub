const { userSchema } = require("./schemas");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
const { cloudinary } = require("./cloudinary");

module.exports.validateUser = catchAsync(async(req, res, next) => {
    const { error } = userSchema.validate(req.body);
    const { filename } = req.file;
    if(error){
        await cloudinary.uploader.destroy(filename);
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(msg, 400);
    }
    else{
        next();
    }
})


module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        req.flash("error", "You must be signed in!");
        return res.redirect("/login");
    }
    next();
}


module.exports.isOwner = catchAsync( async(req, res, next) => {
    const { id } = req.params;
    if(req.user._id!=id){
        req.flash("error", "You don't have permission to do that!");
        return res.redirect("/");
    }
    next();
})