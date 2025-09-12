import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const createAppSchema = z.object({
  name: z.string().min(2),
  repository: z.string().url().optional(),
  branch: z.string().optional(),
  serverId: z.string().optional(),
});

export async function applicationRoutes(fastify: FastifyInstance) {
  // Get applications for organization
  fastify.get('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const applications = await prisma.application.findMany({
        where: {
          organizationId: payload.orgId,
        },
        include: {
          server: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return applications;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Create application (mock)
  fastify.post('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { name, repository, branch, serverId } = createAppSchema.parse(request.body);

      // Mock application creation - in real app, this would deploy actual code
      const application = await prisma.application.create({
        data: {
          name,
          repository,
          branch: branch || 'main',
          status: 'DEPLOYING',
          organizationId: payload.orgId,
          serverId,
        },
      });

      // Simulate deployment completion after a delay
      setTimeout(async () => {
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: 'ACTIVE',
          },
        });
      }, 5000);

      return application;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Get application details
  fastify.get('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      const application = await prisma.application.findFirst({
        where: {
          id,
          organizationId: payload.orgId,
        },
        include: {
          server: true,
          domains: true,
        },
      });

      if (!application) {
        return reply.status(404).send({ error: 'Application not found' });
      }

      return application;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Delete application
  fastify.delete('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      await prisma.application.deleteMany({
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