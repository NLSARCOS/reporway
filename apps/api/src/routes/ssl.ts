import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const issueSslSchema = z.object({
  domainId: z.string(),
});

export async function sslRoutes(fastify: FastifyInstance) {
  // Issue SSL certificate (mock)
  fastify.post('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { domainId } = issueSslSchema.parse(request.body);

      const domain = await prisma.domain.findFirst({
        where: {
          id: domainId,
          organizationId: payload.orgId,
        },
      });

      if (!domain) {
        return reply.status(404).send({ error: 'Domain not found' });
      }

      // Mock SSL certificate issuance
      const updatedDomain = await prisma.domain.update({
        where: { id: domainId },
        data: {
          sslEnabled: true,
          sslIssuedAt: new Date(),
          sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });

      return updatedDomain;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Renew SSL certificate (mock)
  fastify.post('/renew/:domainId', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { domainId } = request.params as { domainId: string };

      const domain = await prisma.domain.findFirst({
        where: {
          id: domainId,
          organizationId: payload.orgId,
        },
      });

      if (!domain) {
        return reply.status(404).send({ error: 'Domain not found' });
      }

      // Mock SSL certificate renewal
      const updatedDomain = await prisma.domain.update({
        where: { id: domainId },
        data: {
          sslIssuedAt: new Date(),
          sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });

      return updatedDomain;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });
}