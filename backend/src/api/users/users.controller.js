'use strict';

const User = require('../../models/User');
const auditService = require('../../services/audit.service');
const { AppError } = require('../../middleware/errorHandler');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      throw new AppError('Email already exists', 409);
    }
    const user = await User.create(req.body);
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.CREATE,
      resource: 'user',
      resourceId: user._id,
      details: { email: user.email },
    });
    res.status(201).json({ success: true, data: { user: user.toJSON() } });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user',
      resourceId: user._id,
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.DELETE,
      resource: 'user',
      resourceId: req.params.id,
    });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'user',
      resourceId: req.params.id,
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const getUserAuditLogs = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const logs = await auditService.getUserActivity(req.params.id, Number(limit));
    res.json({ success: true, data: { logs } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, activateUser, getUserAuditLogs };
