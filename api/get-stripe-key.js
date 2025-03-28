export default function handler(req, res) {
    res.status(200).json({ stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY});
}
