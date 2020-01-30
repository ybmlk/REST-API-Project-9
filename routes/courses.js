const express = require('express');
const router = express.Router();
const { Course } = require('../models');

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

/* GET courses list */
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll();
    res.json(courses);
  })
);

module.exports = router;
