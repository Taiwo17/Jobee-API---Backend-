const ErrorHandler = require('../utils/errorHandler')

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500

  // Handling error for both development and production
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack,
    })
  }

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err }

    error.message = err.message

    // Wrong mongoose DB error
    if (err.name === 'CastError') {
      const message = `Resources not Found ${err.path}`
      error = new ErrorHandler(message, 404)
    }

    // Handling Mongoose DB errors

    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((value) => value.message)
      error = new ErrorHandler(message, 404)
    }

    // Handling Mongoose duplicate key error

    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} is entered`
      error = new ErrorHandler(message, 400)
    }

    // Handling wrong JWT token error
    if (err.name === 'JsonWebTokenError') {
      const message = 'JSON  Web token is Invalid. Try Again'
      error = new ErrorHandler(message, 500)
    }

    // Handling expired JWT token error

    if (err.name === 'TokenExpiredError') {
      const message = 'JSON Web is expired. Try Again'
      error = new ErrorHandler(message, 500)
    }
    return res.status(error.statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    })
  }
}
