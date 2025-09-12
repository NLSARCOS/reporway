import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user || !user.password) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // For simplicity, use the first organization if available
      const membership = user.memberships[0];
      
      const token = jwt.sign(
        {
          userId: user.id,
          orgId: membership?.organizationId || null,
          role: membership?.role || 'MEMBER',
        },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organizations: user.memberships.map(m => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
        })),
        token,
      };
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body);

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = jwt.sign(
        {
          userId: user.id,
          orgId: null,
          role: 'MEMBER',
        },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organizations: [],
        token,
      };
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Get current user
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organizations: user.memberships.map(m => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
        })),
      };
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}