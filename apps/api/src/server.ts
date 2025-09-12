import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';

import { authRoutes } from './routes/auth';
import { organizationRoutes } from './routes/organizations';
import { serverRoutes } from './routes/servers';
import { applicationRoutes } from './routes/applications';
import { domainRoutes } from './routes/domains';
import { backupRoutes } from './routes/backups';
import { billingRoutes } from './routes/billing';

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(helmet);
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(organizationRoutes, { prefix: '/api/organizations' });
fastify.register(serverRoutes, { prefix: '/api/servers' });
fastify.register(applicationRoutes, { prefix: '/api/apps' });
fastify.register(domainRoutes, { prefix: '/api/domains' });
fastify.register(backupRoutes, { prefix: '/api/backups' });
fastify.register(billingRoutes, { prefix: '/api/billing' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();