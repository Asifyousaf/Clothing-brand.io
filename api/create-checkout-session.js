const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'testingphase2024oct15@gmail.com', // your email address
        pass: 'Asif219217' // your email password or app-specific password
    }
});

// Endpoint for creating a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { cartItems, email } = req.body; // Expect email in the request

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cartItems,
            mode: 'payment',
            success_url: 'https://cybertronicbot.com/success?session_id={CHECKOUT_SESSION_ID}', // Pass session_id to success URL
            cancel_url: 'https://cybertronicbot.com/cancel',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['AE', 'SA', 'EG'], // Add other country codes as needed
            },
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).send({ error: error.message });
    }
});

// Webhook endpoint for handling events from Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;

    // Verify the webhook signature
    const signature = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_yKI5WAE7jTnFlMjV1gztY01Ql8J8Y6z7'; // replace with your webhook signing secret

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object; // Contains the checkout session
            const customerEmail = session.customer_email; // Email from session

            // Send confirmation email to the customer
            const mailOptions = {
                from: 'testingphase2024oct15@gmail.com',
                to: customerEmail,
                subject: 'Order Confirmation',
                text: `Thank you for your order!\n\nYour order number is: ${session.id}\n\nThank you for shopping with us!`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent to customer:', info.response);
                }
            });

            // Optionally, send an email to yourself with order details
            const adminMailOptions = {
                from: 'testingphase2024oct15@gmail.com',
                to: 'testingphase2024oct15@gmail.com', // Your email address
                subject: 'New Order Placed',
                text: `A new order has been placed!\n\nOrder Number: ${session.id}\n\nBilling Details:\n${JSON.stringify(session, null, 2)}`
            };

            transporter.sendMail(adminMailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending admin notification email:', error);
                } else {
                    console.log('Admin notification email sent:', info.response);
                }
            });

            break;
        // Handle other event types as needed
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
