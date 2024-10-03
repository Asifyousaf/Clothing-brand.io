// Example of product data (can be extended)
const products = {
    "shirt1": {
        name: "Cool Shirt",
        description: "A stylish and cool shirt for all occasions.",
        prices: {
            small: { red: 49.99, blue: 49.99, black: 49.99 },
            medium: { red: 54.99, blue: 54.99, black: 54.99 },
            large: { red: 59.99, blue: null, black: 59.99 },
            xl: { red: 64.99, blue: 64.99, black: 64.99 }
        },
        sizes: ["Small", "Medium", "Large", "XL"],
        colors: ["Red", "Blue", "Black"],
        stock: {
            small: { red: 10, blue: 5, black: 2 },
            medium: { red: 7, blue: 3, black: 8 },
            large: { red: 4, blue: 0, black: 6 },
            xl: { red: 9, blue: 2, black: 5 }
        },
        userLimit: 2,
        image: 'img/shirt1.png'
    },
    "pants1": {
        name: "Casual Pants",
        description: "Comfortable and stylish casual pants.",
        prices: {
            small: { red: 39.99, blue: 39.99, black: 39.99 },
            medium: { red: 44.99, blue: 44.99, black: 44.99 },
            large: { red: 49.99, blue: 49.99, black: 49.99 },
            xl: { red: 54.99, blue: 54.99, black: 54.99 }
        },
        sizes: ["Small", "Medium", "Large", "XL"],
        colors: ["Red", "Blue", "Black"],
        stock: {
            small: { red: 115, blue: 10, black: 5 },
            medium: { red: 8, blue: 6, black: 7 },
            large: { red: 4, blue: 0, black: 3 },
            xl: { red: 5, blue: 2, black: 1 }
        },
        userLimit: 3,
        image: 'img/shirt1.png'
    }
};

// Load product details dynamically
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // Extract product ID from the data attribute in the HTML
    const productContainer = document.querySelector('.product-page-container');
    const productId = productContainer.dataset.productId;

    if (productId && products[productId]) {
        loadProductDetails(productId);
    } else {
        console.error('Product ID not found or invalid');
    }
});

function loadProductDetails(productId) {
    const product = products[productId];
    const sizeSelect = document.getElementById('size');
    const colorSelect = document.getElementById('color');
    const priceDisplay = document.getElementById('product-price');
    const stockInfo = document.getElementById('stock-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // Clear previous options
    sizeSelect.innerHTML = '';
    colorSelect.innerHTML = '';

    // Populate size options
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.toLowerCase();
        option.textContent = size;
        sizeSelect.appendChild(option);
    });

    // Populate color options
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
