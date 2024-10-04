const express = require('express');
const tourController = require('../controller/tourController');
// const ReviewController = require('./../controller/ReviewController');
const authController = require('../controller/AuthController');
const router = express.Router();
const reviewRouter = require('./reviewRoute');

// POST /tour/ (tour_id)/reviews
// GET  /tour/ (tour_id)/reviews

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-tours')
  .get(tourController.aliase, tourController.getAllTours);

router
  .route('/tour-within/:distance/center/:coordinates/unit/:unit')
  .get(tourController.getToursWithin);

router
  .route('/distances/:coordinates/unit/:unit')
  .get(tourController.getTourDistance);

router.route('/stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
