'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      Article.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
      Article.hasMany(models.Comment, { 
        foreignKey: 'articleId', 
        as: 'comments',
        onDelete: 'CASCADE' 
      });
      Article.hasMany(models.Like, { 
        foreignKey: 'articleId', 
        as: 'likes',
        onDelete: 'CASCADE' 
      });
    }
  }

  Article.init({
    title: DataTypes.STRING,
    body: DataTypes.TEXT,
    tags: DataTypes.STRING,
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    published_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    commentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Article',
  });

  return Article;
};