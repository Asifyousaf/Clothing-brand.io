const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body; // Expect cart items in the request

        // Ensure cartItems is not empty or undefined
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).send({ error: 'No items in cart' });
        }

        // Create a Stripe session and pass cartItems as line_items
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cartItems, // Pass cartItems as line_items to Stripe
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success?session_id={CHECKOUT_SESSION_ID}', // Success URL
            cancel_url: 'https://cybertronicbot.com/cancel', // Cancel URL
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['AE', 'SA', 'EG'], // Add other country codes as needed
            },
        });

        // Send back the session ID
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).send({ error: error.message });
    }
});


app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Webhook received:', req.body); // Log incoming request
    let event;

    const signature = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4'; // replace with your webhook signing secret

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`Received event type: ${event.type}`);
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment succeeded:', session);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});


// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
