if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
    console.log("Showing");
}

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError");
const { cloudinary } = require("./cloudinary");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");
const MongoDBStore = require("connect-mongo");


const User = require("./models/user");

const usersRoutes = require("./routes/users");
const imagesRoutes = require("./routes/images");

const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Arthub';
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
    })
    .then(() => {
        console.log("CONNECTION SUCCESSFUL");
    })
    .catch(err => {
        console.log("CONNECTION ERROR");
        console.log(err);
    })

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended: true}));

const secret = process.env.SECRET || "firstBadSecret";

const sessionConfig = {
    store: MongoDBStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 3600 // time period in seconds
    }),
    name: "us",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly : true,
        secure: false, //not true because of a heroku error
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge:  1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use(mongoSanitize());

app.use(helmet({contentSecurityPolicy: false}));

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.use("/", usersRoutes);
app.use("/", imagesRoutes);

app.get("/", (req, res) => {
    res.render("home");
})

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
})

app.use((err, req, res, next) => {
    const {statusCode = 500, message = "Something went wrong!" }= err;
    
    if (err.message === "A user with the given username is already registered"){
        const { filename } = req.file;
        cloudinary.uploader.destroy(filename);
    }

    if(err.message === "Cannot destructure property 'filename' of 'req.file' as it is undefined."){
        err.message = "Profile image is required to create user";
    }
    
    res.status(statusCode).render("error", { err });
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
})