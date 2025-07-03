const Joi = require('joi');

// User registration validation
const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// User login validation
const validateUserLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Train creation validation
const validateTrainCreation = (req, res, next) => {
  const schema = Joi.object({
    train_number: Joi.string().required(),
    train_name: Joi.string().required(),
    source_station: Joi.string().required(),
    destination_station: Joi.string().required(),
    total_seats: Joi.number().integer().min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Seat availability validation
const validateSeatAvailability = (req, res, next) => {
  const schema = Joi.object({
    source: Joi.string().required(),
    destination: Joi.string().required()
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Booking validation
const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    train_id: Joi.number().integer().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateTrainCreation,
  validateSeatAvailability,
  validateBooking
};