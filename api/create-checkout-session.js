const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({
    origin: 'https://cybertronicbot.com', 
}));

app.use(express.json());

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send receipt email
async function sendReceiptEmail(session, items) {
    const { customer_details, amount_total } = session;
    const { email, name, address } = customer_details;

    // Format items for email
    const itemsList = items.data.map(item => 
        `${item.description} - ${item.quantity} x ${(item.price.unit_amount / 100).toFixed(2)} AED`
    ).join('\n');

    // Format address
    const formattedAddress = address ? 
        `${address.line1}\n${address.line2 || ''}\n${address.city}, ${address.state}\n${address.postal_code}\n${address.country}` 
        : 'No address provided';

    const emailContent = `
        <h1>Thank you for your purchase!</h1>
        <p>Order ID: ${session.id}</p>
        <h2>Order Details:</h2>
        <p><strong>Items:</strong></p>
        <pre>${itemsList}</pre>
        <p><strong>Total Amount:</strong> ${(amount_total / 100).toFixed(2)} AED</p>
        
        <h2>Shipping Details:</h2>
        <pre>${formattedAddress}</pre>
        
        <h2>Frequently Asked Questions:</h2>
        <h3>When will my order ship?</h3>
        <p>Orders typically ship within 1-2 business days.</p>
        
        <h3>How can I track my order?</h3>
        <p>You'll receive a tracking number via email once your order ships.</p>
        
        <h3>What's your return policy?</h3>
        <p>We accept returns within 7 days of delivery. Please see our policy page for details.</p>
        
        <h3>Need help?</h3>
        <p>Contact us at support@cybertronicbot.com</p>
        
        <p>Thank you for shopping with Cybertronic!</p>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Cybertronic Order Receipt',
        html: emailContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Receipt email sent successfully');
    } catch (error) {
        console.error('Error sending receipt email:', error);
    }
}

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

app.get('/api/create-checkout-session', async (req, res) => {
    const sessionId = req.query.session_id;
    console.log('Fetching session for ID:', sessionId);

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items']
        });
        const lineItems = session.line_items;

        // Send receipt email after successful checkout
        await sendReceiptEmail(session, lineItems);

        res.json({ session, lineItems });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'Failed to fetch session data' });
    }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_jpk9R320UxDDfTM28wFdxpAIHkEo3pJ4';

    try {
        const event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        console.log(`Received event type: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Payment succeeded:', session);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));