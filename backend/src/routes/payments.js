const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken } = require('../middleware/auth');
const { validatePaymentIntent, validateSubscription } = require('../middleware/validation');
const paymentService = require('../services/paymentService');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

/**
 * Get available products and pricing
 */
router.get('/products', async (req, res) => {
  try {
    const products = paymentService.getAvailableProducts();
    
    res.json({
      success: true,
      data: {
        products,
        currency: 'usd',
        supported_payment_methods: ['card', 'apple_pay', 'google_pay']
      }
    });
  } catch (error) {
    logger.error('Failed to get products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available products'
    });
  }
});

/**
 * Create payment intent for one-time purchase
 */
router.post('/create-payment-intent', authenticateToken, validatePaymentIntent, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { product_id, metadata = {} } = req.body;

    // Track purchase started
    const product = paymentService.products[product_id];
    if (product) {
      await analyticsService.trackPurchaseStarted(userId, {
        productId: product_id,
        price: product.price,
        currency: 'usd'
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      userId,
      product_id,
      {
        source: 'mobile_app',
        ...metadata
      }
    );

    logger.info('Payment intent created:', {
      userId,
      productId: product_id,
      amount: paymentIntent.amount
    });

    res.json({
      success: true,
      data: paymentIntent
    });

  } catch (error) {
    logger.error('Failed to create payment intent:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message.includes('Invalid product') 
        ? 'Invalid product selected'
        : 'Failed to create payment intent'
    });
  }
});

/**
 * Create subscription
 */
router.post('/create-subscription', authenticateToken, validateSubscription, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { price_id, payment_method_id } = req.body;

    const subscription = await paymentService.createSubscription(
      userId,
      price_id,
      payment_method_id
    );

    logger.info('Subscription created:', {
      userId,
      subscriptionId: subscription.subscriptionId
    });

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.error('Failed to create subscription:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

/**
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      logger.error('Missing Stripe signature');
      return res.status(400).send('Missing signature');
    }

    // Verify webhook signature
    const event = paymentService.verifyWebhookSignature(req.body, signature);

    logger.info('Webhook received:', {
      type: event.type,
      id: event.id
    });

    // Handle the event
    await paymentService.handleWebhookEvent(event);

    // Special handling for successful payments
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, productId } = paymentIntent.metadata;

      // Track successful purchase
      const product = paymentService.products[productId];
      if (product && userId) {
        await analyticsService.trackPurchaseCompleted(userId, {
          productId,
          price: product.price,
          currency: 'usd',
          credits: product.credits,
          transactionId: paymentIntent.id
        });
      }
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook handling failed:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Get user's current subscription status
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const user = await db('users')
      .where({ id: userId })
      .select(['subscription_status', 'subscription_id', 'photo_credits'])
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let subscriptionDetails = null;
    if (user.subscription_status === 'active' && user.subscription_id) {
      try {
        // Get detailed subscription info from Stripe
        subscriptionDetails = await paymentService.getSubscriptionDetails(user.subscription_id);
      } catch (error) {
        logger.warn('Failed to get subscription details from Stripe:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        status: user.subscription_status || 'free',
        subscription_id: user.subscription_id,
        credits: user.subscription_status === 'active' ? 'unlimited' : user.photo_credits,
        subscription_details: subscriptionDetails
      }
    });

  } catch (error) {
    logger.error('Failed to get subscription status:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
});

/**
 * Cancel subscription
 */
router.delete('/subscription', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const user = await db('users')
      .where({ id: userId })
      .select(['subscription_id', 'subscription_status'])
      .first();

    if (!user || !user.subscription_id) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (user.subscription_status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    // Cancel subscription in Stripe
    await paymentService.cancelSubscription(user.subscription_id);

    logger.info('Subscription cancelled:', {
      userId,
      subscriptionId: user.subscription_id
    });

    // Track cancellation
    await analyticsService.trackEvent(userId, 'Subscription Cancelled', {
      subscription_id: user.subscription_id,
      cancelled_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('Failed to cancel subscription:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get user's purchase history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await db('purchases')
      .where({ user_id: userId })
      .count('id as count');

    // Get purchase history
    const purchases = await db('purchases')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select([
        'id', 'product_id', 'amount_usd', 'status', 
        'platform', 'created_at', 'updated_at'
      ]);

    // Get purchase statistics
    const stats = await db('purchases')
      .where({ user_id: userId, status: 'completed' })
      .select([
        db.raw('COUNT(*) as total_purchases'),
        db.raw('SUM(amount_usd) as total_spent'),
        db.raw('AVG(amount_usd) as avg_purchase_amount')
      ])
      .first();

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        purchases,
        statistics: {
          total_purchases: parseInt(stats.total_purchases) || 0,
          total_spent: parseFloat(stats.total_spent) || 0,
          average_purchase: parseFloat(stats.avg_purchase_amount) || 0
        },
        pagination: {
          page,
          limit,
          total: parseInt(count),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get purchase history:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get purchase history'
    });
  }
});

/**
 * Get current user's credit balance
 */
router.get('/credits', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const credits = await paymentService.getUserCredits(userId);

    // Get user subscription status
    const user = await db('users')
      .where({ id: userId })
      .select(['subscription_status'])
      .first();

    res.json({
      success: true,
      data: {
        credits: user.subscription_status === 'active' ? 'unlimited' : credits,
        subscription_status: user.subscription_status || 'free',
        is_unlimited: user.subscription_status === 'active'
      }
    });

  } catch (error) {
    logger.error('Failed to get user credits:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get credit balance'
    });
  }
});

/**
 * Validate payment intent status
 */
router.get('/payment-intent/:payment_intent_id', authenticateToken, async (req, res) => {
  try {
    const { payment_intent_id } = req.params;
    const { id: userId } = req.user;

    // Check if this payment intent belongs to the user
    const purchase = await db('purchases')
      .where({ 
        stripe_payment_id: payment_intent_id,
        user_id: userId 
      })
      .first();

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Get status from Stripe
    const paymentIntent = await paymentService.stripe.paymentIntents.retrieve(payment_intent_id);

    res.json({
      success: true,
      data: {
        payment_intent_id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        purchase_status: purchase.status
      }
    });

  } catch (error) {
    logger.error('Failed to get payment intent status:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

module.exports = router;