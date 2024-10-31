const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body;

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cartItems,
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success',  // Success URL after payment
            cancel_url: 'https://cybertronicbot.com/cancel',    // Cancel URL if payment fails
        });

        // Send session ID back to the client
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error); // Log the error for debugging
        res.status(500).send({ error: error.message }); // Send error message to the client
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
