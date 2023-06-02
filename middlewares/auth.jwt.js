const jwt = require('jsonwebtoken')
const User = require('../models/users.model')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const ErrorHandler = require('../utils/errorHandler')

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new ErrorHandler(401, 'Not authorized, login first'))
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  req.user = await User.findById(decoded.id)

  next()
})

exports.authorizedRoles = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `You are not permitted to access this role ${req.role.user}`
        )
      )
    }
    next()
  }
}
