import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate } from '../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-06-20',
});

const createCheckoutSchema = z.object({
  priceId: z.string(),
});

export async function billingRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post('/checkout', async (request, reply) => {
    try {
      const payload = await authenticate(request);
      const { priceId } = createCheckoutSchema.parse(request.body);

      const organization = await prisma.organization.findUnique({
        where: { id: payload.orgId },
      });

      if (!organization) {
        return reply.status(404).send({ error: 'Organization not found' });
      }

      let customerId = organization.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: {
            organizationId: organization.id,
          },
        });

        customerId = customer.id;

        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            stripeCustomerId: customerId,
          },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
        metadata: {
          organizationId: organization.id,
        },
      });

      return { url: session.url };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to create checkout session' });
    }
  });

  // Create customer portal session
  fastify.post('/portal', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const organization = await prisma.organization.findUnique({
        where: { id: payload.orgId },
      });

      if (!organization?.stripeCustomerId) {
        return reply.status(404).send({ error: 'No billing account found' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
      });

      return { url: portalSession.url };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to create portal session' });
    }
  });

  // Get subscription info
  fastify.get('/subscription', async (request, reply) => {
    try {
      const payload = await authenticate(request);

      const organization = await prisma.organization.findUnique({
        where: { id: payload.orgId },
      });

      if (!organization?.stripeSubscriptionId) {
        return { subscription: null };
      }

      const subscription = await stripe.subscriptions.retrieve(
        organization.stripeSubscriptionId
      );

      return {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          plan: organization.stripeSubscriptionPlan,
        },
      };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to get subscription info' });
    }
  });

  // Webhook handler for Stripe events
  fastify.post('/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body as any, sig, endpointSecret!);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err);
      return reply.status(400).send(`Webhook Error`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(checkoutSession);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionPlan: subscription.items.data[0].price.nickname || 'Pro',
    },
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const organizationId = (customer as Stripe.Customer).metadata?.organizationId;
  
  if (!organizationId) return;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeSubscriptionId: subscription.status === 'active' ? subscription.id : null,
      stripeSubscriptionPlan: subscription.status === 'active' 
        ? subscription.items.data[0].price.nickname || 'Pro'
        : null,
    },
  });
}