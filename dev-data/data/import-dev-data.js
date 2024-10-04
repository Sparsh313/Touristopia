const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('./../../model/tourModel');
const User = require('./../../model/userModel');
const Review = require('./../../model/reviewModel');

const encodedPassword = process.env.DATABASE_PASSWORD; //Taking pass from env ie:Believeit
const DB = process.env.DATABASE.replace('<PASSWORD>', encodedPassword); //replacing <PASSWORD> with Believeit in DATABASE
const Local_DB = process.env.DATABASE_LOCAL;
//connecting DATABASE with MONGOOSE*************************************
mongoose
  // .connect(Local_DB, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('success');
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const review = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
//IMPORT DATA into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(review, { validateBeforeSave: false });
    console.log('Data succesfully Imported');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};
//Delete all prev data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data succesfully Deleted');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else {
  deleteData();
}
console.log(process.argv);
