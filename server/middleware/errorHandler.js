const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Only log unexpected server errors, not business logic errors (4xx)
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
  }

  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
