'use strict';

const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, validateLoginBody, validateRegisterBody } = require('../middleware/validation');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login({
      ...req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id, req.body.refreshToken);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(
      req.user._id,
      req.body.oldPassword,
      req.body.newPassword
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const enableTwoFactor = async (req, res, next) => {
  try {
    const result = await authService.enableTwoFactor(req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verifyTwoFactor = async (req, res, next) => {
  try {
    const result = await authService.verifyTwoFactor(req.user._id, req.body.token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

router.post('/register', validateRegisterBody, validate, register);
router.post('/login', validateLoginBody, validate, login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/2fa/enable', authenticate, enableTwoFactor);
router.post('/2fa/verify', authenticate, verifyTwoFactor);

module.exports = router;
