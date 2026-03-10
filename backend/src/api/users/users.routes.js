'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { validate, validateObjectId, validateRegisterBody, validateUpdateUserBody } = require('../../middleware/validation');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, activateUser, getUserAuditLogs } = require('./users.controller');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getAllUsers);
router.get('/:id', validateObjectId, validate, getUserById);
router.post('/', validateRegisterBody, validate, createUser);
router.put('/:id', validateObjectId, validateUpdateUserBody, validate, updateUser);
router.delete('/:id', validateObjectId, validate, deleteUser);
router.patch('/:id/activate', validateObjectId, validate, activateUser);
router.get('/:id/audit-logs', validateObjectId, validate, getUserAuditLogs);

module.exports = router;
