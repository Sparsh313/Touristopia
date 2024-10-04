const appError = require('../utilities/appError');
const User = require('../model/userModel');
const catchAsync = require('../utilities/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //Loop through each property(el) in input object(obj)
  for (const el in obj) {
    // If current property is allowed in fields
    if (allowedFields.includes(el))
      // Add this property to new obj
      newObj[el] = obj[el];
  }
  return newObj;
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    messgae: 'Pls use Sign Up option',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//Do not update Password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1> Create error if user change Password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new appError('This route is not for Password Update', 400));
  }
  // 2> filter unwanted field names that are not allowed to Updated
  const filtered = filterObj(req.body, 'name', 'email');
  // 3> update simple data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filtered, {
    new: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
