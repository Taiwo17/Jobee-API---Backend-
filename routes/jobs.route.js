const express = require('express')

const router = express.Router()
const {
  getJobs,
  newJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getSingleJob,
  jobStats,
  applyJob,
} = require('../controllers/job.controller')

const {
  isAuthenticatedUser,
  authorizedRoles,
} = require('../middlewares/auth.jwt')

// router.route('/jobs').get(getJobs) // Another method for defining it

router.get('/jobs', getJobs) // First method // Getting all the jobs, it's not mandatory to be authenticated
router.get('/job/:id/:slug', getSingleJob) // Getting a single job, it's not mandatory to be authenticated
router.get('/jobs/:zipcode/:distance', getJobsInRadius) // Getting a single job, it's not mandatory to be authenticated
router.get('/stats/:topic', jobStats) // Getting a single job, it's not mandatory to be authenticated
router.post(
  '/job/new',
  isAuthenticatedUser,
  authorizedRoles('admin', 'employer'),
  newJob
) // Posting a new job exclusively to the employer and admin
router.put(
  '/job/:id/apply',
  isAuthenticatedUser,
  authorizedRoles('user'),
  applyJob
) // Applying for a particular job by the user, he must be login

router.put(
  '/job/:id',
  isAuthenticatedUser,
  authorizedRoles('admin', 'employer'),
  updateJob
) // Updating the jobs, only exclusive to the admin and employer
router.delete(
  '/job/:id',
  isAuthenticatedUser,
  authorizedRoles('admin', 'employer'),
  deleteJob
) // Deleting the job only exclusive to the admin and employers

module.exports = router
