const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('your_secret_key'); // Replace with your Stripe secret key

const app = express();
app.use(bodyParser.json());

app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: req.body.line_items,
            mode: 'payment',
            success_url: 'https://yourdomain.com/success', // Replace with your success URL
            cancel_url: 'https://yourdomain.com/cancel', // Replace with your cancel URL
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Endpoint to update product stock
app.post('/update-stock', async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        // Find the product and update its stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Check if enough stock is available
        if (product.stock < quantity) {
            return res.status(400).send('Not enough stock available');
        }

        // Deduct the purchased quantity from stock
        product.stock -= quantity;
        await product.save();

        res.status(200).send('Stock updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});
