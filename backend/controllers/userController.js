const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');
const MonitoringService = require('../services/monitoringService');
const { trackUserAction, trackError } = require('../middleware/monitoringHooks');

const JWT_SECRET = process.env.JWT_SECRET;

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Log registration attempt
    logger.info({
      type: 'registration_attempt',
      email,
      ip: req.ip
    });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn({
        type: 'registration_failed',
        email,
        reason: 'email_already_exists',
        ip: req.ip
      });
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      role: 'author'
    });

    // Track successful registration
    logger.info({
      type: 'registration_success',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    MonitoringService.trackUser(req, 'register', user);
    trackUserAction(req, 'user_registered', { userId: user.id, email: user.email });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'registration_error',
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log login attempt
    logger.info({
      type: 'login_attempt',
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn({
        type: 'login_failed',
        email,
        reason: 'user_not_found',
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn({
        type: 'login_failed',
        email,
        reason: 'invalid_password',
        userId: user.id,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Track successful login
    logger.info({
      type: 'login_success',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    MonitoringService.trackUser(req, 'login', user);
    trackUserAction(req, 'user_login', { userId: user.id, email: user.email });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'login_error',
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all authors
exports.getAuthors = async (req, res) => {
  try {
    const startTime = Date.now();

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
    });

    const duration = Date.now() - startTime;

    // Log database query performance
    logger.debug({
      type: 'database_query',
      operation: 'findAll',
      model: 'User',
      duration: `${duration}ms`,
      resultCount: users.length
    });

    // Track view action
    trackUserAction(req, 'view_authors', { count: users.length });

    res.status(200).json(users);
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_authors_error',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single author by ID
exports.getAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role'],
    });

    const duration = Date.now() - startTime;

    // Log database query performance
    logger.debug({
      type: 'database_query',
      operation: 'findByPk',
      model: 'User',
      authorId: id,
      duration: `${duration}ms`,
      found: !!user
    });

    if (!user) {
      logger.warn({
        type: 'author_not_found',
        authorId: id,
        userId: req.user?.userId
      });
      return res.status(404).json({ error: 'Author not found' });
    }

    // Track view action
    trackUserAction(req, 'view_author', { authorId: id, authorName: user.name });

    res.status(200).json(user);
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_author_error',
      error: error.message,
      stack: error.stack,
      authorId: req.params.id
    });
    res.status(500).json({ error: 'Server error' });
  }
};