const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({
    origin: 'https://cybertronicbot.com', 
}));

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

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
    const { email, name, address, phone } = customer_details;  // Capture phone number

    // Format items for email
    const itemsList = items.data.map(item => 
        `${item.description} - ${item.quantity} x ${(item.price.unit_amount / 100).toFixed(2)} AED`
    ).join('\n');

    // Format address
    const formattedAddress = address ? 
        `${address.line1}\n${address.line2 || ''}\n${address.city}, ${address.state}\n${address.postal_code}\n${address.country}` 
        : 'No address provided';

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <h1 style="color: #333; text-align: center;">Thank You for Your Purchase!</h1>
            <p style="font-size: 16px; color: #555;">Order ID: <strong>${session.id}</strong></p>
            
            <h2 style="color: #444;">Order Details:</h2>
            <p><strong>Items:</strong></p>
            <div style="background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <pre style="white-space: pre-wrap; font-size: 14px; color: #333;">${itemsList}</pre>
            </div>
            <p><strong>Total Amount:</strong> <span style="color: #27ae60;">${(amount_total / 100).toFixed(2)} AED</span></p>
            
            <h2 style="color: #444;">Shipping Details:</h2>
            <div style="background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <pre style="white-space: pre-wrap; font-size: 14px; color: #333;">${formattedAddress}</pre>
            </div>

            <p><strong>Phone Number:</strong> ${phone || 'No phone number provided'}</p>  <!-- Added phone number -->
            
            <h2 style="color: #444;">Frequently Asked Questions:</h2>
            <h3 style="color: #222;">When will my order ship?</h3>
            <p>Orders typically ship within <strong>3-5 business days.</strong></p>
            
            <h3 style="color: #222;">How can I track my order?</h3>
            <p>You'll receive a tracking number via email once your order ships.</p>
            
            <h3 style="color: #222;">What's your return policy?</h3>
            <p>We accept returns within <strong>7 days</strong> of delivery. Please see our <a href="https://cybertronicbot.com/policy" style="color: #3498db; text-decoration: none;">policy page</a> for details.</p>
            
            <h3 style="color: #222;">Need help?</h3>
            <p>Contact us at <a href="mailto:cybertronicbot@gmail.com" style="color: #3498db; text-decoration: none;">support@cybertronicbot.com</a></p>
            
            <p style="text-align: center; font-size: 16px; margin-top: 20px;">Thank you for shopping with <strong>Cybertronic</strong>!</p>
            
            <div style="text-align: center; margin-top: 20px;">
                <img src="https://cybertronicbot.com/img/company.webp" alt="Cybertronic Logo" style="width: 100px; height: auto;">
            </div>
        </div>
    `;

    try {
        // Send to customer
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Cybertronic Order Receipt',
            html: emailContent
        });

        // Send to Store Owner
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'Cybertronicbot@gmail.com',
            subject: 'New Order Received',
            html: emailContent
        });

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
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
            receipt_email: email,
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

        // Save order to Supabase
        const { error: dbError } = await supabase
            .from('orders')
            .insert({
                session_id: session.id,
                customer_email: session.customer_details.email,
                customer_name: session.customer_details.name,
                shipping_address: session.shipping_details,
                billing_address: session.customer_details.address,
                items: JSON.parse(session.metadata.cartItems),
                total_amount: session.amount_total / 100,
                status: 'paid'
            });

        if (dbError) {
            console.error('Error saving to Supabase:', dbError);
        }

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
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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