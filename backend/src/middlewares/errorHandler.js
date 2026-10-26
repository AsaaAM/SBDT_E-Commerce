const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
};
