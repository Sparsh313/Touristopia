const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan');
const tourRouter = require('./route/tourRoute');
const userRouter = require('./route/userRoute');
const reviewRouter = require('./route/reviewRoute');
const appError = require('./utilities/appError');
const globalErrorHandler = require('./errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//setting pug tempalate
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// MIDDLEWARE
//1>Set security HTTP header
app.use(helmet());
//2>Development logging
app.use(morgan('dev'));
//3>Limit req from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many req from IP , Pls try again after an hour',
});
app.use('/api', limiter);
//4>Body parser , Reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
//5>Data Sanitization against No SQL query injection
app.use(mongoSanitize());
//6>Data Sanitization against XSS query injection
app.use(xss());
// 7>Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAvg',
      'ratingsQuantity',
      'maxGroupSize',
      'price',
      'diffficulty',
    ],
  })
);

app.use(express.static(path.join(__dirname, 'public')));

//Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.get('/', (req, res) => {
  res.render('base', {
    tour: 'The Forest Hiker',
    user: 'Sparsh',
  });
});

app.use('/api/v1/tour', tourRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
