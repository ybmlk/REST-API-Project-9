const express = require('express');
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

/* GET courses list */
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll({
      include: [{ model: User, as: 'user' }],
    });
    res.json(courses);
  })
);

/* GET an individual course */
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user' }],
    });
    res.json(courses);
  })
);

module.exports = router;
