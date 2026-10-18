
const Joi = require("joi");

const createReviewSchema = Joi.object({
  college: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().min(3).max(2000).required(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().trim().min(3).max(2000),
})
  .min(1)
  .required();

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};
