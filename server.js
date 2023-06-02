const express = require('express')
const cookiePaser = require('cookie-parser')
const dotenv = require('dotenv')
const fileUpload = require('express-fileupload')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean = require('xss-clean')
const hpp = require('hpp')
const cors = require('cors')
const bodyParser = require('body-parser')
const server = express()
const swaggerDocs = require('./utils/swagger')

const connDB = require('./config/database') // Calling the database

// Importing SwaggerDocs

swaggerDocs(server)
// Middleware for Handling Errors
const errorMiddleware = require('./middlewares/error')
const ErrorHandler = require('./utils/errorHandler')

// Setting up the environment variable
dotenv.config({ path: './config/config.env' })

// Handling Uncaught Exception => make sure it's at the top of your file so that it wont ruin the server
// Make use of err.message in the production mode
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.stack}`)
  console.log(`Shutting down due uncaught error`)
  process.exit(1)
})

const PORT = process.env.PORT

// Setting up Security headers
server.use(helmet())

// Middlewares
server.use(cookiePaser()) // Use in setting the cookie parser
server.use(express.json()) // Used in passing application/json data
server.use(express.urlencoded({ extended: false })) // Used in passing form
server.use(express.static('public')) // Used in display static file such as css and javascript

// Handling the file upload middlewares
server.use(fileUpload())

// Sanitize data
server.use(mongoSanitize())

// Preventing XSS Attack
server.use(xssClean())

// Preventing Parameter Pollution
server.use(
  hpp({
    whitelist: ['positions'],
  })
)

// Rate Limit for the api
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

// Setup CORS - Accessible by other domain
server.use(cors())

// Instancing the Limiter

server.use(limiter)

// Importing our routes
const jobs = require('./routes/jobs.route')
const auth = require('./routes/auth.route')
const user = require('./routes/user.route')

// Routing for the api
server.get('/users', (req, res) => {
  return res.status(200).json({ message: 'Are you there' })
})
server.use('/api/v1', jobs)
server.use('/api/v1', auth)
server.use('/api/v1', user)

server.all('*', (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} is not found!!!`, 404))
})

// Middleware handling errors
server.use(errorMiddleware)
// Connecting the database
connDB()
  .then(() => console.log(`The database has been connected`))
  .catch((err) => console.log(err.message))

const app = server.listen(PORT, () =>
  console.log(
    `Server is listening on port ${PORT} in ${process.env.NODE_ENV} mode.`
  )
)

// Handling unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log(`Error ${err.message}`)
  console.log(`Shutting down the server due to unhandled rejection`)
  app.close(() => {
    process.exit(1)
  })
})
