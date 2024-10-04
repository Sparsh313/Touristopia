const express = require('express');
const ReviewController = require('../controller/ReviewController');
const AuthController = require('../controller/AuthController');
const router = express.Router({ mergeParams: true }); //mergeParams to merge toudId from tourRoutes

router.use(AuthController.protect);

router
  .route('/')
  .get(AuthController.protect, ReviewController.getAllReviews)
  .post(
    AuthController.restrictTo('user'),
    ReviewController.setUserId,
    ReviewController.createReview
  );

router
  .route('/:id')
  .get(ReviewController.getReview)
  .patch(
    AuthController.restrictTo('user', 'admin'),
    ReviewController.updateReview
  )
  .delete(
    AuthController.restrictTo('user', 'admin'),
    ReviewController.deleteReview
  );

module.exports = router;
