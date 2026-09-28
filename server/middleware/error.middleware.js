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

  // Details are exposed only for an explicit NODE_ENV=development (set it
  // locally when you need stacks). Unset/production never return stacks.
  const exposeDetails = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
  if (exposeDetails && err.stack) {
    console.error(err.stack);
  }

  const shouldMask = statusCode === 500 && !exposeDetails;
  res.status(statusCode).json({
    success: false,
    message: shouldMask ? 'Internal Server Error' : err.message,
    stack: exposeDetails ? err.stack : undefined
  });
};
