'use strict';

const express = require('express');
const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator');
const { User } = require('../models');

const router = express.Router();

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

/* GET currently authenticated user */
router.get(
  '/',
  authenticateUser,
  asyncHandler(async (req, res, next) => {
    const user = req.currentUser;
    res.json({
      name: `${user.firstName} ${user.lastName}`,
      emailAddress: user.emailAddress,
    });
  })
);

/* Create users. */
router.post(
  '/',
  [
    check('firstName')
      .exists()
      .withMessage('"firstName" is required')
      .notEmpty()
      .withMessage('Please enter a "firstName"'),
    check('lastName')
      .exists()
      .withMessage('"lastName" is required')
      .notEmpty()
      .withMessage('Please enter a "lastName"'),
    check('emailAddress')
      .exists()
      .withMessage('"emailAddress" is required')
      .isEmail()
      .withMessage('Please Provide a valid "emailAddress"'),
    check('password')
      .exists()
      .withMessage('"password" is required')
      .isLength({ min: 8, max: 20 })
      .withMessage('"password" should be between 8 - 20 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Iterate through the errors and get the error messages.
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      // Make sure the input email doesn't match an existing email address
      const existingUser = await User.findAll({
        where: {
          emailAddress: { [Op.like]: req.body.emailAddress },
        },
      });
      // If the email provided is new...
      if (existingUser.length < 1) {
        const user = await req.body;
        user.password = bcryptjs.hashSync(user.password);
        User.create(user);
        res.setHeader('Location', '/');
        res.status(201).end();
      } else {
        res.status(400).json({ message: 'User already exists' });
      }
    }
  })
);

module.exports = router;
