const express = require('express')

const router = express.Router()

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/auth.controller')

// Only the authenticated user can always logout of the account
const { isAuthenticatedUser } = require('../middlewares/auth.jwt')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/password/forgot', forgotPassword)
router.put('/password/reset/:token', resetPassword)
router.get('/logout', isAuthenticatedUser, logout)

module.exports = router
