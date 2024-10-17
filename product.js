let inventory = JSON.parse(localStorage.getItem('inventory')) || []; // Initialize inventory from localStorage or an empty array

async function fetchProductFromSupabase(productId) {
    try {
        // Check if the product is already in the local inventory
        let product = inventory.find(item => item.id === productId);

        if (!product) {
            console.log('Product not found in local inventory, fetching from API...');

            // Fetch the product from the API if not in local inventory
            const response = await fetch(`/api/inventory?productId=${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product data');

            const responseData = await response.json();
            product = Array.isArray(responseData) ? responseData[0] : responseData; 

            // Add the product to the inventory
            if (!inventory.find(item => item.id === product.id)) {
                inventory.push(product);
                localStorage.setItem('inventory', JSON.stringify(inventory));
            }
        }

        return product; // Return the product data
    } catch (error) {
        console.error('Error fetching product from Supabase:', error);
        return null;
    }
}

console.log('Current Inventory:', JSON.parse(localStorage.getItem('inventory')));

async function changeQuantity(index, change) {
    const item = cart[index];
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
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
    localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener('DOMContentLoaded', async function() {
    const productContainer = document.querySelector('.product-page-container');
    const productId = productContainer.dataset.productId;
    const product = await fetchProductFromSupabase(productId);

    if (product) {
        loadProductDetails(product);
    } else {
        console.error('Product data not found or invalid');
    }
});

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

    updatePrice(product);
}

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
