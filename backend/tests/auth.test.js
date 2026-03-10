'use strict';

jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue(undefined),
  getAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }),
  getUserActivity: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/models/User');
jest.mock('../src/config/jwt');

const request = require('supertest');
const { app } = require('../src/app');
const { AppError } = require('../src/middleware/errorHandler');
const User = require('../src/models/User');
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../src/config/jwt');

const mockUser = {
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin',
  isActive: true,
  refreshTokens: [],
  loginAttempts: 0,
  lockUntil: null,
  twoFactorEnabled: false,
  comparePassword: jest.fn(),
  isLocked: jest.fn().mockReturnValue(false),
  incrementLoginAttempts: jest.fn().mockResolvedValue(undefined),
  save: jest.fn().mockResolvedValue(undefined),
  toJSON: jest.fn().mockReturnValue({
    _id: '64a1b2c3d4e5f6a7b8c9d0e1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  signAccessToken.mockReturnValue('mock-access-token');
  signRefreshToken.mockReturnValue('mock-refresh-token');
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password1@',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 when email already exists', async () => {
    User.findOne.mockResolvedValue(mockUser);
    User.create.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password1@',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('should login successfully and return 200', async () => {
    const userWithPassword = {
      ...mockUser,
      password: 'hashed-password',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findByEmail = jest.fn().mockResolvedValue(userWithPassword);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password1@',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 for invalid credentials', async () => {
    const userWithPassword = {
      ...mockUser,
      password: 'hashed-password',
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    User.findByEmail = jest.fn().mockResolvedValue(userWithPassword);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPassword1@',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: 'Password1@',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user when authenticated', async () => {
    verifyAccessToken.mockReturnValue({ id: mockUser._id, role: mockUser.role });
    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer mock-access-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should return new tokens with a valid refresh token', async () => {
    const userWithToken = {
      ...mockUser,
      refreshTokens: [{ token: 'valid-refresh-token', expiresAt: new Date(Date.now() + 86400000) }],
    };
    verifyRefreshToken.mockReturnValue({ id: mockUser._id });
    User.findOne = jest.fn().mockResolvedValue(userWithToken);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 with an invalid refresh token', async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new AppError('Invalid or expired refresh token', 401);
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully when authenticated', async () => {
    verifyAccessToken.mockReturnValue({ id: mockUser._id, role: mockUser.role });
    User.findOne = jest.fn().mockResolvedValue(mockUser);
    User.findById = jest.fn().mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer mock-access-token')
      .send({ refreshToken: 'mock-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'token' });

    expect(res.status).toBe(401);
  });
});
