# Full-Stack Platform Monorepo

A production-ready monorepo featuring Next.js 14, Fastify API, multi-tenant architecture, authentication, and billing integration.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Fastify API with TypeScript, modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials and OAuth (Google)
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query
- **Payments**: Stripe integration (test mode)
- **Testing**: Vitest (backend) + Playwright (frontend)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Stripe account (for billing features)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/platform_db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # For webhook testing

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker Compose
cd infra
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for database to be ready, then continue with setup
```

#### Option B: Local PostgreSQL

Install PostgreSQL locally and create a database named `platform_db`.

### 4. Database Migration & Seeding

```bash
# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Seed with sample data
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and API servers
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## 🧪 Testing

### Backend Tests (Vitest)

```bash
pnpm --filter api test
```

### Frontend Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
pnpm --filter portal exec playwright install

# Run tests
pnpm --filter portal test
```

## 📝 Sample Data

After running the seed command, you can use these credentials:

- **Email**: owner@example.com
- **Password**: password123
- **Organization**: Acme Corp

## 🏢 Multi-Tenant Architecture

The platform supports multiple organizations with role-based access:

- **Owner**: Full access to organization settings and billing
- **Admin**: Manage resources and team members
- **Member**: Basic access to organization resources

All API endpoints are scoped by organization ID, ensuring data isolation.

## 💳 Billing Integration

Stripe integration includes:

- **Checkout Sessions**: Create payment flows
- **Customer Portal**: Manage subscriptions and billing
- **Webhooks**: Handle payment events
- **Test Mode**: Safe for development

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the dashboard
3. Configure webhook endpoints for local development using Stripe CLI

## 🛠️ Available Scripts

- `pnpm dev` - Start development servers (frontend + API)
- `pnpm build` - Build all applications for production
- `pnpm test` - Run all tests
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push database schema changes
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio (database GUI)

## 📁 Project Structure

```
/
├── apps/
│   ├── portal/          # Next.js frontend application
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utility functions and stores
│   └── api/             # Fastify API server
│       ├── src/
│       │   ├── routes/  # API route handlers
│       │   ├── lib/     # Shared utilities
│       │   └── __tests__/ # Test files
│       └── prisma/      # Database schema and migrations
├── packages/
│   └── ui/              # Shared UI components (future)
├── infra/
│   └── docker-compose.dev.yml # Development infrastructure
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details

### Resources (Scoped by Organization)
- `GET|POST /api/servers` - Manage servers
- `GET|POST /api/apps` - Manage applications
- `GET|POST /api/domains` - Manage domains
- `POST /api/ssl` - Issue SSL certificates
- `POST /api/backups/run` - Run backups

### Billing
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create customer portal session
- `GET /api/billing/subscription` - Get subscription info

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Organization-scoped data access
- CORS protection
- Helmet.js security headers
- Input validation with Zod schemas

## 🚀 Deployment

The application is configured for easy deployment:

- **Frontend**: Can be deployed to Vercel, Netlify, or any static hosting
- **API**: Can be deployed to Railway, Render, or any Node.js hosting
- **Database**: Use managed PostgreSQL (Supabase, PlanetScale, etc.)

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://www.fastify.io/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Stripe Documentation](https://stripe.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.