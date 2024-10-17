let inventory = [];
async function fetchProduct(productId) {
    try {
        const response = await fetch(`/api/inventory?productId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product data');

        const productData = await response.json();
        if (Array.isArray(productData) && productData.length > 0) {
            const product = productData[0];
            inventory.push(product); // Add product to inventory array if needed
            updateStockAndOptions(product); // Update the UI
            updatePriceAndStockDisplay(product); // Update the UI
            return product; // Optionally return the product for further use
        } else {
            console.error('Product not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded and parsed');

    // Extract product ID from the data attribute in the HTML
    const productContainer = document.querySelector('.product-page-container');
    const productId = productContainer.dataset.productId;

    // Fetch product data from Supabase
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
