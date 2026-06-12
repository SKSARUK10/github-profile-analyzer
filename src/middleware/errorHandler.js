/**
 * Central error handler — catches everything next(err) forwards here.
 * Keeps controller code clean.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isDev      = process.env.NODE_ENV === "development";

  console.error(`[${new Date().toISOString()}] ERROR ${statusCode}: ${err.message}`);
  if (isDev) console.error(err.stack);

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
