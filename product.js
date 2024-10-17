let cart = JSON.parse(localStorage.getItem('cart')) || [];
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

// Ensure the cart and product details are updated on page load
window.onload = async function () {
    updateCart(); // Update cart from localStorage

    const productId = document.querySelector('.product-page-container').dataset.productId; // Get product ID
    const product = await fetchProductFromSupabase(productId); // Fetch inventory for the product

    if (product) {
        loadProductDetails(product); // Load the product details into the page
    } else {
        console.error('Product not found');
    }
};

// Fetch product details from Supabase
async function fetchProductFromSupabase(productId) {
    try {
        let product = inventory.find(item => item.id === productId);

        if (!product) {
            console.log('Product not found in local inventory, fetching from API...');
            const response = await fetch(`/api/inventory?productId=${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product data');

            const responseData = await response.json();
            product = Array.isArray(responseData) ? responseData[0] : responseData;

            if (!inventory.find(item => item.id === product.id)) {
                inventory.push(product); // Add to inventory
                localStorage.setItem('inventory', JSON.stringify(inventory)); // Save to localStorage
            }
        }

        return product; // Return product data
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Load product details onto the page
function loadProductDetails(product) {
    const sizeSelect = document.getElementById('size');
    const colorSelect = document.getElementById('color');
    const priceDisplay = document.getElementById('product-price');
    const stockInfo = document.getElementById('stock-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    sizeSelect.innerHTML = '';
    colorSelect.innerHTML = '';

    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.toLowerCase();
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    product.colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    sizeSelect.addEventListener('change', () => updatePrice(product));
    colorSelect.addEventListener('change', () => updatePrice(product));

    updatePrice(product); // Update the price and stock initially
}

// Update the price and stock information based on selected size and color
function updatePrice(product) {
    const selectedSize = document.getElementById('size').value;
    const selectedColor = document.getElementById('color').value;
    const priceDisplay = document.getElementById('product-price');
    const stockInfo = document.getElementById('stock-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    const sizePrices = product.prices[selectedSize];
    const sizeStock = product.stock[selectedSize];

    if (sizePrices && sizePrices[selectedColor] !== null && sizeStock && sizeStock[selectedColor] !== undefined) {
        const price = sizePrices[selectedColor];
        const stock = sizeStock[selectedColor];

        priceDisplay.innerText = `$${price.toFixed(2)}`;
        stockInfo.innerText = stock;

        if (stock > 0) {
            addToCartBtn.innerText = 'Add to Cart';
            addToCartBtn.disabled = false;
        } else {
            addToCartBtn.innerText = 'Sold Out';
            addToCartBtn.disabled = true;
        }
    } else {
        priceDisplay.innerText = "$0.00";
        stockInfo.innerText = "N/A";
        addToCartBtn.innerText = 'Sold Out';
        addToCartBtn.disabled = true;
    }
}

// Update the cart UI
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

        // Add quantity change functionality
        quantityControl.querySelector('.quantity-minus').addEventListener('click', () => changeQuantity(index, -1));
        quantityControl.querySelector('.quantity-plus').addEventListener('click', () => changeQuantity(index, 1));
    });

    document.getElementById('cart-total-price').innerText = `$${total.toFixed(2)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Change quantity in cart
async function changeQuantity(index, change) {
    const item = cart[index];
    const product = inventory.find(p => p.id === item.productId);

    if (!product) {
        alert('Product not found in inventory.');
        return;
    }

    const stock = product.stock[item.size][item.color];

    if (change === 1 && item.quantity < stock) {
        item.quantity += 1;
    } else if (change === -1 && item.quantity > 1) {
        item.quantity -= 1;
    } else if (change === -1 && item.quantity === 1) {
        removeFromCart(index);
        return;
    }

    updateCart();
}

// Remove an item from the cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Event listeners for opening and closing cart
document.getElementById('cart-button').addEventListener('click', function (event) {
    event.preventDefault();
    openCart();
});

document.getElementById('cart-popup-wrapper').addEventListener('click', closeCartOnClickOutside);

function openCart() {
    document.getElementById('cart-popup').classList.add('show');
    document.getElementById('cart-popup-wrapper').classList.add('show');
}

function closeCart() {
    document.getElementById('cart-popup').classList.remove('show');
    setTimeout(() => {
        document.getElementById('cart-popup-wrapper').classList.remove('show');
    }, 400); // Matches CSS transition
}

function closeCartOnClickOutside(event) {
    if (event.target === document.getElementById('cart-popup-wrapper')) {
        closeCart();
    }
}
