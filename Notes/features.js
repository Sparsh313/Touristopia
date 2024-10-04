// 1:Filtering
const queryObj = { ...req.query }; //destr kr diye
const excludedFields = ['page', 'sort', 'limit', 'fields']; //remove jo jo krna hai
excludedFields.forEach((el) => delete queryObj[el]); //delete kr diye page,sort ye sb
// console.log(queryObj);

// 1B:Advance Filtering
// { difficulty: 'easy', duration: {$gte:5  } }  ye chahiye
// { difficulty: 'easy', duration: { gte:'5'} }  ye aa rha query Obj
let queryStr = JSON.stringify(queryObj);
queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
const filteredQuery = JSON.parse(queryStr);
console.log(filteredQuery);
let query = Tour.find(filteredQuery);
// 2:Sorting
if (req.query.sort) {
  // 127.0.0.1:3000/api/v1/tour?sort=-price ratingsAvg  we have to give this command
  // 127.0.0.1:3000/api/v1/tour?sort=-price,ratingsAvg  but we want this command so
  const sortby = req.query.sort.split(',').join(' '); // ',' ki jgh ' '
  // console.log(sortby);
  query = query.sort(sortby);
}
// 3 Field Limitiing
if (req.query.fields) {
  const Fields = req.query.fields.split(',').join(' ');
  // console.log(Fields);
  query = query.select(Fields);
} else {
  query = query.select('-__v'); // __v ko mongooose internally use krta to isko rem kr do
}
// Pagination
// Eg-1
// user declare => page=2&limit=10;
// The 2nd page with a limit of 10 means "we skip the first 10" records and get the next 10
// i.e., tours 11 to 20.
// here skip=10
// we have to declare =>.skip(10).limit(10)

// Eg-2
// user declare => page=3&limit=10;
// The 3rd page with a limit of 10 means "we skip the first 20" records and get the next 10
// i.e., tours 21 to 30.
// here skip=20
// we have to declare =>.skip(20).limit(10)

// Formula of skip=(page-1)*Limit
// ****************************************************************************************************
const page = req.query.page * 1 || 1;
const limit = req.query.limit * 1 || 100;
const skip = (page - 1) * limit;
query.skip(skip).limit(limit);

// if (req.query.page) {                                     //jaurat ni hai isko krne ki
//   const totalRecords = await Tour.countDocuments();
//   const totalPages = Math.ceil(totalRecords / limit);
//   if (skip >= totalRecords)
//     throw new Error('You have crossed the page Limit');
// }
