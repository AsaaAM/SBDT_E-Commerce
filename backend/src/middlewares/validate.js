const { ZodError } = require('zod');

/**
 * Validasi request payload menggunakan skema Zod
 * @param {object} schema - Skema Zod { body, query, params }
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => err.message).join('. ');
      return res.status(400).json({
        success: false,
        message: details || 'Validasi input gagal.',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

module.exports = {
  validate,
};
