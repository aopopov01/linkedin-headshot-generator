const Stripe = require('stripe');
const logger = require('../config/logger');
const db = require('../config/database');

class PaymentService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Product configurations
    this.products = {
      basic: {
        id: 'headshot_basic',
        name: 'Basic Headshot Package',
        price: 4.99,
        credits: 5,
        description: '5 professional headshots with 1 style'
      },
      premium: {
        id: 'headshot_premium', 
        name: 'Premium Headshot Package',
        price: 7.99,
        credits: 10,
        description: '10 professional headshots with 3 styles'
      },
      professional: {
        id: 'headshot_professional',
        name: 'Professional Headshot Package', 
        price: 14.99,
        credits: 25,
        description: '25 professional headshots with all 5 styles'
      },
      subscription_monthly: {
        id: 'headshot_unlimited_monthly',
        name: 'Unlimited Monthly',
        price: 9.99,
        type: 'subscription',
        interval: 'month',
        description: 'Unlimited headshots per month'
      },
      subscription_yearly: {
        id: 'headshot_unlimited_yearly',
        name: 'Unlimited Yearly',
        price: 79.99,
        type: 'subscription', 
        interval: 'year',
        description: 'Unlimited headshots per year (save 33%)'
      }
    };
  }

  async initialize() {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY not configured');
      }

      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: false
      });

      // Verify connection
      await this.stripe.charges.list({ limit: 1 });
      logger.info('Stripe payment service initialized');
      
      return true;
    } catch (error) {
      logger.error('Payment service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for one-time purchase
   */
  async createPaymentIntent(userId, productId, metadata = {}) {
    try {
      const product = this.products[productId];
      if (!product) {
        throw new Error(`Invalid product ID: ${productId}`);
      }

      const amount = Math.round(product.price * 100); // Convert to cents

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
          productId,
          credits: product.credits?.toString() || '0',
          ...metadata
        }
      });

      // Record payment attempt
      await this.recordPaymentAttempt(userId, productId, paymentIntent.id, amount);

      logger.info('Payment intent created:', {
        userId,
        productId,
        amount,
        paymentIntentId: paymentIntent.id
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: product.price,
        currency: 'usd',
        product: {
          name: product.name,
          description: product.description,
          credits: product.credits
        }
      };
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Create subscription for unlimited access
   */
  async createSubscription(userId, priceId, paymentMethodId) {
    try {
      // Create or retrieve customer
      const customer = await this.getOrCreateCustomer(userId);

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId
        }
      });

      logger.info('Subscription created:', {
        userId,
        subscriptionId: subscription.id,
        customerId: customer.id
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateCustomer(userId) {
    try {
      // Get user from database
      const user = await db('users').where({ id: userId }).first();
      if (!user) {
        throw new Error('User not found');
      }

      // Check if customer already exists
      if (user.stripe_customer_id) {
        try {
          const customer = await this.stripe.customers.retrieve(user.stripe_customer_id);
          if (!customer.deleted) {
            return customer;
          }
        } catch (error) {
          logger.warn('Stripe customer not found, creating new one:', user.stripe_customer_id);
        }
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });

      // Update user record with customer ID
      await db('users')
        .where({ id: userId })
        .update({ 
          stripe_customer_id: customer.id,
          updated_at: new Date()
        });

      return customer;
    } catch (error) {
      logger.error('Failed to get or create customer:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const { userId, productId, credits } = paymentIntent.metadata;

      // Record purchase in database
      const purchaseId = await this.recordPurchase(
        userId,
        productId,
        paymentIntentId,
        paymentIntent.amount / 100, // Convert back to dollars
        'completed'
      );

      // Add credits to user account
      if (credits && parseInt(credits) > 0) {
        await this.addCreditsToUser(userId, parseInt(credits));
      }

      logger.info('Payment processed successfully:', {
        userId,
        productId,
        paymentIntentId,
        purchaseId,
        credits
      });

      return {
        success: true,
        purchaseId,
        credits: parseInt(credits) || 0
      };
    } catch (error) {
      logger.error('Failed to handle successful payment:', error);
      throw error;
    }
  }

  /**
   * Record purchase in database
   */
  async recordPurchase(userId, productId, stripePaymentId, amount, status) {
    try {
      const [purchaseId] = await db('purchases').insert({
        user_id: userId,
        product_id: productId,
        stripe_payment_id: stripePaymentId,
        amount_usd: amount,
        status,
        platform: 'stripe',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');

      return purchaseId;
    } catch (error) {
      logger.error('Failed to record purchase:', error);
      throw error;
    }
  }

  /**
   * Record payment attempt
   */
  async recordPaymentAttempt(userId, productId, paymentIntentId, amount) {
    try {
      await db('purchases').insert({
        user_id: userId,
        product_id: productId,
        stripe_payment_id: paymentIntentId,
        amount_usd: amount / 100, // Convert cents to dollars
        status: 'pending',
        platform: 'stripe',
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to record payment attempt:', error);
      // Don't throw - this is not critical for payment flow
    }
  }

  /**
   * Add credits to user account
   */
  async addCreditsToUser(userId, credits) {
    try {
      await db('users')
        .where({ id: userId })
        .increment('photo_credits', credits)
        .update({ updated_at: new Date() });

      logger.info('Credits added to user:', { userId, credits });
    } catch (error) {
      logger.error('Failed to add credits to user:', error);
      throw error;
    }
  }

  /**
   * Get user's current credits
   */
  async getUserCredits(userId) {
    try {
      const user = await db('users')
        .where({ id: userId })
        .select('photo_credits')
        .first();

      return user ? user.photo_credits || 0 : 0;
    } catch (error) {
      logger.error('Failed to get user credits:', error);
      return 0;
    }
  }

  /**
   * Deduct credits from user account
   */
  async deductCreditsFromUser(userId, credits) {
    try {
      const result = await db('users')
        .where({ id: userId })
        .andWhere('photo_credits', '>=', credits)
        .decrement('photo_credits', credits)
        .update({ updated_at: new Date() });

      if (result === 0) {
        throw new Error('Insufficient credits');
      }

      logger.info('Credits deducted from user:', { userId, credits });
      return true;
    } catch (error) {
      logger.error('Failed to deduct credits from user:', error);
      throw error;
    }
  }

  /**
   * Get available products
   */
  getAvailableProducts() {
    return Object.entries(this.products).map(([id, product]) => ({
      id,
      ...product
    }));
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data.object.id);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event:', event.type);
      }
    } catch (error) {
      logger.error('Webhook event handling failed:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(paymentIntentId) {
    try {
      await db('purchases')
        .where({ stripe_payment_id: paymentIntentId })
        .update({ 
          status: 'failed',
          updated_at: new Date()
        });

      logger.info('Payment marked as failed:', { paymentIntentId });
    } catch (error) {
      logger.error('Failed to handle payment failure:', error);
    }
  }

  /**
   * Handle subscription payment
   */
  async handleSubscriptionPayment(invoice) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.userId;

      // Grant unlimited credits for active subscription
      await db('users')
        .where({ id: userId })
        .update({ 
          subscription_status: 'active',
          subscription_id: subscription.id,
          updated_at: new Date()
        });

      logger.info('Subscription payment processed:', {
        userId,
        subscriptionId: subscription.id
      });
    } catch (error) {
      logger.error('Failed to handle subscription payment:', error);
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancelled(subscription) {
    try {
      const userId = subscription.metadata.userId;

      await db('users')
        .where({ id: userId })
        .update({ 
          subscription_status: 'cancelled',
          updated_at: new Date()
        });

      logger.info('Subscription cancelled:', {
        userId,
        subscriptionId: subscription.id
      });
    } catch (error) {
      logger.error('Failed to handle subscription cancellation:', error);
    }
  }
}

module.exports = new PaymentService();