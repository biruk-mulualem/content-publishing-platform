'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // A User has many Articles
      User.hasMany(models.Article, { foreignKey: 'authorId' });
    }
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM('author', 'admin'),
      defaultValue: 'author',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};