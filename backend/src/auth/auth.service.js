'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const auditService = require('../services/audit.service');
const { AppError } = require('../middleware/errorHandler');
const { AUDIT_ACTIONS } = require('../utils/constants');

const register = async ({ email, password, firstName, lastName, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }
  const user = await User.create({ email, password, firstName, lastName, ...(role && { role }) });
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });
  user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  await auditService.log({ userId: user._id, action: AUDIT_ACTIONS.REGISTER, resource: 'auth', details: { email } });
  return { user: user.toJSON(), accessToken, refreshToken };
};

const login = async ({ email, password, ip, userAgent }) => {
  const user = await User.findByEmail(email);
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.isLocked()) {
    throw new AppError('Account locked. Try again later.', 423);
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    await auditService.log({ userId: user._id, action: AUDIT_ACTIONS.FAILED_LOGIN, resource: 'auth', details: { ip } });
    throw new AppError('Invalid credentials', 401);
  }
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });
  user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  await auditService.log({ userId: user._id, action: AUDIT_ACTIONS.LOGIN, resource: 'auth', details: { ip, userAgent } });
  return { user: user.toJSON(), accessToken, refreshToken };
};

const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
    await user.save();
    await auditService.log({ userId, action: AUDIT_ACTIONS.LOGOUT, resource: 'auth', details: {} });
  }
};

const refreshTokens = async (oldRefreshToken) => {
  const decoded = verifyRefreshToken(oldRefreshToken);
  const user = await User.findOne({ _id: decoded.id, 'refreshTokens.token': oldRefreshToken });
  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== oldRefreshToken);
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user._id });
  user.refreshTokens.push({ token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  await auditService.log({ userId: user._id, action: AUDIT_ACTIONS.TOKEN_REFRESH, resource: 'auth', details: {} });
  return { accessToken, refreshToken: newRefreshToken };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError('Current password incorrect', 403);
  }
  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();
  await auditService.log({ userId, action: AUDIT_ACTIONS.PASSWORD_CHANGE, resource: 'auth', details: {} });
  return { success: true };
};

const enableTwoFactor = async (userId) => {
  const secret = crypto.randomBytes(16).toString('hex');
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.twoFactorSecret = secret;
  await user.save();
  return { secret, otpAuthUrl: `otpauth://totp/SirepNexus:${user.email}?secret=${secret}` };
};

const verifyTwoFactor = async (userId, token) => {
  const user = await User.findById(userId).select('+twoFactorSecret');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (token !== user.twoFactorSecret) {
    throw new AppError('Invalid 2FA token', 401);
  }
  user.twoFactorEnabled = true;
  await user.save();
  return { success: true, message: '2FA enabled successfully' };
};

module.exports = { register, login, logout, refreshTokens, changePassword, enableTwoFactor, verifyTwoFactor };
