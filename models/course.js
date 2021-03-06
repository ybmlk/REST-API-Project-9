'use strict';

const Sequelize = require('sequelize');

module.exports = sequelize => {
  class Course extends Sequelize.Model {}
  Course.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: '"title" is required',
          },
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: '"description" is required',
          },
        },
      },
      estimatedTime: {
        type: Sequelize.STRING,
      },
      materialsNeeded: {
        type: Sequelize.STRING,
      },
    },
    { sequelize }
  );

  // A 'course' can be associated with only one 'user'
  Course.associate = model => {
    Course.belongsTo(model.User, {
      as: 'user',
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
  };

  return Course;
};
