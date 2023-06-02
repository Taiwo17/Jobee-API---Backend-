// Importing the models in order to create new Job
const Job = require('../models/jobs.model')
const geoCoder = require('../utils/geocoder')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const APIFilters = require('../utils/apiFilter')
const path = require('path')
const fs = require('fs')

// Get all the jobs => /api/v1/jobs - Defining the routes
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  // Filtering the jobs by query
  const apiFilter = new APIFilters(Job.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination()

  const jobs = await apiFilter.query
  res.status(200).json({
    success: true,
    // Call the exact name in the middleware function that's to be passed!
    // requestMethod: req.requestMethod,
    results: jobs.length,
    data: jobs,
  })
})

// Create a new Job => /api/v1/job/new
// The model is returning a promise so it's better to make use of async/await
exports.newJob = catchAsyncErrors(async (req, res, next) => {
  // Adding the reference to the job model in order for the user to be able to reference
  req.body.user = req.user.id
  const job = await Job.create(req.body)
  res.status(200).json({
    success: true,
    message: 'Job created',
    data: job,
  })
})

// Update a Job => /api/job/:id

exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  // Request the id parameter from the database
  const { id } = req.params

  // Validate the job if it's found in the database
  let jobs = await Job.findById(id)
  if (!jobs) {
    // Making use of Native errors handling
    /* return res.status(400).json({
      success: false,
      message: 'Job not found!',
    }) */

    // Making use of Error Handling
    return next(new ErrorHandler('Job not Found', 404))
  }

  // Check if the user is the owner of the job
  if (jobs.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorHandler(
        `User(req.user.id) is not allowed to update this job`,
        400
      )
    )
  }
  // Update the job in the database and send the response back to the Users
  jobs = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })
  return res.status(200).json({
    success: true,
    message: 'Job is updated',
    data: jobs,
  })
})

// Get a single job with id and slug => /api/v1/:id/:slug

exports.getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id, slug } = req.params

  // Making use of and operator to find two req paramaters
  // in order to make sure they meet the conditions stated

  // Also dispalying the name of the employer that
  // uploaded the job

  const job = await Job.find({ $and: [{ _id: id }, { slug: slug }] }).populate({
    path: 'user',
    select: 'name',
  })
  if (!job || job.length === 0) {
    return next(new ErrorHandler('Job not Found', 404))
  }

  return res.status(200).json({
    success: true,
    data: job,
  })
})

// Delete a Job => /api/job/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  // Request the id parameter from the database
  const { id } = req.params
  let job = await Job.findById(id).select('+applicantsApplied')

  // Validate it if the job is not found and return the response
  if (!job) {
    return next(new ErrorHandler('Job not Found', 404))
  }

  // Check if the user is the owner of the job
  if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorHandler(
        `User(req.user.id) is not allowed to delete this job`,
        400
      )
    )
  }
  // Looping through the job for deletion
  for (let i = 0; i < job.applicantsApplied.length; i++) {
    // Navigating through the folder the resume was saved into
    let filepath =
      `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace(
        '\\controllers',
        ''
      )
    // Making use of fs module  to remove the resume
    fs.unlink(filepath, (err) => {
      if (err) return console.log(err)
    })
  }

  // Send the response if  the job is found so that it can be deleted
  await Job.findByIdAndDelete(id)
  return res.status(200).json({
    success: true,
    message: 'Job have been deleted successfully',
  })
})

// Search for Jobs within the radius => /api/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  // Requesting the zipcode and the distance from the end users
  const { zipcode, distance } = req.params

  // Calculating the zipcode making use of zipcode provided by the users
  const loc = await geoCoder.geocode(zipcode)
  const longitude = loc[0].longitude // Calculating the longitude and the latitude
  const latitude = loc[0].latitude

  // Calculating the radius
  const radius = distance / 3963

  const jobs = await Job.find({
    // Making use of Mongoose builtin functionality to access the location
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  })
  // Sending the data back to the end users
  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  })
})

// Get all the job statistics

exports.jobStats = catchAsyncErrors(async (req, res, next) => {
  // Making use of the aggregate function in the database
  const stats = await Job.aggregate([
    // You need to create the index in the database collection in order for this to work
    {
      $match: { $text: { $search: `${req.params.topic}` } },
    },
    {
      $group: {
        // The _id simply means what you intend to group the result with
        // in this case we will be grouping it by experience
        _id: { $toUpper: '$experience' },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: '$positions' },
        avgSalary: { $avg: '$salary' },
        minSalary: { $min: '$salary' },
        maxSalary: { $max: '$salary' },
      },
    },
  ])
  if (stats.length === 0) {
    return next(
      new ErrorHandler(`No stats found for the topics ${req.params.topic}`, 404)
    )
  }
  return res.status(200).json({
    success: true,
    data: stats,
  })
})

// Apply to Job using resume => /api/v1/job/:id/apply
exports.applyJob = catchAsyncErrors(async (req, res, next) => {
  // Get the job id first and select the applicantsApplied using the plus (+)
  const job = await Job.findById(req.params.id).select('+applicantsApplied')

  // Checking the database if there's job in the database
  if (!job) {
    return next(new ErrorHandler('Job not found ', 404))
  }
  // Check if the job date has been passed or not
  if (job.lastDate < new Date(Date.now())) {
    return next(
      new ErrorHandler('You cannot apply to this job, the date is over ', 400)
    )
  }

  // Check if user have applied before, you make use of loop to achieve this task
  for (let i = 0; i < job.applicantsApplied.length; i++) {
    // Check if the applicants id is equal to the user id
    if (job.applicantsApplied[i].id === req.user.id) {
      return next(
        new ErrorHandler('You have already applied for this job', 400)
      )
    }
  }
  // Checking the file
  if (!req.files) {
    return next(new ErrorHandler('Please upload your file', 400))
  }
  // Calling the file from the frontend or the postman
  const file = req.files.file
  console.log(file.name)

  // Checking the type of the filesupportedFiles
  const supportedFiles = /.docs|.pdf|docx/

  if (!supportedFiles.test(path.extname(file.name))) {
    return next(
      new ErrorHandler('Please upload the supported document type', 400)
    )
  }
  // Check the file size

  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler('Please upload file less than 2MB', 400))
  }

  // Renaming the document
  file.name = `${req.user.name.replace(' ', '_')}_${job._id}${
    path.parse(file.name).ext
  }`
  // Moving the the file to the folder in a public folder
  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err)
      return next(new ErrorHandler('Resume upload failed', 400))
    }
    await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          applicantsApplied: {
            id: req.user.id,
            resume: file.name,
            email: req.user.email,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    )
    return res.status(200).json({
      success: true,
      message: 'Applied to Job successfully',
      data: file.name,
      userEmail: req.user.email,
    })
  })
})
