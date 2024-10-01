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

function openCart() {
    // Your existing code to open the cart
    const cartPopup = document.getElementById('cart-popup-wrapper');
    cartPopup.style.display = 'block';
}





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

    const existingProduct = cart.find(item => item.name === product.name && item.size === size && item.color === color);

    if (!existingProduct) {
        // Check if the quantity in the cart exceeds the available stock
        const availableStock = product.stock[size][color];
        if (availableStock <= 0) {
            alert(`Cannot add more items to the cart. Only ${availableStock} item(s) available in stock for ${product.name} (${size}, ${color}).`);
            return;
        }

        // Add new product to the cart with the image URL
        cart.push({ 
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
    openCart(); // Automatically open cart when an item is added
}

// Function to handle the checkout process
async function checkout() {
    // Check stock for each item in the cart
    for (let item of cart) {
        const availableStock = product.stock[item.size][item.color];
        if (item.quantity > availableStock) {
            alert(`Cannot proceed to checkout. Only ${availableStock} item(s) available in stock for ${item.name} (${item.size}, ${item.color}).`);
            return;
        }
    }

    // Gather line items for Stripe
    const lineItems = cart.map(item => ({
        price_data: {
            currency: 'dhs', // or your preferred currency
            product_data: {
                name: item.name,
                images: [item.image],
                description: `${item.size} ${item.color}`, // Description can be customized
            },
            unit_amount: Math.round(item.price * 100), // Price in cents
        },
        quantity: item.quantity,
    }));

    // Create a new checkout session
    const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ line_items: lineItems }),
    });

    const session = await response.json();

    // Redirect to Stripe Checkout
    if (session.id) {
        const stripe = Stripe(pk_test_51Q4iWzJEY1WRV9LDiqJLH3WMWRjNBPUaXIAbQWPnpEtc7iTYKPi3lLb2HtlNlBv30NB1VXbbvc9HUQY6LPqJPUMX00RYhrXjGM); // Replace with your Stripe publishable key
        await stripe.redirectToCheckout({ sessionId: session.id });
    } else {
        alert("Failed to create checkout session. Please try again.");
    }

    closeCart(); // Close cart after initiating checkout
}


function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = ''; // Clear the existing items in the cart
    let total = 0;

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        const itemImage = document.createElement('img');
        itemImage.src = item.image; // Use the stored image URL here
        itemDiv.appendChild(itemImage);

        const itemDetails = document.createElement('div');
        itemDetails.classList.add('cart-item-details');
        itemDetails.innerHTML = `
            <span class="item-name">${item.name} (${item.size}, ${item.color})</span>
            <span class="item-price">$${item.price.toFixed(2)} x ${item.quantity}</span>
        `;
        itemDiv.appendChild(itemDetails);

        // Quantity control buttons
        const quantityControl = document.createElement('div');
        quantityControl.classList.add('quantity-control');
        quantityControl.innerHTML = `
            <button onclick="changeQuantity(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQuantity(${index}, 1)">+</button>
        `;
        itemDiv.appendChild(quantityControl);

        // Remove item button
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-btn');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeFromCart(index);
        itemDiv.appendChild(removeBtn);

        cartItemsContainer.appendChild(itemDiv);
        total += item.price * item.quantity; // Calculate total price
    });

    // Update the total price in the cart
    document.getElementById('cart-total-price').innerText = `$${total.toFixed(2)}`;
    
    // Save the updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}


function changeQuantity(index, change) {
    const item = cart[index];
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

// Function to render products (for demo purposes)
function renderProducts() {
    console.log("Rendering products...");
}
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 50) {  // Trigger after scrolling down 50px
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// Function to handle scroll and change the logo
window.addEventListener('scroll', function() {
    var navbar = document.querySelector('.navbar');
    var logoContainer = document.querySelector('.logo-center');
    var logoImage = document.getElementById('logo-img');
    var logoText = document.createElement('span');

    // Check scroll position (adjust 100 as needed)
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
        
        // Replace logo with text
        if (!document.querySelector('.logo-text')) {
            logoText.classList.add('logo-text');
            logoText.innerText = 'CyberTronic'; // The new text
            logoContainer.appendChild(logoText);
        }
    } else {
        navbar.classList.remove('scrolled');
        
        // Switch back to the logo image
        if (document.querySelector('.logo-text')) {
            document.querySelector('.logo-text').remove();
        }
    }
});


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
