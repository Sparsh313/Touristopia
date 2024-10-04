const { promisify } = require('util');
const appError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const app = require('../app');
const sendEmail = require('../utilities/email');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const CreateSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //Not accessible via JavaScript, preventing certain types of attacks like XSS
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //cookie will only be sent over HTTPS connections
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'sucess',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, //check
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  CreateSendToken(newUser, 201, res);
});
// It captures the user's details from the request body,
// creates a new user document,
// then generates and sends a JWT token to the client, allowing the user to be automatically logged in after signing up
// JWT acts like a session token
// Once the JWT is issued and stored in the browser as a cookie, the user doesn’t need to manually log in again.

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //  1> Check If Email and password exist
  if (!email && !password) {
    return next(new appError('Pls provide Email and Password', 400));
  }
  if (!email) {
    return next(new appError('Pls provide Email', 400));
  }
  if (!password) {
    return next(new appError('Pls provide Password', 400));
  }
  //  2> Check if user exixt and check if Password is correct
  const user = await User.findOne({ email });

  //A=> Agar koi user exist is nhi krta
  if (!user) {
    return next(new appError('User profile not found', 401));
  }

  //B=> check if password is correct or not
  const correct = await user.correctPassword(password, user.password);
  if (!correct) {
    return next(new appError('Incorrect password', 401));
  }
  //  3> All good? Send token to client
  CreateSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1> Get the token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new appError('You are not logged in', 401));
  }
  //2> Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  //3> Check if User sill exist
  const CurrentUser = await User.findById(decoded.id);
  if (!CurrentUser) {
    return next(new appError('The user to this Token no longer exist', 401));
  }
  //4> Check if User changed the Password after the JWT was issued
  if (CurrentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new appError('User recently changed Password, pls login again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = CurrentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1=> Get user Based on posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new appError('there is no user with this email', 404));
  }
  // 2=> generate random Token
  const resetToken = user.createPasswordToken();
  // 3=> send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your pass? submit a new patch req with new password and password confirm to :${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset Password Email',
      message,
    });
    res.status(200).json({
      status: 'sucess',
      Message: 'Token send to mail',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new appError('Try again Later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1> Get user Based on Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // passwordResetExpiry: { gt: Date.now() },
  });
  // 2> if token is not expired
  if (!user) {
    return next(new appError('Invaid/Expired Token', 400));
  }
  // 3> Set New Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
  // 4> Log the user in, send JWT
  CreateSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1> get the user
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new appError('User not found', 404));
  }
  // 2> check if current Password is correct
  const currentPassword = req.body.currentPassword;
  const isMatch = await user.correctPassword(currentPassword, user.password);
  if (!isMatch) {
    return next(new appError('Incorrect Passowrd', 401));
  }
  // 3> if so, Update Pass
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // if (user.password === currentPassword) {
  //   next(new appError('You are Writing Your Old Password Again', 401));
  // }
  await user.save();
  // 4> login use,send JWT
  CreateSendToken(user, 201, res);
});
