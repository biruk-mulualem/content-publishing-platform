// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { trackUserAction } = require('../middleware/monitoringHooks');

const JWT_SECRET = process.env.JWT_SECRET;

// ============================================================================
// USER REGISTRATION
// ============================================================================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // ✅ Track failed registration (security event)
      trackUserAction(req, 'registration_failed', { 
        email, 
        reason: 'email_exists' 
      });
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      role: 'author'
    });

    // ✅ Track successful registration (important business event)
    trackUserAction(req, 'registration_success', { 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// USER LOGIN
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // ✅ Track failed login (security event)
      trackUserAction(req, 'login_failed', { 
        email, 
        reason: 'user_not_found' 
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // ✅ Track failed login (security event)
      trackUserAction(req, 'login_failed', { 
        email, 
        reason: 'invalid_password',
        userId: user.id 
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Track successful login (important business event)
    trackUserAction(req, 'login_success', { 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

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
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// GET ALL AUTHORS
// ============================================================================
exports.getAuthors = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
    });

    // ✅ Track that user viewed authors list
    trackUserAction(req, 'view_authors', { count: users.length });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// GET SINGLE AUTHOR BY ID
// ============================================================================
exports.getAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // ✅ Track that user viewed a specific author
    trackUserAction(req, 'view_author', { 
      authorId: id, 
      authorName: user.name 
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// USER LOGOUT
// ============================================================================
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    // ✅ Track logout
    if (userId) {
      trackUserAction(req, 'logout', { 
        userId, 
        email: userEmail 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Logout failed'
    });
  }
};