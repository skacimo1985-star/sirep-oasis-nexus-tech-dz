'use strict';

const User = require('../models/User');
const { verifyAccessToken } = require('../config/jwt');
const { AppError } = require('./errorHandler');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No authentication token provided', 401));
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.id || decoded.userId;
    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      return next(new AppError('User not found or inactive', 401));
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(new AppError(err.message || 'Authentication failed', 401));
  }
};

const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
};

module.exports = { authenticate, authorize };
