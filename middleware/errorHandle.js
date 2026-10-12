function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message:
      status === 500
        ? "An unexpected server error occurred."
        : err.message
  });
}

module.exports = { notFound, errorHandler };