// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_51Q4iWzJEY1WRV9LDBUXz9Z6j40eG8vSrM6BGT5rgOL77THBWnXvZBXoPP8sLcmzbBRF3T7XkHTkkOL2JHIaP3uEC003Wjpz2WO'); // Replace with your Stripe secret key
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const { line_items } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: `${YOUR_SUCCESS_URL}`, // URL to redirect on success
            cancel_url: `${YOUR_CANCEL_URL}`, // URL to redirect on cancel
        });
        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
