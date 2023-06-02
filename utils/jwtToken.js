// Create and send token and save in a cookie
const sendToken = (user, statusCode, res) => {
  // Create a JWT Token

  const token = user.getJwtToken()
  // console.log(user)

  // Create an Options

  // Creating the expires date

  // expires: new Date(
  //   Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
  // ),
  const options = {
    expiresIn: process.env.maxAge * 1000,
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true
  }

  return res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  })
}

module.exports = sendToken
