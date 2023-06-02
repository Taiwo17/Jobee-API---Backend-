const express = require('express')

const router = express.Router()

const {
  getUserProfile,
  updatePassword,
  updateUser,
  deleteUser,
  appliedJobs,
  getPublishedJob,
  getUsers,
  deleteUserAdmin,
} = require('../controllers/user.controller')

const {
  isAuthenticatedUser,
  authorizedRoles,
} = require('../middlewares/auth.jwt')

// You can make use of middleware for the authentication

router.use(isAuthenticatedUser)

// Creating the yaml file

/**
 * @swagger
 * '/me'
 * get:
 *    tags:
 *    - User
 *    description: Get the authenticate user profile
 *    responses:
 *      200:
 *        description: Serving is up and running
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              items:
 *                $ref: '#components/schemas/User
 */
router.get('/me', getUserProfile) // Getting the full details of a user
router.get('/jobs/applied', authorizedRoles('user'), appliedJobs)
router.get(
  '/jobs/published',
  authorizedRoles('employer', 'admin'),
  getPublishedJob
)
router.put('/password/update', updatePassword) // Updating the password of the user
router.patch('/me/update', updateUser) // Updating the email and name of the user
router.delete('/me/delete', deleteUser) // Deleting the user from the database

// Admin routes only
router.get('/users', authorizedRoles('admin'), getUsers)
router.delete('/user/:id', authorizedRoles('admin'), deleteUserAdmin)

module.exports = router
