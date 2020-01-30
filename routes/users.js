const express = require('express');
const router = express.Router();
const { User } = require('../models');

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

/* GET all users  */
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const users = await User.findAll();
    res.json(users);
  })
);

module.exports = router;
