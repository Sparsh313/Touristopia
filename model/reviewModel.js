// Review /ratings / createdAt / ref to tour / ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    ratings: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating field can be be left empty'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour '],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user '],
    },
  },
  { toJSON: { virtuals: true } }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// // Query Middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-passwordResetExpiry -passwordResetToken -password -__v',
  });
  next();
});
reviewSchema.statics.calcRatingAvg = async function (TourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: TourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$ratings' },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(TourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAvg: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(TourId, {
      ratingsQuantity: 0,
      ratingsAvg: 0,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcRatingAvg(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcRatingAvg(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
