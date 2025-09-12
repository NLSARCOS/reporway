import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const createBackupSchema = z.object({
  name: z.string().optional(),
  serverId: z.string().optional(),
  applicationId: z.string().optional(),
});

export async function backupRoutes(fastify: FastifyInstance) {
  // Get backups for organization
  fastify.get('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const backups = await prisma.backup.findMany({
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
          application: {
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

      return backups;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Run backup (mock)
  fastify.post('/run', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { name, serverId, applicationId } = createBackupSchema.parse(request.body);

      // Mock backup creation
      const backup = await prisma.backup.create({
        data: {
          name: name || `Backup ${new Date().toISOString()}`,
          status: 'RUNNING',
          organizationId: payload.orgId,
          serverId,
          applicationId,
        },
      });

      // Simulate backup completion after a delay
      setTimeout(async () => {
        await prisma.backup.update({
          where: { id: backup.id },
          data: {
            status: 'COMPLETED',
            size: Math.floor(Math.random() * 1000000000), // Random size in bytes
            location: `s3://backups/${backup.id}.tar.gz`,
          },
        });
      }, 10000);

      return backup;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Delete backup
  fastify.delete('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      await prisma.backup.deleteMany({
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