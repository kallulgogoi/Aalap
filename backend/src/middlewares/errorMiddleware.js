const errorHandler = (err, req, res, next) => {
  // jab error status code 200 hai, toh usko 500 bana do, warna jo bhi status code hai use hi use karo
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // if you search for a user/chat with an invalid ID format
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found. Invalid ID format.";
  }

  // if someone tries to register with an email that already exists
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists.`;
  }

  // if a required field is missing or password is too short based on your schema
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };
