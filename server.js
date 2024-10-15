// Import Stripe
const stripe = require('stripe')('sk_test_51Q6qZ8Rxk79NacxxJgyYInUBdiJ2Pcqm8otxx0l4TBywHa9BM2clTwi9Siiilxzh7dIcmqMOiG5f0IlJsfOMauIQ00ZgqTu36r');

// Export a default async function to handle requests
export default async function handler(req, res) {
    // Check for POST request
    if (req.method === 'POST') {
        try {
            const { cartItems } = req.body; // Get cart items from request body

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: cartItems,
                mode: 'payment',
                success_url: 'https://cybertronicbot.com/success',  // Success URL after payment
                cancel_url: 'https://cybertronicbot.com/cancel',    // Cancel URL if payment fails
            });

            // Send session ID back to the client
            res.status(200).json({ id: session.id });
        } catch (error) {
            console.error('Error creating Stripe checkout session:', error); // Log the error for debugging
            res.status(500).send({ error: error.message }); // Send error message to the client
        }
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
