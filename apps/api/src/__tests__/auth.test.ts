import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from '../routes/auth';

describe('Auth Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify();
    app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('POST /auth/register - should create a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });

  test('POST /auth/login - should authenticate user', async () => {
    // First create a user
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123',
      },
    });

    // Then try to login
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'login@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });

  test('POST /auth/login - should reject invalid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});