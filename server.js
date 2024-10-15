const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r'); // Your Stripe Secret Key

const app = express();

// Use cors middleware to enable CORS
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const { cartItems } = req.body; // Get cart items from frontend

    // Create line items array for Stripe
    const lineItems = cartItems.map(item => ({
        price_data: {
            currency: 'aed',
            product_data: {
                name: `${item.name} (${item.size}, ${item.color})`,  // Example: Cool Shirt (Large, Red)
            },
            unit_amount: Math.round(item.price * 100), // Convert price to cents
        },
        quantity: item.quantity,
    }));

    try {
        // Create the Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:3000',  // Redirect to home page after successful payment
            cancel_url: 'http://localhost:3000',   // Redirect to home page if payment is canceled
            
            // Include address and phone number collection
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'], // Specify allowed countries (replace with your desired countries)
            },
            customer_email: 'customer@example.com', // You can send the customer's email if available
        });

        // Send session ID to frontend
        res.json({ id: session.id });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));
