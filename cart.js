let inventory = JSON.parse(localStorage.getItem('inventory')) || [];



async function fetchInventory() {
    try {
        const response = await fetch('/api/inventory'); // Fetch inventory data from Supabase
        if (!response.ok) throw new Error('Failed to fetch inventory');

        inventory = await response.json(); // Store the fetched inventory in the global variable
        console.log('Fetched Inventory:', inventory);

        // Populate your product details based on the fetched data
        const productId = document.querySelector('.product-page-container').dataset.productId;
        const product = inventory.find(p => p.id === productId);

        if (product) {
            document.getElementById('product-name').innerText = product.name;
            document.getElementById('product-description').innerText = product.description;
            document.getElementById('product-price').innerText = `$${product.prices.small.red}`; // Set initial price
            updateStockAndOptions(product); // Update options and stock display
        } else {
            console.error('Product not found');
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

localStorage.setItem('inventory', JSON.stringify(inventory));

let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCart(); // Ensure cart is updated based on localStorage
// Ensure the cart is updated when the page loads
window.onload = function() {
    updateCart(); // Ensure cart is updated when the page loads
    const productId = document.querySelector('.product-page-container').dataset.productId; // Get product ID
    fetchInventory(productId); // Fetch inventory for the product based on the ID
};
// Function to fetch inventory data
// Function to fetch inventory data


// Function to populate size and color options
function updateStockAndOptions(product) {
    const sizeSelect = document.getElementById('size');
    sizeSelect.innerHTML = ''; // Clear previous options
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.toLowerCase();
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    const colorSelect = document.getElementById('color');
    colorSelect.innerHTML = ''; // Clear previous options
    product.colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    // Update stock display based on initial selections
    updatePriceAndStockDisplay(product);
    
    // Add event listeners for changes
    sizeSelect.addEventListener('change', () => updatePriceAndStockDisplay(product));
    colorSelect.addEventListener('change', () => updatePriceAndStockDisplay(product));
}
// Ensure `openCart` function is defined before it's called
function openCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');
    cartPopup.classList.add('show');
    cartWrapper.classList.add('show');
}

// Close Cart Function
function closeCart() {
    const cartPopup = document.getElementById('cart-popup');
    const cartWrapper = document.getElementById('cart-popup-wrapper');
    cartPopup.classList.remove('show');
    setTimeout(() => {
        cartWrapper.classList.remove('show');
    }, 400); // Matches the CSS transition
}
// Function to update price and stock display
function updatePriceAndStockDisplay(product) {
    const selectedSize = document.getElementById('size').value;
    const selectedColor = document.getElementById('color').value;

    const price = product.prices[selectedSize][selectedColor];
    document.getElementById('product-price').innerText = `$${price.toFixed(2)}`;

    const stock = product.stock[selectedSize][selectedColor];
    document.getElementById('stock-quantity').innerText = stock;

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.disabled = stock <= 0; // Disable button if out of stock
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

// Function to add product to the cart
async function addToCart(productId) {
    // Ensure productId is a number for comparison
    const product = inventory.find(p => p.id === parseInt(productId, 10)); // Ensure we have the right product

    if (!product) {
        alert('Product not found.');
        return; // Exit if product is not found
    }

    const size = document.getElementById('size').value.toLowerCase(); // Get selected size
    const color = document.getElementById('color').value.toLowerCase(); // Get selected color

    const availableStock = product.stock[size][color];
    const existingProduct = cart.find(item => item.productId === productId && item.size === size && item.color === color);

    if (!existingProduct) {
        if (availableStock <= 0) {
            alert(`Cannot add more items to the cart. Only ${availableStock} item(s) available.`);
            return;
        }

        cart.push({
            productId: productId,
            name: product.name,
            price: product.prices[size][color],
            quantity: 1,
            size: size,
            color: color,
            image: product.image // Ensure image URL is available in product data
        });
    } else {
        if (existingProduct.quantity >= availableStock) {
            alert(`Cannot add more items to the cart. Only ${availableStock} item(s) available.`);
            return;
        }
        existingProduct.quantity += 1; // Increase quantity
    }

    // Update localStorage and cart display
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    openCart(); // Open cart after adding
}
window.onload = function() {
    // Load inventory from localStorage if it exists
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    updateCart(); // Ensure cart is updated when the page loads
    const productId = document.querySelector('.product-page-container').dataset.productId; // Get product ID
    fetchInventory(productId); // Fetch inventory for the product based on the ID
};

// Function to remove an item from the cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}
async function changeQuantity(index, change) {
    const item = cart[index];  // Get the item from the cart
    let product = inventory.find(p => p.id === item.productId); // Try to find the product in the inventory

    // If the product is not found in the local inventory, fetch it again
    if (!product) {
        await fetchInventory(item.productId); // Refetch inventory if product is missing
        inventory = JSON.parse(localStorage.getItem('inventory')) || []; // Reload the inventory from localStorage
        product = inventory.find(p => p.id === item.productId); // Try to find the product again
    }

    // If the product is still not found after refetching, display an error
    if (!product) {
        alert('Product not found in inventory.');
        return;
    }

    // Get the stock for the selected size and color
    const stock = product.stock[item.size][item.color];

    // Handle increasing or decreasing the quantity
    if (change === 1 && item.quantity < stock) {
        item.quantity += 1; // Increase quantity if there's stock available
    } else if (change === -1 && item.quantity > 1) {
        item.quantity -= 1; // Decrease quantity if it's above 1
    } else if (change === -1 && item.quantity === 1) {
        removeFromCart(index); // Remove item if quantity becomes zero
        return;
    } else {
        alert(`Cannot add more than available stock (${stock})`);
    }

    updateCart(); // Update the cart after the quantity change
}




// Add event listener to the cart button to open the cart popup
document.getElementById('cart-button').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    openCart();
});

// Close the cart when clicking outside of it
document.getElementById('cart-popup-wrapper').addEventListener('click', closeCartOnClickOutside);

// Function to close cart when clicking outside the cart area
function closeCartOnClickOutside(event) {
    // If the clicked target is the wrapper (outside the cart), close the cart
    if (event.target === document.getElementById('cart-popup-wrapper')) {
        closeCart();
    }
}

// Ensure the cart is updated when the page loads
window.onload = updateCart;
// Ensure the cart is updated when the page loads
window.onload = function() {
    updateCart(); // Ensure cart is updated when the page loads
    const productId = document.querySelector('.product-page-container').dataset.productId; // Get product ID
    fetchInventory(productId); // Fetch inventory for the product based on the ID
};