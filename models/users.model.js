const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const { Schema, model } = mongoose

/**
 * @swagger
 * components:
 *   schemas:
 *     # User schema definition
 *     User:
 *       type: object
 *       required: 
 *          -name
 *          -email
 *          -password
 *       properties:
 *         # Name field
 *         name:
 *           type: string
 *           description: Please enter your name

 *         # Email field
 *         email:
 *           type: string
 *           default: shobo@gmail.com
 *           format: email
 *           description: Please enter your email address

 *         # Role field
 *         role:
 *           type: string
 *           enum:
 *             - user
 *             - employer
 *           default: user
 *           description: Please select your correct role

 *         # Password field
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Please enter password for your account

 *         # CreatedAt field
 *         createdAt:
 *           type: string
 *           format: date-time
 *           default: '2023-06-01T00:00:00Z'
 *           description: Date and time of user creation

 *         # ResetPasswordToken field
 *         resetPasswordToken:
 *           type: string

 *         # ResetPasswordExpire field
 *         resetPasswordExpire:
 *           type: string
 *           format: date-time
 */

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email address'],
      unique: true,
      validate: [validator.isEmail, 'Please enter valid email address'],
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'employer'],
        message: 'Please select your correct role',
      },
      default: 'user',
    },
    password: {
      type: String,
      message: 'Please enter password for your account',
      minlength: [8, 'You password must be at least 8 character long'],
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Hashing the password before saving into the database
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    next()
  }
  this.password = bcrypt.hashSync(this.password, 12)
  next()
})

// Returning the JSON Web Token

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  })
}

// Compare the both password in the database
userSchema.methods.comparePassword = async function (enterPassword) {
  return bcrypt.compareSync(enterPassword, this.password)
}

// Using the first approach => making use of the model approach

// Generate Password Reset token
/* userSchema.methods.getGeneratePasswordToken = function () {
  Generate token for password reset
  const resetToken = crypto.randomBytes(20).toString('hex')

  Hash and set to reset password token
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  Set token expire time
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000
  return resetToken
} */

// Showing all the job created by a user

userSchema.virtual('jobPublished', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'user',
  justOne: false,
})

module.exports = model('User', userSchema)
