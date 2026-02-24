// backend/validators/schemas.js
const Joi = require('joi');

// ==================== USER SCHEMAS ====================
const userSchemas = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must be less than 50 characters',
        'any.required': 'Name is required'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password is too long',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      })
  }),

  userId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be a positive number',
        'any.required': 'User ID is required'
      })
  })
};

// ==================== ARTICLE SCHEMAS ====================
const articleSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title must be less than 200 characters',
        'any.required': 'Title is required'
      }),
    
    body: Joi.string()
      .min(10)
      .required()
      .messages({
        'string.empty': 'Content is required',
        'string.min': 'Content must be at least 10 characters long',
        'any.required': 'Content is required'
      }),
    
    tags: Joi.string()
      .allow('')
      .optional()
      .custom((value, helpers) => {
        if (!value || value.trim() === '') return value;
        
        const tags = value.split(',').map(t => t.trim()).filter(t => t !== '');
        
        if (tags.length > 10) {
          return helpers.error('any.invalid', { message: 'Maximum 10 tags allowed' });
        }
        
        for (const tag of tags) {
          if (tag.length < 2) {
            return helpers.error('any.invalid', { message: 'Each tag must be at least 2 characters' });
          }
          if (tag.length > 30) {
            return helpers.error('any.invalid', { message: 'Each tag must be less than 30 characters' });
          }
          if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
            return helpers.error('any.invalid', { message: 'Tags can only contain letters, numbers, and hyphens' });
          }
        }
        
        const uniqueTags = new Set(tags);
        if (uniqueTags.size !== tags.length) {
          return helpers.error('any.invalid', { message: 'Duplicate tags are not allowed' });
        }
        
        return value;
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must be less than 200 characters'
      }),
    
    body: Joi.string()
      .min(10)
      .optional()
      .messages({
        'string.min': 'Content must be at least 10 characters'
      }),
    
    tags: Joi.string()
      .allow('')
      .optional()
      .custom((value, helpers) => {
        if (!value || value.trim() === '') return value;
        
        const tags = value.split(',').map(t => t.trim()).filter(t => t !== '');
        
        if (tags.length > 10) {
          return helpers.error('any.invalid', { message: 'Maximum 10 tags allowed' });
        }
        
        for (const tag of tags) {
          if (tag.length < 2) {
            return helpers.error('any.invalid', { message: 'Each tag must be at least 2 characters' });
          }
          if (tag.length > 30) {
            return helpers.error('any.invalid', { message: 'Each tag must be less than 30 characters' });
          }
          if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
            return helpers.error('any.invalid', { message: 'Tags can only contain letters, numbers, and hyphens' });
          }
        }
        
        const uniqueTags = new Set(tags);
        if (uniqueTags.size !== tags.length) {
          return helpers.error('any.invalid', { message: 'Duplicate tags are not allowed' });
        }
        
        return value;
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  articleId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Article ID must be a number',
        'number.integer': 'Article ID must be an integer',
        'number.positive': 'Article ID must be a positive number',
        'any.required': 'Article ID is required'
      })
  }),

  articleIdParam: Joi.object({
    articleId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Article ID must be a number',
        'number.integer': 'Article ID must be an integer',
        'number.positive': 'Article ID must be a positive number',
        'any.required': 'Article ID is required'
      })
  })
};

// ==================== COMMENT SCHEMAS ====================
const commentSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 100 characters',
        'any.required': 'Name is required'
      }),
    
    comment: Joi.string()
      .min(1)
      .max(2000)
      .required()
      .messages({
        'string.empty': 'Comment is required',
        'string.min': 'Comment must be at least 1 character',
        'string.max': 'Comment must be less than 2000 characters',
        'any.required': 'Comment is required'
      })
  }),

  commentId: Joi.object({
    commentId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Comment ID must be a number',
        'number.integer': 'Comment ID must be an integer',
        'number.positive': 'Comment ID must be a positive number',
        'any.required': 'Comment ID is required'
      })
  })
};

// ==================== LIKE SCHEMAS ====================
const likeSchemas = {
  articleId: Joi.object({
    articleId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Article ID must be a number',
        'number.integer': 'Article ID must be an integer',
        'number.positive': 'Article ID must be a positive number',
        'any.required': 'Article ID is required'
      })
  })
};

// ==================== ADMIN SCHEMAS ====================
const adminSchemas = {
  limit: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(5)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),

  days: Joi.object({
    days: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .optional()
      .default(7)
      .messages({
        'number.base': 'Days must be a number',
        'number.integer': 'Days must be an integer',
        'number.min': 'Days must be at least 1',
        'number.max': 'Days cannot exceed 30'
      })
  })
};

// ==================== QUERY SCHEMAS ====================
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),

  filter: Joi.object({
    tag: Joi.string().optional(),
    status: Joi.string().valid('published', 'draft').optional(),
    search: Joi.string().optional()
  })
};

// ==================== SESSION SCHEMAS ====================
const sessionSchemas = {
  sessionId: Joi.object({
    'x-session-id': Joi.string().optional()
  })
};

module.exports = {
  userSchemas,
  articleSchemas,
  commentSchemas,
  likeSchemas,
  adminSchemas,
  querySchemas,
  sessionSchemas
};