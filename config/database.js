const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: '../config/config.env' })

const connDB = async () => {
  try {
    await mongoose.connect(process.env.DB_ONLINE_URI)
  } catch (error) {
    console.log('Error occured', error.message)
  }
}

module.exports = connDB
