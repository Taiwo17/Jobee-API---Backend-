class APIFilters {
  constructor(query, queryStr) {
    // The query is the key while the queryStr is the parameter
    this.query = query
    this.queryStr = queryStr
  }

  filter() {
    let queryCopy = { ...this.queryStr } // Make use of the spread operator to copy every query string

    // Removing fields from the query filtering
    const removeField = ['sort', 'fields', 'q', 'limit', 'page'] // Special reserved keywords for the limiting and sorting

    removeField.forEach((el) => delete queryCopy[el])

    // Advanced filter using: lt, lte, gt, gte
    let queryStr = JSON.stringify(queryCopy) // Strigify the query copy first
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    )
    this.query = this.query.find(JSON.parse(queryStr))
    return this
  }

  // Sorting the fields
  // {{DOMAIN}}/api/v1/jobs?sort=-salary // Sorting the jobs by any of your respective values
  sort() {
    if (this.queryStr.sort) {
      // Using sortBy to for two or more query
      const sortBy = this.queryStr.sort.split(',').join(' ')
      console.log(sortBy)
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-postingDate')
    }
    return this
  }

  // {{DOMAIN}}/api/v1/jobs?fields=title // limiting the results to any of your respective values

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ')
      // Making use of Mongoose select options to limits the fields
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }
    return this
  }

  // {{DOMAIN}}/api/v1/jobs?q=nodejs // Search for jobs in the database with the specified language name
  searchByQuery() {
    if (this.queryStr.q) {
      const qu = this.queryStr.q.split('-').join(' ')
      this.query = this.query.find({ $text: { $search: `${qu}` } })
    }
    return this
  }

  // {{DOMAIN}}/api/v1/jobs?page=1,limit=1
  pagination() {
    const page = parseInt(this.queryStr.page, 10) || 1
    const limit = parseInt(this.queryStr.limit, 10) || 10
    const skipResults = (page - 1) * limit
    this.query = this.query.skip(skipResults).limit(limit)
    return this
  }
}

module.exports = APIFilters
