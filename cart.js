document.getElementById('hamburger').addEventListener('click', function() {
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

async function getStripeKey() {
    try {
        const response = await fetch('/api/get-stripe-key');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.stripeKey) {
            throw new Error('No Stripe key in response');
        }
        return data.stripeKey;
    } catch (error) {
        console.error('Error fetching Stripe key:', error);
        throw error; // Re-throw to be handled by the calling function
    }
}

// Helper function to calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

async function checkoutWithStripe() {
    try {
        // Log the entire cart for inspection
        console.log('Cart items to send:', cart);

        // Map cart items to a structure that Stripe expects
        const cartItems = cart.map(item => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity
        }));

        // First create the checkout session
        const sessionResponse = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })
        });

        if (!sessionResponse.ok) {
            const errorText = await sessionResponse.text();
            throw new Error(`Failed to create checkout session: ${errorText}`);
        }

        const session = await sessionResponse.json();
        
        if (!session.id) {
            throw new Error('No session ID returned from server');
        }

        // Then get the Stripe key and initialize Stripe
        const stripeKey = await getStripeKey();
        if (!stripeKey) {
            throw new Error('Failed to load Stripe key');
        }

        const stripe = Stripe(stripeKey);
        const { error } = await stripe.redirectToCheckout({
            sessionId: session.id
        });

        if (error) {
            throw error;
        }

        // Clear cart (this won't execute until after redirect returns)
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();

    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred during checkout. Please try again.');
    }
}

async function sendInvoice() {
    const response = await fetch("https://cybertronicbot.com/send-invoice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            customerId: "cus_xxxxxxxx", // Replace with real Stripe customer ID
            amount: 100, // Amount in AED (e.g., 100 AED)
            description: "Purchase of clothing",
        }),
    });

    const data = await response.json();
    if (data.success) {
        alert("Invoice sent successfully!");
        console.log("Invoice ID:", data.invoiceId);
    } else {
        alert("Error sending invoice: " + data.error);
    }
}

document.getElementById('checkout-button').addEventListener('click', function() {
    checkoutWithStripe(); // Trigger the checkout process
});

// Function to open the cart popup
function openCart() {
    document.getElementById('cart-popup').classList.add('show');
}

// Function to close the cart popup
function closeCart() {
    document.getElementById('cart-popup').classList.remove('show');
}

// Ensure PayPal is initialized when the page loads
window.onload = function() {
    updateCart(); // Update cart and initialize PayPal button
   
};

// Function to open the cart
function openCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');

    // Show the cart popup and wrapper
    cartPopup.classList.add('show');
    cartWrapper.classList.add('show');
}

// Function to close the cart with smooth transition
function closeCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');

    // Slide the cart out
    cartPopup.classList.remove('show');

    // After the sliding animation is done, hide the wrapper (with slight delay to match CSS transition)
    setTimeout(() => {
        cartWrapper.classList.remove('show');
    }, 400); // Delay matches the CSS transition duration (0.4s)
}

// Function to close cart when clicking outside the cart area
function closeCartOnClickOutside(event) {
    // If the clicked target is the wrapper (outside the cart), close the cart
    if (event.target === document.getElementById('cart-popup-wrapper')) {
        closeCart();
    }
}

// product js
// Check if the splash screen has been shown before
const handlePurchase = async (productId, quantity) => {
    // Assuming purchase is successful
    try {
        await axios.post('http://your-server-url/update-stock', {
            productId,
            quantity,
        });
        alert('Purchase successful! Stock updated.');
    } catch (error) {
        alert('Error updating stock: ' + error.response.data);
    }
};