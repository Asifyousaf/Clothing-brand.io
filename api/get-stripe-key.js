const express = require('express');
const router = express.Router();

router.get('/api/get-stripe-key', (req, res) => {
  try {
    // Make sure NEXT_PUBLIC_STRIPE_PUBLIC_KEY is set in your environment variables
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    
    if (!stripeKey) {
      throw new Error('Stripe public key not found');
    }
    
    res.status(200).json({ stripeKey });
  } catch (error) {
    console.error('Error retrieving Stripe key:', error);
    res.status(500).json({ error: 'Failed to retrieve Stripe key' });
  }
});

module.exports = router;