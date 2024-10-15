const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body;

        // Log the cart items for debugging
        console.log('Cart items received:', cartItems);

        // Ensure cartItems is not empty
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).send({ error: 'Cart items are required' });
        }

        // Create the Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'apple_pay'], // Include Apple Pay if desired
            line_items: cartItems,
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success',
            cancel_url: 'https://cybertronicbot.com/cancel',
        });

        // Respond with the session ID
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error); // Log the error
        res.status(500).send({ error: error.message }); // Send error message to the client
    }
});

// Export the app for serverless function usage
module.exports = app;
