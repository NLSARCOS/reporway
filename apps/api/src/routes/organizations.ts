import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const createOrgSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
});

export async function organizationRoutes(fastify: FastifyInstance) {
  // Get user organizations
  fastify.get('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const memberships = await prisma.organizationMember.findMany({
        where: { userId: payload.userId },
        include: {
          organization: true,
        },
      });

      return memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        description: m.organization.description,
        role: m.role,
      }));
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Create organization
  fastify.post('/', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { name, slug, description } = createOrgSchema.parse(request.body);

      const organization = await prisma.organization.create({
        data: {
          name,
          slug,
          description,
          members: {
            create: {
              userId: payload.userId,
              role: 'OWNER',
            },
          },
        },
      });

      return organization;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // Get organization details
  fastify.get('/:id', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { id } = request.params as { id: string };

      const organization = await prisma.organization.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: payload.userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              servers: true,
              applications: true,
              domains: true,
            },
          },
        },
      });

      if (!organization) {
        return reply.status(404).send({ error: 'Organization not found' });
      }

      return organization;
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}