// 1: unshift => use to insert element at the start of array
// 2:const sortby = this.queryResponse.sort.split(',').join(' ')   =>   ',' ki jgh ' '

// SECURITY
//1>Set security HTTP header
app.use(helmet());
//2>Limit req from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many req from IP , Pls try again after an hour',
});
app.use('/api', limiter);
//3> Seding JWT COOKIE
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
};
res.cookie('jwt', token, cookieOptions);
//4>Data Sanitization against No SQL query injection
app.use(mongoSanitize());
//5>Data Sanitization against XSS query injection
app.use(xss());
// 6>Prevent parameter pollution
app.use(hpp);
