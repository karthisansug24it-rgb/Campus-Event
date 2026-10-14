const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * Returns formatted 400 Bad Request error if any validation rule failed.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      errors: formattedErrors
    });
  }
  next();
}

module.exports = {
  validateRequest
};
