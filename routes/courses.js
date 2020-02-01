const express = require('express');
const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const { Course, User } = require('../models');

/* Handler function to wrap each function */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      res.status(500).send(error);
    }
  };
}

/* Authentication middleware */
const authenticateUser = async (req, res, next) => {
  let message = null;
  const credentials = auth(req);
  // If email and password is provided...
  if (credentials) {
    const user = await User.findOne({
      where: { emailAddress: credentials.name },
    });
    // If the email provided is found in the database...
    if (user) {
      const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
      // If the password provided is a match...
      if (authenticated) {
        console.log(`Authentication successful for email: ${user.emailAddress}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for email: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for email: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
};

/* GET courses list */
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
        },
      ],
    });
    res.json(courses);
  })
);

/* GET an individual course */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const course = await Course.findAll({
      where: { id: req.params.id },
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
        },
      ],
    });
    course.length ? res.json(course) : res.status(404).json({ message: 'Course Not Found!' });
  })
);

/* Create courses */
router.post(
  '/',
  authenticateUser,
  [
    check('title')
      .exists()
      .withMessage('"title" is required'),
    check('description')
      .exists()
      .withMessage('"description" is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Iterate through the errors and get the error messages.
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      const course = await req.body;
      // the 'userId' for the course comes from currently authenticated user
      course.userId = req.currentUser.id;
      Course.create(course);
      res.setHeader('Location', `/api/course/${course.id}`);
      res.status(201).end();
    }
  })
);

/* Update Courses */
router.put(
  '/:id',
  authenticateUser,
  [
    check('title')
      .exists()
      .withMessage('"title" is required'),
    check('description')
      .exists()
      .withMessage('"description" is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Iterate through the errors and get the error messages.
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      // retrieve the course
      const courseList = await Course.findAll({
        where: { id: req.params.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
          },
        ],
      });
      const course = courseList[0];

      // if the course exist...
      if (course) {
        // if the course belongs to the current user ...
        if (course.userId === req.currentUser.id) {
          await course.update(req.body);
          res.setHeader('Location', `/api/course/${course.id}`);
          res.status(204).end();
        } else {
          res.status(403).json({
            message: 'You can only update your own courses.',
            currentUser: req.currentUser.emailAddress,
          });
        }
      } else {
        res.status(404).json({ message: 'Course Not Found!' });
      }
    }
  })
);

/* Delete Courses */
router.delete(
  '/:id',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Iterate through the errors and get the error messages.
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      // retrieve the course
      const courseList = await Course.findAll({
        where: { id: req.params.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
          },
        ],
      });
      const course = courseList[0];

      // if the course exist...
      if (course) {
        // if the course belongs to the current user ...
        if (course.userId === req.currentUser.id) {
          await course.destroy();
          res.status(204).end();
        } else {
          res.status(403).json({
            message: 'You can only delete your own courses.',
            currentUser: req.currentUser.emailAddress,
          });
        }
      } else {
        res.status(404).json({ message: 'Course Not Found!' });
      }
    }
  })
);

module.exports = router;
