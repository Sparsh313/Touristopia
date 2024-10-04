const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
const { promises } = require('nodemailer/lib/xoauth2');
//Creating a Schema******************************************************
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have some name'], //this field is required if not given, it will return a[1]
      unique: true, //name must be unique
      maxlength: [20, 'Name must have lengh < 20'],
      minlength: [5, 'Name must have length > 5'],
    },
    slug: String,
    difficulty: {
      type: String,
      required: [true, 'A Tour must have difficulty'],
    },
    duration: {
      type: String,
      required: [true, 'A Tour must have durations'],
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have price'],
    },
    discount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount must be less than  Price',
      },
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have grp size'],
    },
    ratingsAvg: {
      type: Number,
      default: 4.7,
      min: [1, 'Rating should be >= 1'],
      max: [5, 'Rating shpuld be <= 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have some Summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have some Cover image'],
    },
    images: [String], // We have many image hence putting img in array
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true } }
);

// //Indexing
tourSchema.index({ price: 1, ratingsAvg: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// //Virtuals
tourSchema.virtual('weeks').get(function () {
  return this.duration / 7;
});
// //Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// //  Document MiddleWare :pre: runs before .save() and.create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// //  Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordResetExpiry -passwordResetToken -password',
  });
  next();
});
// //Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //unshift is use to insert element at the start of array
//   console.log(this.pipeline());
//   next();
// });
// //Creating a model from this Schema**************************************
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
