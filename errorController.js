const appError = require('./utilities/appError');

// const handleMongoError = (err) => {
//   const message = `Duplicate Tour name i.e [${err.keyValue.name}] please enter some unique Tour name`;
//   return new appError(message, 400);
// };
const handleCastError = (err) => {
  const message = `Wrong ${err.path} provided i.e :${err.value}`;
  return new appError(message, 400);
};
const handleValidationError = (err) => {
  // Object.values(err.errors) returns an array of the values of err.errors
  const errors = Object.values(err.errors);
  const message = `${errors.join(' and ')}`;
  return new appError(message, 400);
};
const handleJwtError = () => {
  return new appError('Invalid Token , Pls Login again', 401);
};
const handleExpiredTokenError = () => {
  return new appError('Login session expired ,Pls Login Again', 401);
};

const devError = (err, res) => {
  res.status(err.statuscode).json({
    // err: err,
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};
const prodError = (err, res) => {
  //Operational trusted error:send message to client
  if (err.isOperational) {
    res.status(err.statuscode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming error : don't leak the err details
  else {
    //Log error
    console.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statuscode = err.statuscode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV == 'development') {
    if (err.name == 'CastError') err = handleCastError(err);
    devError(err, res);
  } else if (process.env.NODE_ENV == 'production') {
    //Marking Operational Error
    // if (err.name == 'MongoError') err = handleMongoError(err);
    if (err.name == 'CastError') err = handleCastError(err);
    if (err.name == 'ValidationError') err = handleValidationError(err);
    if (err.name == 'JsonWebTokenError') err = handleJwtError();
    if (err.name == 'TokenExpiredError') err = handleExpiredTokenError();
    prodError(err, res);
  }
};
