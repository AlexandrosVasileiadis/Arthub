const Joi = require("joi");

module.exports.userSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,32}$')).required(),
});