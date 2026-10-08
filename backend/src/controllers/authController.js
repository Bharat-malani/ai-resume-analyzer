const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required.' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }

      const existingUser = await db.users.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Auto-assign ADMIN role to admin email or if it's the very first user
      const usersList = await db.users.listAll();
      const role = (usersList.length === 0 || email.toLowerCase().includes('admin')) ? 'ADMIN' : 'USER';

      const user = await db.users.create({
        name: name.trim(),
        email: email.trim(),
        password_hash,
        role
      });

      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = await db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      };

      const token = generateToken(safeUser);

      res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    res.json({
      success: true,
      user: req.user
    });
  }
};

module.exports = authController;
