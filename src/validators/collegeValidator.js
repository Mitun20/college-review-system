
const Joi = require("joi");

const createCollegeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().max(100).allow("").optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  website: Joi.string().trim().uri().allow("").optional(),
});

const updateCollegeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  city: Joi.string().trim().min(2).max(100),
  state: Joi.string().trim().max(100).allow(""),
  description: Joi.string().trim().max(1000).allow(""),
  website: Joi.string().trim().uri().allow(""),
}).min(1);

module.exports = {
  createCollegeSchema,
  updateCollegeSchema,
};
