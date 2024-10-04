const appError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const APIfeatures = require('../utilities/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new appError('No document found ', 404));
    }
    // res.send('Item Deleted');
    res.status(204).json({
      status: 'successfully deleted',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //updated string vhi show hoga
      runValidators: true,
    });
    if (!doc) {
      return next(new appError('No document found ', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        tours: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'Success',
      data: {
        tour: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate('reviews');
    if (!doc) {
      return next(new appError('No Document found ', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow nested GET review on Tour (HACK)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .limitFleids()
      .pagination();
    const doc = await features.query;
    //Response
    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });
