'use strict';

jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue(undefined),
  getAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }),
  getUserActivity: jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/models/User');
jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = {
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true,
    };
    next();
  },
  authorize: (..._roles) => (_req, _res, next) => next(),
}));

const request = require('supertest');
const { app } = require('../src/app');
const User = require('../src/models/User');

const mockUser = {
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'viewer',
  isActive: true,
  toJSON: jest.fn().mockReturnValue({
    _id: '64a1b2c3d4e5f6a7b8c9d0e1',
    email: 'user@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'viewer',
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/users', () => {
  it('should return paginated list of users', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockUser]),
    };
    User.find = jest.fn().mockReturnValue(mockQuery);
    User.countDocuments = jest.fn().mockResolvedValue(1);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.total).toBe(1);
  });
});

describe('GET /api/users/:id', () => {
  it('should return a user by ID', async () => {
    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    User.findById = jest.fn().mockReturnValue(mockQuery);

    const res = await request(app).get('/api/users/64a1b2c3d4e5f6a7b8c9d0e1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
  });

  it('should return 404 when user not found', async () => {
    const mockQuery = {
      select: jest.fn().mockResolvedValue(null),
    };
    User.findById = jest.fn().mockReturnValue(mockQuery);

    const res = await request(app).get('/api/users/64a1b2c3d4e5f6a7b8c9d0e1');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/users', () => {
  it('should create a new user and return 201', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create = jest.fn().mockResolvedValue(mockUser);

    const res = await request(app).post('/api/users').send({
      email: 'newuser@example.com',
      password: 'Password1@',
      firstName: 'New',
      lastName: 'User',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app).post('/api/users').send({
      email: 'not-an-email',
      password: 'Password1@',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/users/:id', () => {
  it('should update a user and return 200', async () => {
    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

    const res = await request(app).put('/api/users/64a1b2c3d4e5f6a7b8c9d0e1').send({
      firstName: 'Updated',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when user not found for update', async () => {
    const mockQuery = {
      select: jest.fn().mockResolvedValue(null),
    };
    User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

    const res = await request(app).put('/api/users/64a1b2c3d4e5f6a7b8c9d0e1').send({
      firstName: 'Updated',
    });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/users/:id', () => {
  it('should deactivate a user and return 200', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, isActive: false });

    const res = await request(app).delete('/api/users/64a1b2c3d4e5f6a7b8c9d0e1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User deactivated');
  });

  it('should return 404 when user to delete not found', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const res = await request(app).delete('/api/users/64a1b2c3d4e5f6a7b8c9d0e1');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
