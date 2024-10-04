class APIfeatures {
  constructor(query, queryResponse) {
    this.query = query; //it act as query
    this.queryResponse = queryResponse; //it act as  req.query
  }
  filter() {
    // 1:Filtering
    const queryObj = { ...this.queryResponse }; //destr kr diye
    const excludedFields = ['page', 'sort', 'limit', 'fields']; //remove jo jo krna hai
    excludedFields.forEach((el) => delete queryObj[el]); //delete kr diye page,sort ye sb

    // 1B:Advance Filtering
    // { difficulty: 'easy', duration: {$gte:5  } }  ye chahiye
    // { difficulty: 'easy', duration: { gte:'5'} }  ye aa rha queryObj se
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const filteredQuery = JSON.parse(queryStr);
    this.query.find(filteredQuery);
    return this;
  }
  sorting() {
    if (this.queryResponse.sort) {
      // 127.0.0.1:3000/api/v1/tour?sort=-price ratingsAvg  we have to give this command
      // 127.0.0.1:3000/api/v1/tour?sort=-price,ratingsAvg  but we want this command so
      const sortby = this.queryResponse.sort.split(',').join(' '); // ',' ki jgh ' '
      this.query = this.query.sort(sortby);
    }
    return this;
  }
  limitFleids() {
    if (this.queryResponse.fields) {
      const Fields = this.queryResponse.fields.split(',').join(' ');
      // console.log(Fields);
      this.query = this.query.select(Fields);
    } else {
      this.query = this.query.select('-__v'); // __v ko mongooose internally use krta to isko rem kr do
    }
    return this;
  }
  pagination() {
    const page = this.queryResponse.page * 1 || 1;
    const limit = this.queryResponse.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIfeatures;
