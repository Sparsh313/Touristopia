module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
    // If the function `fn` returns a promise=>function will get call
    // if promise rejects => catch the error and pass it to the `next` middleware(error handling middleware)[errController]
  };
};
