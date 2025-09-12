import { PrismaClient, MembershipRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'John Doe',
      password: hashedPassword,
    },
  });

  // Create an organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'A sample organization for development',
    },
  });

  // Create organization membership
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: MembershipRole.OWNER,
    },
  });

  // Create a sample server
  const server = await prisma.server.upsert({
    where: { id: 'sample-server-id' },
    update: {},
    create: {
      id: 'sample-server-id',
      name: 'Production Server',
      region: 'us-east-1',
      size: 't3.medium',
      status: 'ACTIVE',
      ipAddress: '192.168.1.100',
      organizationId: organization.id,
    },
  });

  // Create a sample application
  const application = await prisma.application.upsert({
    where: { id: 'sample-app-id' },
    update: {},
    create: {
      id: 'sample-app-id',
      name: 'My Web App',
      repository: 'https://github.com/user/repo',
      branch: 'main',
      status: 'ACTIVE',
      organizationId: organization.id,
      serverId: server.id,
    },
  });

  // Create a sample domain
  await prisma.domain.upsert({
    where: { domain: 'example.com' },
    update: {},
    create: {
      domain: 'example.com',
      status: 'ACTIVE',
      sslEnabled: true,
      sslIssuedAt: new Date(),
      sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      organizationId: organization.id,
      applicationId: application.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📧 Test user: owner@example.com / password123');
  console.log('🏢 Test organization: Acme Corp (acme-corp)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });