const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cartItems,
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success',
            cancel_url: 'https://cybertronicbot.com/cancel',
            shipping_address_collection: {
                allowed_countries: [
                    'AE', // United Arab Emirates
                    'SA', // Saudi Arabia
                    'KW', // Kuwait
                    'QA', // Qatar
                    'BH', // Bahrain
                    'OM', // Oman
                    'JO', // Jordan
                    'IQ', // Iraq
                    'YE', // Yemen
                    'SY', // Syria
                    'LB'  // Lebanon
                ],
            },
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).send({ error: error.message });
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
