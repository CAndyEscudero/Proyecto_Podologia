const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(422).json({
      message: "Validation error",
      errors: result.array(),
    });
  }

  next();
}

module.exports = { validateRequest };
