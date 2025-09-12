import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const assignDomainSchema = z.object({
  domain: z.string().min(3),
  applicationId: z.string().optional(),
});

export async function domainRoutes(fastify: FastifyInstance) {
  // Get domains for organization
  fastify.get('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const domains = await prisma.domain.findMany({
        where: {
          organizationId: payload.orgId,
        },
        include: {
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

      return domains;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Assign domain (mock)
  fastify.post('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { domain, applicationId } = assignDomainSchema.parse(request.body);

      // Mock domain assignment - in real app, this would configure DNS
      const domainRecord = await prisma.domain.create({
        data: {
          domain,
          status: 'PENDING',
          organizationId: payload.orgId,
          applicationId,
        },
      });

      // Simulate DNS propagation after a delay
      setTimeout(async () => {
        await prisma.domain.update({
          where: { id: domainRecord.id },
          data: {
            status: 'ACTIVE',
          },
        });
      }, 2000);

      return domainRecord;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Delete domain
  fastify.delete('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      await prisma.domain.deleteMany({
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