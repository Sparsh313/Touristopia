const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { deflate } = require('zlib');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pls write your name'],
    maxlength: [20, 'Name must have lengh < 20'],
    minlength: [1, 'Name must have length > 1'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'pls provide your email to proceed'],
    lowercase: true,
    validate: [validator.isEmail, 'pls write correct email to proceed'], //to check wheather email is coorect or not
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'pls provide Password to proceed'],
    minlength: [8],
    // select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'pls confirm ur Password'],
    validate: {
      validator: function (el) {
        const confirm = el === this.password;
        return confirm;
      },
      message: 'Passwords are not same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpiry: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// HASHING PAASWORD
userSchema.pre('save', async function (next) {
  //Runs only if pass is modified
  if (!this.isModified('password')) return next();
  //Hash the Password
  this.password = await bcrypt.hash(this.password, 10);
  //Delete Pass Confrm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  UserPassword
) {
  return await bcrypt.compare(candidatePassword, UserPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(JWTTimestamp, changedTimeStamp);
    return JWTTimestamp < changedTimeStamp;
  }

  //FALSE means Not Changed
  return false;
};

userSchema.methods.createPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000;
  // this.passwordResetExpiry = Date.now() + 10 * 60 * 1000 + 5.5 * 60 * 60 * 1000; // IST

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
