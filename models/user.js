const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    image: {
        url: String,
        filename: String
    },
    images: [
        {
            url: String,
            filename: String,
            description: String,
            reviews: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Review"
                }
            ]
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);