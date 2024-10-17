// Retrieve cart data from localStorage or initialize an empty cart if not available
let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCart(); // Ensure cart is updated based on localStorage


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('checkout-button').addEventListener('click', function() {
        checkoutWithStripe(); // Trigger the checkout process
    });
});

async function checkoutWithStripe() {
    try {
        // Log the entire cart for inspection
        console.log('Cart items to send:', cart);

        // Map cart items to a structure that Stripe expects
        const cartItems = cart.map(item => {
            const productData = {
                name: item.name,
                description: `Size: ${item.size}, Color: ${item.color}`,
            };
        
            // Only add the 'images' field if the image URL is not empty
            if (item.image && item.image.trim() !== "") {
                productData.images = [item.image];
            }
        
            return {
                price_data: {
                    currency: 'aed',
                    product_data: productData,
                    unit_amount: Math.round(item.price * 100), // Stripe expects price in cents
                },
                quantity: item.quantity,
            };
        });
        

        // Log formatted cart items to see if they are correct
        console.log('Formatted cart items for Stripe:', cartItems);

        // Send cart data to your backend for session creation
        const response = await fetch('/api/create-checkout-session', { // Use the /api/ prefix
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })
        });
        
        
        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        // Get the session object from the response
        const session = await response.json();

        // Initialize Stripe and redirect to checkout
        const stripe = Stripe('pk_test_51Q6qZ8Rxk79NacxxmxK6wWgu9j4c9S6s8P65w0usB7WISHIEKMGyr2bfgo0EDdsXD23D7LjtIz7jt7fvlfyc72v600ZMyI8pef');
        await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred. Please try again.');
    }
}

function populateProductOptions() {
    const productContainer = document.getElementById('product-container'); // Ensure you have a container in your HTML
    productContainer.innerHTML = ''; // Clear existing content

    for (const product of inventory) {
        const productDiv = document.createElement('div');
        productDiv.innerHTML = `
            <h3>${product.name}</h3>
            <p>Description: ${product.description}</p>
            <p>User Limit: ${product.userLimit}</p>
            <p>Available Sizes: ${product.sizes.join(', ')}</p>
            <p>Available Colors: ${product.colors.join(', ')}</p>
            <button onclick="selectProduct('${product.id}')">Select</button>
        `;
        productContainer.appendChild(productDiv);
    }
}

function selectProduct(productId) {
    const product = inventory.find(item => item.id === productId);
    // Populate size and color options based on the selected product
    populateSizeColorOptions(product);
}

document.addEventListener('DOMContentLoaded', fetchInventory); // Call fetchInventory on page load

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




// Add event listener to the cart button to open the cart popup
document.getElementById('cart-button').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    openCart();
});


// Function to update stock in the database
async function updateStock(productId, size, color, quantity) {
    try {
        const response = await fetch('/api/update-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, size, color, quantity }),
        });

        if (!response.ok) {
            throw new Error('Failed to update stock');
        }

        const updatedProduct = await response.json();
        console.log('Stock updated:', updatedProduct); // Optionally handle the updated product data

    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

// Helper function to calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}


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
function updateStockAndOptions(product) {
    // Populate size options
    const sizeSelect = document.getElementById('size');
    sizeSelect.innerHTML = ''; // Clear previous options
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.toLowerCase();
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    // Populate color options
    const colorSelect = document.getElementById('color');
    colorSelect.innerHTML = ''; // Clear previous options
    product.colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    // Update stock and price based on the selected size and color
    updatePriceAndStockDisplay(product);
}

function updatePriceAndStockDisplay(product) {
    const selectedSize = document.getElementById('size').value;
    const selectedColor = document.getElementById('color').value;

    // Update price
    const price = product.prices[selectedSize][selectedColor];
    document.getElementById('product-price').innerText = `$${price.toFixed(2)}`;

    // Update stock info
    const stock = product.stock[selectedSize][selectedColor];
    document.getElementById('stock-quantity').innerText = stock;

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.disabled = stock <= 0; // Disable button if out of stock
}




// Function to remove an item from the cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}


// Load the cart data from localStorage on page load
window.onload = function() {
    updateCart(); // Ensure the cart is updated when the page loads
};

// Function to change the main product image
function changeImage(imageSrc) {
    document.getElementById('main-product-image').src = imageSrc;
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



// sql 

