const User = require('../models/users.model')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const ErrorHandler = require('../utils/errorHandler')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

// Register a new user => /api/v1/register

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // Get the name, email, password and role
  const { name, email, password, role } = req.body

  const user = await User.create({ name, email, password, role })

  // Using the first method => Create JWT Token
  /*  const token = users.getJwtToken()

  return res.status(200).json({
    success: true,
    message: 'User is registered',
    token,
  }) */
  // Second Method using external file

  sendToken(user, 200, res)
})

// Login an existing user => /api/v1/login

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new ErrorHandler('Please enter your email and address', 404))
  }
  // Find the user in the databasse
  // We have place the password to be false in the model
  // so in order to select it, we must make use of select('+nameOfTheSelectFalse') in the model
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorHandler('Invalid Email or Password', 401))
  }
  // Comparing the password of the user
  const isPasswordMatch = await user.comparePassword(password)

  if (!isPasswordMatch) {
    return next(new ErrorHandler('Invalid Email or Password', 401))
  }

  // Using the first method => Create JWT Token
  /*  const token = users.getJwtToken()

  return res.status(200).json({
    success: true,
    message: 'User is logged in',
    token,
  }) */

  // Second Method using external file

  sendToken(user, 200, res)
})

// Forgot Password => /api/v1/password/forgot

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  // Check user email in database
  if (!user) {
    return next(new ErrorHandler(`User is not found in the database`, 404))
  }

  /*   Generate the token
  const resetToken = user.getGeneratePasswordToken()
  It causes error in forgot password so we have to make use of the modified function
  to check the password before saving it into the database so the
  if statement might got rid of the error
  await user.save({ validateBeforeSave: false }) */

  // Using the second approach
  // Setting the password token and hashing it using crypto modules
  const resetToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000
  await user.save()
  // Generate the URL of sending the token
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${resetToken}`

  const message = `Your password link is as follow:\n\n${resetUrl}\n\n if you have not requested for this, please ignore it `

  try {
    await sendEmail({
      email: user.email,
      subject: 'Jobee API Password Recovery',
      message,
    })

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to: ${user.email}`,
    })
  } catch (error) {
    // After setting the password
    // user.resetPasswordExpire = undefined
    // user.resetPasswordToken = undefined
    // await user.save({ validateBeforeSave: false })
    console.log(error.message)
    return next(new ErrorHandler('Email is not sent '), 500)
  }
})

// Reset Password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  /*   Firstly hash the password in the req parameter
  The :token is gotten from req.params.token
  Hash the token and compare it together maybe it's correct or not
  Hash the url token */

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  /* And you have to compare the token saved in the database*/

  // Using the first approach
  const user = await User.findOne({
    resetPasswordToken,
    // resetPasswordExpire: { $gt: Date.now() }, // Set the expiration for the token
  })
  // If there's no user token in the database
  if (!user) {
    return next(new ErrorHandler('Password token is Invalid', 400))
  }
  // Second approach giving us a message => checking the password length of the time
  if (user.resetPasswordExpire < Date.now()) {
    return res.status(400).json({ message: 'Password link expired' })
  }
  // Setting up the new Password after it has changed and setting the token and the expriation to undefined
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()

  sendToken(user, 200, res)
})

// Logout User => /api/v1/logout

exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
  })
  return res
    .status(200)
    .json({ success: true, message: 'User is logout successfully' })
})
