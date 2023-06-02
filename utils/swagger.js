const express = require('express')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const dotenv = require('dotenv')

// Setting up the environment variable
dotenv.config({ path: './config/config.env' })

const options = {
  definition: {
    opeanapi: '3.0.0',
    server: [
      {
        url: 'http://localhost/4000',
      },
    ],
    info: {
      title: 'Jobee API documentation',
      version: '1.0.0',
      description:
        'A Jobee API developed with Nodejs and Express and Mongodb as backend',
    },
    components: {
      securitySchemas: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['../routes/*.js', '../models/*.js'],
}

const swaggerSpec = swaggerJsDoc(options)

function swaggerDocs(server) {
  // Defining the swagger page
  server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  // Docs in JSON format

  server.get('/docs', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  console.log(`Docs is available at http://localhost:${process.env.PORT}/docs/`)
}

module.exports = swaggerDocs
