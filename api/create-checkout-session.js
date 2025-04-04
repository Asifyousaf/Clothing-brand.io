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
async function sendReceiptEmail(session, lineItems) {
    const { customer_details, amount_total } = session;
    const { email, name, address, phone } = customer_details;

    const formattedAddress = address
        ? `${address.line1 || ''}, ${address.line2 || ''}, ${address.city || ''}, ${address.state || ''}, ${address.postal_code || ''}, ${address.country || ''}`
        : 'No address provided';

    const orderDate = new Date(session.created * 1000).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' });
    
    const cartItems = JSON.parse(session.metadata.cartItems);

    const itemsList = lineItems.data
        .map((item, index) => `
            <div style="padding: 8px; border-bottom: 1px solid #ddd;">
                <strong>${item.description}</strong> <br>
                Size: ${cartItems[index].size}, Color: ${cartItems[index].color} <br>
                Quantity: ${item.quantity} <br>
                Price: ${(item.price.unit_amount / 100).toFixed(2)} AED
            </div>
        `)
        .join('');
    

    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Thank You for Your Order!</h2>
        <p>Order ID: <strong>${session.id}</strong></p>
        <p><strong>Order Date:</strong> ${orderDate}</p>

        <h3 style="color: #444;">Items Purchased:</h3>
        <div style="background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
            ${itemsList}
        </div>

        <p><strong>Total Amount:</strong> <span style="color: #27ae60;">${(amount_total / 100).toFixed(2)} AED</span></p>

        <h3 style="color: #444;">Shipping Details:</h3>
        <p>${formattedAddress}</p>
        <p><strong>Phone Number:</strong> ${phone || 'Not provided'}</p>  

        <p style="text-align: center;">Thank you for shopping with <strong>Cybertronic</strong>!</p>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Cybertronic Order Receipt',
            html: emailContent
        });

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
        const { cartItems,email } = req.body;

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
                allowed_countries: ['AE'],
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
        console.log("✅ Stripe customer details:", session.customer_details);
        console.log("✅ Stripe customer email:", session.customer_details?.email);
     
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

app.post('/api/update-stock', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Pass raw body to stripe.webhooks.constructEvent
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const cartItems = JSON.parse(session.metadata.cartItems); // Assuming metadata holds cart items

        try {
            // Loop through cart items and update stock in Supabase
            for (let item of cartItems) {
                const { productId, quantity } = item;

                const { error: dbError } = await supabase
                    .from('products')
                    .update({ stock: supabase.raw('stock - ?', [quantity]) }) // Decrease stock by quantity purchased
                    .eq('product_id', productId);

                if (dbError) {
                    console.error('Error updating stock:', dbError);
                } else {
                    console.log(`Stock updated for product ID: ${productId}`);
                }
            }
        } catch (error) {
            console.error('Error processing checkout session:', error);
        }
    }

    res.json({ received: true });
});




app.listen(3000, () => console.log('Server is running on port 3000'));