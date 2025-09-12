import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const createServerSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  size: z.string().min(2),
});

export async function serverRoutes(fastify: FastifyInstance) {
  // Get servers for organization
  fastify.get('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const servers = await prisma.server.findMany({
        where: {
          organizationId: payload.orgId,
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return servers;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Create server (mock)
  fastify.post('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { name, region, size } = createServerSchema.parse(request.body);

      // Mock server creation - in real app, this would provision actual infrastructure
      const server = await prisma.server.create({
        data: {
          name,
          region,
          size,
          status: 'PROVISIONING',
          organizationId: payload.orgId,
        },
      });

      // Simulate provisioning completion after a delay
      setTimeout(async () => {
        await prisma.server.update({
          where: { id: server.id },
          data: {
            status: 'ACTIVE',
            ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          },
        });
      }, 3000);

      return server;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Get server details
  fastify.get('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      const server = await prisma.server.findFirst({
        where: {
          id,
          organizationId: payload.orgId,
        },
        include: {
          applications: true,
        },
      });

      if (!server) {
        return reply.status(404).send({ error: 'Server not found' });
      }

      return server;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Delete server
  fastify.delete('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      await prisma.server.deleteMany({
        where: {
          id,
          organizationId: payload.orgId,
        },
      });

      return { success: true };
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}