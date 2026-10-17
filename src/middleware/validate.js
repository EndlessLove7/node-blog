const { AppError } = require('../errors');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    req.validated = req.validated || {};
    req.validated[source] = result.data;
    return next();
  };
}

function requireJsonObject(req, res, next) {
  if (!req.is('application/json')) {
    return next(new AppError(415, 'Content-Type 必须为 application/json'));
  }
  return next();
}

module.exports = { validate, requireJsonObject };
