'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      Like.belongsTo(models.Article, { 
        foreignKey: 'articleId', 
        as: 'article',
        onDelete: 'CASCADE' 
      });
    }
  }

  Like.init({
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Articles',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
    // Note: count field is removed - we count likes by counting rows
  }, {
    sequelize,
    modelName: 'Like',
    indexes: [
      {
        unique: true,
        fields: ['articleId', 'sessionId']
      }
    ]
  });

  return Like;
};