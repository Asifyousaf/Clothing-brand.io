
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





// Function to open the cart popup
function openCart() {
    document.getElementById('cart-popup').classList.add('show');
}

// Function to close the cart popup
function closeCart() {
    document.getElementById('cart-popup').classList.remove('show');
}




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
// Function to handle the checkout process via PayTabs
// Function to handle the checkout process via PayTabs
async function checkoutWithPayTabs() {
    try {
        // Gather line items from cart
        const cartItems = cart.map(item => ({
            name: item.name, // Product name
            quantity: item.quantity, // Quantity
            amount: item.price.toFixed(2), // Unit price in string format
            description: `${item.size} ${item.color}` // Additional details about the item
        }));

        // Prepare the payload for PayTabs
        const payload = {
            "profile_id": "153021", // Your PayTabs profile ID
            "tran_type": "sale",
            "tran_class": "ecom",
            "cart_description": "Your Store Cart", // Description of the cart
            "cart_id": "cart_" + new Date().getTime(), // Unique cart ID
            "cart_currency": "USD", // Adjust currency as needed
            "cart_amount": calculateTotalCartPrice(), // Total amount
            "cart_items": cartItems, // List of items
            "customer_details": {
                "name": "John Doe", // Dynamic user data
                "email": "johndoe@example.com",
                "phone": "+1234567890",
                "street1": "Address",
                "city": "City",
                "state": "State",
                "country": "AE", // Adjust based on your country
                "zip": "12345"
            },
            "callback": "https://yourwebsite.com/callback", // Your callback URL after payment
            "return": "https://yourwebsite.com/success", // Success page
            "cancel": "https://yourwebsite.com/cancel", // Cancel page
            "hide_shipping": true // Optional: hide shipping fields
        };

        // Send the payload to your backend server to create the PayTabs session
        const response = await fetch('http://localhost:3000/create-paytabs-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Send payload to the server
        });

        // Check if the response is successful
        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error('Failed to create payment session: ' + errorMsg);
        }

        const result = await response.json();

        // Check if we got a payment URL back from PayTabs
        if (result.payment_url) {
            // Redirect the user to the PayTabs payment page
            window.location.href = result.payment_url;
        } else {
            throw new Error('No payment URL returned from PayTabs');
        }

    } catch (error) {
        console.error('Checkout error:', error); // Log the detailed error
        alert('Error occurred during checkout. Please try again. ' + error.message); // Display user-friendly error
    }
}

// Helper function to calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

// Calculate the total cart price
function calculateTotalCartPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

// Generate product descriptions for PayPal
function generateProductDescription() {
    return cart.map(item => `${item.name} (${item.size}, ${item.color}) x${item.quantity}`).join(', ');
}

// Update the cart and initialize the PayPal button
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = ''; // Clear existing items
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


    // Attach event listeners for quantity buttons
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
    initializePayPalButton(); // Initialize PayPal button once
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
