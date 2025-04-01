const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Enable CORS with specific origin
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://cybertronicbot.com'
        : 'http://localhost:3000',
    credentials: true
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
    try {
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
                
                <h2 style="color: #444;">Frequently Asked Questions:</h2>
                <h3 style="color: #222;">When will my order ship?</h3>
                <p>Orders typically ship within <strong>3-5 business days.</strong></p>
                
                <h3 style="color: #222;">How can I track my order?</h3>
                <p>You'll receive a tracking number via email once your order ships.</p>
                
                <h3 style="color: #222;">What's your return policy?</h3>
                <p>We accept returns within <strong>7 days</strong> of delivery. Please see our <a href="https://cybertronicbot.com/policy" style="color: #3498db; text-decoration: none;">policy page</a> for details.</p>
                
                <h3 style="color: #222;">Need help?</h3>
                <p>Contact us at <a href="mailto:support@cybertronicbot.com" style="color: #3498db; text-decoration: none;">support@cybertronicbot.com</a></p>
                
                <p style="text-align: center; font-size: 16px; margin-top: 20px;">Thank you for shopping with <strong>Cybertronic</strong>!</p>
                
                <div style="text-align: center; margin-top: 20px;">
                    <img src="https://cybertronicbot.com/img/company.webp" alt="Cybertronic Logo" style="width: 100px; height: auto;">
                </div>
            </div>
        `;

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

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
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
            success_url: `${process.env.NODE_ENV === 'production' ? 'https://cybertronicbot.com' : 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NODE_ENV === 'production' ? 'https://cybertronicbot.com' : 'http://localhost:3000'}/cancel`,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['AE', 'SA', 'EG'],
            },
            phone_number_collection: {
                enabled: true,
            },
            metadata: {
                cartItems: JSON.stringify(cartItems)
            },
            automatic_tax: { enabled: true }
        });
        
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get session details endpoint
app.get('/create-checkout-session', async (req, res) => {
    try {
        const { session_id } = req.query;
        
        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items', 'customer_details']
        });

        res.json({ 
            session,
            lineItems: session.line_items
        });
    } catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
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
                return res.status(500).json({ error: 'Database error' });
            }

            // Get line items and send receipt
            const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items']
            });
            
            await sendReceiptEmail(sessionWithItems, sessionWithItems.line_items);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));