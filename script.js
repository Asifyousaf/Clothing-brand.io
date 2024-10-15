
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





// Retrieve cart data from localStorage or initialize an empty cart if not available
let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCart(); // Ensure cart is updated based on localStorage


// Add event listener to the cart button to open the cart popup
document.getElementById('cart-button').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    openCart();
});

function addToCart(productId) {
    const product = products[productId]; // Get the product details
    const size = document.getElementById('size').value;
    const color = document.getElementById('color').value;

    const existingProduct = cart.find(item => item.productId === productId && item.size === size && item.color === color);

    if (!existingProduct) {
        // Check if the quantity in the cart exceeds the available stock
        const availableStock = product.stock[size][color];
        if (availableStock <= 0) {
            alert(`Cannot add more items to the cart. Only ${availableStock} item(s) available in stock for ${product.name} (${size}, ${color}).`);
            return;
        }

        // Add new product to the cart with the image URL
        cart.push({
            productId: productId,
            name: product.name,
            price: product.prices[size][color],
            quantity: 1,
            size: size,
            color: color,
            image: product.image // Store the image URL here
        });
    } else {
        // Increase quantity if item already exists
        const availableStock = product.stock[size][color];
        if (existingProduct.quantity >= availableStock) {
            alert(`Cannot add more items to the cart. Only ${availableStock} item(s) available in stock for ${product.name} (${size}, ${color}).`);
            return;
        }
        existingProduct.quantity += 1;
    }

    updateCart();
    openCart(); }// Automatically open cart when an item is added

// Helper function to calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}
async function checkoutWithStripe() {
    try {
        // Log the entire cart for inspection
        console.log('Cart items to send:', cart);

        // Map cart items to a structure that Stripe expects
        const cartItems = cart.map(item => {
            console.log(`Item: ${item.name}, Price: ${item.price}, Quantity: ${item.quantity}`); // Log each item
            return {
                price_data: {
                    currency: 'aed',
                    product_data: {
                        name: item.name,
                        images: [item.image],
                        description: `Size: ${item.size}, Color: ${item.color}`,
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects price in cents
                },
                quantity: item.quantity,
            };
        });

        // Log formatted cart items to see if they are correct
        console.log('Formatted cart items for Stripe:', cartItems);

        // Send cart data to your backend for session creation
        const response = await fetch('https://cybertronicbot.com/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })  // Send cart items
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



// Update cart function (with Stripe)
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        const itemImage = document.createElement('img');
        itemImage.src = item.image;
        itemDiv.appendChild(itemImage);

        const itemDetails = document.createElement('div');
        itemDetails.classList.add('cart-item-details');
        itemDetails.innerHTML = `
            <span class="item-name">${item.name} (${item.size}, ${item.color})</span>
            <span class="item-price">$${item.price.toFixed(2)} x ${item.quantity}</span>
        `;
        itemDiv.appendChild(itemDetails);

        const quantityControl = document.createElement('div');
        quantityControl.classList.add('quantity-control');
        quantityControl.innerHTML = `
            <button class="quantity-minus">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-plus">+</button>
        `;
        itemDiv.appendChild(quantityControl);

        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-btn');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeFromCart(index);
        itemDiv.appendChild(removeBtn);

        cartItemsContainer.appendChild(itemDiv);
        total += item.price * item.quantity;
    });

    document.getElementById('cart-total-price').innerText = `$${total.toFixed(2)}`;
    localStorage.setItem('cart', JSON.stringify(cart));

    const quantityMinusButtons = document.querySelectorAll('.quantity-minus');
    const quantityPlusButtons = document.querySelectorAll('.quantity-plus');

    quantityMinusButtons.forEach((button, index) => {
        button.addEventListener('click', () => changeQuantity(index, -1));
    });

    quantityPlusButtons.forEach((button, index) => {
        button.addEventListener('click', () => changeQuantity(index, 1));
    });
}


// Ensure PayPal is initialized when the page loads
window.onload = function() {
    updateCart(); // Update cart and initialize PayPal button
   
};


function changeQuantity(index, change) {
    const item = cart[index];
    const product = products[item.productId]; // Get the product details
    const stock = product.stock[item.size][item.color];

    // Change quantity only if within stock limits
    if (change === 1) {
        if (item.quantity < stock) {
            item.quantity += 1;
        } else {
            alert(`Cannot add more items to the cart. Only ${stock} item(s) available in stock for ${item.name} (${item.size}, ${item.color}).`);
        }
    } else if (change === -1) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            // Remove item from the cart if quantity reaches zero
            removeFromCart(index);
            return;
        }
    }

    updateCart();
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
