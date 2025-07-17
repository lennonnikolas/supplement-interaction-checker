const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const pool = require('../db/pool');
const { authenticateJWT } = require('./auth');

// POST /api/stripe/create-checkout-session
// Creates a Stripe Checkout session for Pro subscription
router.post('/create-checkout-session', authenticateJWT, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment-cancel`,
      metadata: { user_id: req.user.id }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/stripe/webhook
// Stripe webhook endpoint for subscription events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      
      try {
        // First, check if subscription already exists
        const existingResult = await pool.query(
          'SELECT id FROM subscriptions WHERE user_id = $1',
          [userId]
        );
        
        if (existingResult.rows.length > 0) {
          // Update existing subscription
          await pool.query(
            `UPDATE subscriptions SET 
             stripe_subscription_id = $1, 
             status = 'active', 
             plan_type = 'pro', 
             updated_at = NOW() 
             WHERE user_id = $2`,
            [session.subscription, userId]
          );
        } else {
          // Insert new subscription
          await pool.query(
            `INSERT INTO subscriptions (user_id, stripe_subscription_id, status, plan_type, updated_at) 
             VALUES ($1, $2, 'active', 'pro', NOW())`,
            [userId, session.subscription]
          );
        }
      } catch (dbError) {
        console.error('Database error in checkout.session.completed:', dbError);
        throw dbError;
      }
    }
    
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      
      // Update subscription status based on Stripe status
      const status = subscription.status === 'active' ? 'active' : 'canceled';
      await pool.query(
        `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_subscription_id = $2`,
        [status, subscription.id]
      );
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      
      // Mark subscription as canceled
      const result = await pool.query(
        `UPDATE subscriptions SET status = 'canceled', plan_type = 'free', updated_at = NOW() WHERE stripe_subscription_id = $1 RETURNING user_id`,
        [subscription.id]
      );
    }
    
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      
      // Ensure subscription is marked as active
      if (invoice.subscription) {
        await pool.query(
          `UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE stripe_subscription_id = $1`,
          [invoice.subscription]
        );
      }
    }
    
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      
      // Mark subscription as past_due
      if (invoice.subscription) {
        await pool.query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE stripe_subscription_id = $1`,
          [invoice.subscription]
        );
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// GET /api/stripe/subscription-status
// Returns the user's subscription status
router.get('/subscription-status', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT status, plan_type, stripe_subscription_id FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ status: 'inactive', plan_type: 'free', is_pro: false });
    }
    
    const sub = result.rows[0];
    const isPro = sub.status === 'active' && sub.plan_type === 'pro';
    
    res.json({
      status: sub.status,
      plan_type: sub.plan_type,
      stripe_subscription_id: sub.stripe_subscription_id,
      is_pro: isPro
    });
  } catch (err) {
    console.error('Error getting subscription status:', err);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// POST /api/stripe/cancel-subscription
// Cancels the user's subscription
router.post('/cancel-subscription', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;
    
    // Cancel at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Update local status - mark as canceled and free
    await pool.query(
      'UPDATE subscriptions SET status = $1, plan_type = $2, updated_at = NOW() WHERE user_id = $3',
      ['canceled', 'free', userId]
    );

    res.json({ message: 'Subscription will be canceled at the end of the current period' });
  } catch (err) {
    console.error('Error canceling subscription:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router; 