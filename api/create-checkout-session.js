// Express server (Backend API - create-checkout-session.js)
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors({
    origin: 'https://cybertronicbot.com', 
}));

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body; 

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).send({ error: 'No items in cart' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cartItems.map(item => ({
                price_data: {
                    currency: 'aed',
                    product_data: {
                        name: item.name, 
                        images: [item.image], 
                        description: `Size: ${item.size}, Color: ${item.color}`, 
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://cybertronicbot.com/cancel',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['AE', 'SA', 'EG'],
            },
            phone_number_collection: {
                enabled: true,
            },
            metadata: {
                cartItems: JSON.stringify(cartItems.map(item => ({
                    productId: item.productId,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity
                })))
            }
        });
        
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Use Vercel env variable

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

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

app.listen(3000, () => console.log('Server is running on port 3000'));

// Frontend cart.js
async function checkoutWithStripe() {
    try {
        const cartItems = cart.map(item => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity
        }));

        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })
        });

        const responseBody = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to create checkout session: ${responseBody.error || responseBody}`);
        }

        const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
        await stripe.redirectToCheckout({ sessionId: responseBody.id });

        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred. Please try again.');
    }
}
