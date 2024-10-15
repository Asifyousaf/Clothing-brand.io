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

        // Send confirmation email to the user
        const mailOptions = {
            from: 'testingphase2024oct15@gmail.com', // From your email
            to: email, // User's email address
            subject: 'Order Confirmation',
            text: `Thank you for your order!\n\nYour order number is: ${session.id}\n\nBilling Details:\n${JSON.stringify(cartItems, null, 2)}\n\nThank you for shopping with us!`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        // Send a notification email to yourself
        const adminMailOptions = {
            from: 'testingphase2024oct15@gmail.com',
            to: 'testingphase2024oct15@gmail.com', // Your email address
            subject: 'New Order Placed',
            text: `A new order has been placed!\n\nOrder Number: ${session.id}\n\nBilling Details:\n${JSON.stringify(cartItems, null, 2)}`
        };

        transporter.sendMail(adminMailOptions, (error, info) => {
            if (error) {
                console.error('Error sending admin notification email:', error);
            } else {
                console.log('Admin notification email sent: ' + info.response);
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).send({ error: error.message });
    }
});

// Endpoint to retrieve checkout session details for the success page
app.get('/api/checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
            expand: ['line_items', 'customer_details', 'shipping'],
        });

        res.json({ session });
    } catch (error) {
        console.error('Error retrieving Stripe session:', error);
        res.status(500).send({ error: error.message });
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
