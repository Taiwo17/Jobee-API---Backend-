const User = require('../models/users.model')
const Job = require('../models/jobs.model')
const catchAsyncError = require('../middlewares/catchAsyncErrors')
const ErrorHandler = require('../utils/errorHandler')
const sendToken = require('../utils/jwtToken')
const fs = require('fs')
const APIFilters = require('../utils/apiFilter')

// Get current user profile => /api/v1/me

exports.getUserProfile = catchAsyncError(async (req, res, next) => {
  // Making use of Virtual in the schema and populate
  // method in the controller to add some field to the
  // request while not saving it in the database
  const user = await User.findById(req.user.id).populate({
    path: 'jobPublished',
    select: 'title postingDate',
  })
  return res.status(200).json({ success: true, data: user })
})

// Users trying to update their password, if they are not quite interested in the former password
// /api/v1/password/update

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  // Finding the password from the database of the user
  const user = await User.findById(req.user.id).select('+password')

  // Check the previous password
  const isMatched = await user.comparePassword(req.body.currentPassword)

  if (!isMatched) {
    return next(new ErrorHandler('Old Password is incorrect', 401))
  }

  user.password = req.body.newPassword // Set the update to the password in the database
  await user.save() // Save the password you have been doing to the database

  sendToken(user, 200, res) // Send the token back to the user
})

// Updating the user data => /api/v1/me/update
exports.updateUser = catchAsyncError(async (req, res, next) => {
  // Updating the new user with the email and the name
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  }
  // Updating the user in using findByIdAndUpdate

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  })
  return res.status(200).json({ success: true, data: user })
})

// Show all applied job => /api/v1/jobs/applied

exports.appliedJobs = catchAsyncError(async (req, res, next) => {
  // Selecting the job applied to by each user in the database
  const jobs = await Job.find({ 'applicantsApplied.id': req.user.id }).select(
    '+applicantsApplied'
  )
  return res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  })
})

// Show all job published by the Employer => /api/v1/jobs/published

exports.getPublishedJob = catchAsyncError(async (req, res, next) => {
  // This is coming from the reference in the database model
  // for the job model
  const jobs = await Job.find({ user: req.user.id })
  return res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  })
})

// Deleting the user data from the database => /api/v1/me/delete
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  deleteUserData(req.user.id, req.user.role)
  const user = await User.findByIdAndDelete(req.user.id)

  // Deleting the token and the cookies
  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
    httpOnly: true,
  })
  return res.status(200).json({
    success: true,
    message: 'Your account have been deleted',
  })
})

// Adding Controller methods that only accessible by admins

// Show all users => /api/v1/users
// The show all users by admin is also similar to finding
// and sorting of jobs by users
exports.getUsers = catchAsyncError(async (req, res, next) => {
  const apiFilter = new APIFilters(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination()
  const users = await apiFilter.query
  return res.status(200).json({
    success: true,
    result: users.length,
    data: users,
  })
})

// Delete User by Admin only => /api/v1/user/:id

exports.deleteUserAdmin = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(
      new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
    )
  }
  // Making user of the delete function
  deleteUserData(user.id, user.role)
  user.deleteOne()
  return res
    .status(200)
    .json({ success: true, message: 'User has been deleted by Admin' })
})

//  Deleting the user information once they delete their account
async function deleteUserData(user, role) {
  if (role === 'employer') {
    await Job.deleteMany({ user: user })
  }
  if (role === 'user') {
    // Checking the job the user applied to in the database and selecting it from the database
    const appliedJob = await Job.find({ 'applicantsApplied.id': user }).select(
      '+applicantsApplied'
    )
    // Looping through the job and finding the user id
    for (let i = 0; i < appliedJob.length; i++) {
      let obj = appliedJob[i].applicantsApplied.find((o) => o.id === user)

      // Navigating through the folder the resume was saved into
      let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace(
        '\\controllers',
        ''
      )
      // Making use of fs module  to remove the resume
      fs.unlink(filepath, (err) => {
        if (err) return console.log(err)
      })

      // Using the inbuilt splice method to remove it from the databse
      appliedJob[i].applicantsApplied.splice(
        appliedJob[i].applicantsApplied.indexOf(obj.id)
      )
      // Saving the task
      await appliedJob[i].save()
    }
  }
}
