document.getElementById('hamburger').addEventListener('click', function () {
    const navLeft = document.getElementById('nav-left');
    const navRight = document.getElementById('nav-right');
    navLeft.classList.toggle('active'); // Toggle the left navigation
    navRight.classList.toggle('active'); // Toggle the right navigation
});

const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");

hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
});

// Ensure cart is initialized
const cart = JSON.parse(localStorage.getItem('cart')) || [];

// Helper function to calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

async function checkoutWithStripe() {
    try {
        console.log('Cart items to send:', cart);

        const cartItems = cart.map(item => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity
        }));

        console.log('Formatted cart items for Stripe:', cartItems);

        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })
        });

        console.log('Response status:', response.status);
        const responseBody = await response.json();
        console.log('Response body:', responseBody);

        if (!response.ok) {
            throw new Error(`Failed to create checkout session: ${responseBody.error || responseBody}`);
        }

        // Initialize Stripe
        const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
        await stripe.redirectToCheckout({ sessionId: responseBody.id });

        // Clear cart after successful checkout
        cart.length = 0; // Empty the array
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();

    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred. Please try again.');
    }
}

document.getElementById('checkout-button').addEventListener('click', checkoutWithStripe);

// Function to open the cart popup
function openCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');
    cartPopup.classList.add('show');
    cartWrapper.classList.add('show');
}

// Function to close the cart popup smoothly
function closeCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');
    cartPopup.classList.remove('show');

    setTimeout(() => {
        cartWrapper.classList.remove('show');
    }, 400);
}

// Close cart when clicking outside the cart area
document.getElementById('cart-popup-wrapper').addEventListener('click', (event) => {
    if (event.target === document.getElementById('cart-popup-wrapper')) {
        closeCart();
    }
});

// Ensure PayPal is initialized
window.onload = function () {
    updateCart();
};

// Handle purchase and stock update
const handlePurchase = async (productId, quantity) => {
    try {
        await axios.post('/api/update-stock', { productId, quantity });
        alert('Purchase successful! Stock updated.');
    } catch (error) {
        alert('Error updating stock: ' + (error.response?.data || error.message));
    }
};
