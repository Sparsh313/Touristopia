const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('uncaught Rejection => Shutting down');
  process.exit(1);
});

const app = require('./app');
dotenv.config({ path: './config.env' });

// console.log(process.env.DATABASE);
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
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('success');
  });

const port = 3000;
app.listen(port, () => {
  console.log(`HEY, Your server is running at port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection => Shutting down');
  process.exit(1);
});
