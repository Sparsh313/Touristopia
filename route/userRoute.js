const express = require('express');
const userController = require('../controller/userController');
const authController = require('../controller/AuthController');
const router = express.Router();

router.post('/signin', authController.signIn);
router.post('/signup', authController.signup);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protecting all routes
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/Me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Restrcting All Routes
router.use(authController.restrictTo('admin'));

router
  .route('')
  .get(authController.protect, userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;
