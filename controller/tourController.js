const appError = require('../utilities/appError');
const Tour = require('../model/tourModel');
const catchAsync = require('../utilities/catchAsync');
const factory = require('./handlerFactory');

exports.aliase = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'ratingsAvg,price';
  req.query.fields = 'name,price,ratingsAvg,difficulty';
  next();
};
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAvg: { $gte: 4 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAvg',
        // _id: {
        //   difficulty: { $toUpper: '$difficulty' },
        //   ratingsAvg: '$ratingsAvg',
        // },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAvg' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        tourNames: { $push: '$name' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year); // Corrected from req.param.years
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tour: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTours: -1 },
    },
  ]);
  res.status(200).json({
    length: plan.length,
    data: plan,
  });
});

// '/tour-within/:distance/center/    :coordinates    /unit/:unit'
//  /tour-within/   121   /center/26.744066, 83.422905/unit/ km

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, coordinates, unit } = req.params;
  const [lat, lng] = coordinates.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new appError('Pls provide latitude and longitude in the format', 400));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lat, lng], radius] } },
  });

  res.status(200).json({
    status: 'Sucess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getTourDistance = catchAsync(async (req, res, next) => {
  const { coordinates, unit } = req.params;
  const [lat, lng] = coordinates.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new appError('Pls provide latitude and longitude in the format', 400));
  }
  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Sucess',
    data: {
      data: distance,
    },
  });
});
