const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

dotenv.config({ path: '../config/config.env' })

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  })

  // Message sent to the user of the email
  const message = {
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  try {
    await transporter.sendMail(message)
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = sendEmail
