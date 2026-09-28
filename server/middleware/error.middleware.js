/**
 * Centralized error handling middleware.
 * Logs errors and returns a consistent JSON error response.
 * Strips stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
  // Determine status code — don't default to 200
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Error] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
  if (!isProduction) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : err.message,
    stack: isProduction ? undefined : err.stack
  });
};
