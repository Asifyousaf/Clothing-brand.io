let inventory = JSON.parse(localStorage.getItem('inventory')) || []; // Initialize inventory from localStorage or an empty array

async function fetchProductFromSupabase(productId) {
    try {
        // Check if the product is already in the local inventory
        let product = inventory.find(item => item.id === productId);
        
        if (!product) {
            // Fetch the product from the API if not in local inventory
            const response = await fetch(`/api/inventory?productId=${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product data');

            product = await response.json(); // Get the product data

            // Add the fetched product to the inventory
            inventory.push(product);
            localStorage.setItem('inventory', JSON.stringify(inventory)); // Store the updated inventory in localStorage
        }

        return product; // Return the product data (either from local or fetched)
    } catch (error) {
        console.error('Error fetching product from Supabase:', error);
        return null;
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded and parsed');

    // Extract product ID from the data attribute in the HTML
    const productContainer = document.querySelector('.product-page-container');
    const productId = productContainer.dataset.productId;

    // Fetch product data from Supabasea
    const product = await fetchProductFromSupabase(productId);

    if (product) {
        loadProductDetails(product);  // Populate the page with fetched data
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

    // Clear previous options
    sizeSelect.innerHTML = '';
    colorSelect.innerHTML = '';

    // Populate size options from Supabase data
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.toLowerCase();
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    // Populate color options from Supabase data
    product.colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    // Update price based on size and color selection
    sizeSelect.addEventListener('change', () => updatePrice(product));
    colorSelect.addEventListener('change', () => updatePrice(product));

    // Trigger updatePrice function on page load to set default price and stock
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
            addToCartBtn.innerText = 'Add to Cart'; // If in stock
            addToCartBtn.disabled = false; // Enable button
        } else {
            addToCartBtn.innerText = 'Sold Out'; // If out of stock
            addToCartBtn.disabled = true; // Disable button
        }
    } else {
        priceDisplay.innerText = "$0.00"; // Reset price display
        stockInfo.innerText = "N/A"; // Reset stock info
        addToCartBtn.innerText = 'Sold Out'; // Disable the button
        addToCartBtn.disabled = true; // Disable button
    }
}
