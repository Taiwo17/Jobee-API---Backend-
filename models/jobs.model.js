const mongoose = require('mongoose')
const { isEmail } = require('validator')
const slugify = require('slugify')

const { Schema, model } = mongoose
const geoCoder = require('../utils/geocoder')

const jobSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter your job title'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters'],
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please enter your job description'],
    maxlength: [1000, 'Job description cannot exceed 1000 character '],
  },
  email: {
    type: String,
    validate: [isEmail, 'Please add a valid email address'],
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    formattedAddress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  company: {
    type: String,
    required: [true, 'Please add Company name'],
  },
  industry: {
    type: [String],
    required: [true, 'Please enter industry for this job'],
    enum: {
      values: [
        'Business',
        'Information Technology',
        'Banking',
        'Education/Training ',
        'Telecommunication',
        'others',
      ],
      message: 'Please select the correct option for your industry',
    },
  },
  jobType: {
    type: String,
    required: [true, 'Please enter your preferred job type'],
    enum: {
      values: ['Permanent ', 'Temporary', 'Intership'],
      message: 'Please select the correct option for the job',
    },
  },
  minEducation: {
    type: String,
    required: [true, 'Please enter your minimum education for this job'],
    enum: {
      values: ['Bachelors', 'Masters', 'Phd'],
      message: ' Please pick the  correct option for Education',
    },
  },
  positions: {
    type: Number,
    default: 1,
  },
  experience: {
    type: String,
    required: [true, 'Please enter your job experience'],
    enum: {
      values: [
        'No Experience',
        '1 Year - 2 Years',
        '2 Years - 5 Years',
        '5 Years+',
      ],
      message: 'Please select the correct option for your experiences',
    },
  },
  salary: {
    type: Number,
    required: [true, 'Enter your expected salary for the position'],
  },
  postingDate: {
    type: Date,
    default: Date.now,
  },
  lastDate: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 7),
  },
  applicantsApplied: {
    type: [Object],
    select: false,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
})

// Creating the slug before saving it
jobSchema.pre('save', function (next) {
  // The this keyword will refer to the object of the job schema
  this.slug = slugify(this.title, { lower: true })
  next()
})

// Setting up the location with Geocoder
jobSchema.pre('save', async function (next) {
  // Getting the address from the end users
  const loc = await geoCoder.geocode(this.address)
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  }
  next()
})

module.exports = model('Job', jobSchema) // Another method for exporting models
