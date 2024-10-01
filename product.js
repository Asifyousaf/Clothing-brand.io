window.onload = function() {
    updateCart(); // Ensure the cart is updated when the page loads
    renderProducts(); // If you need to render products when loading the page
};

    const userPurchaseLimit = 1;
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
                userLimit: 2, // Limit for this specific product
                image: 'img/shirt1.png'
            }
        };

        // Load product details dynamically
        const productId = "shirt1"; 
        const product = products[productId];

        // Populate size and color options
        const sizeSelect = document.getElementById('size');
        const colorSelect = document.getElementById('color');
        const priceDisplay = document.getElementById('product-price');

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
        sizeSelect.addEventListener('change', updatePrice);
        colorSelect.addEventListener('change', updatePrice);

        function updatePrice() {
            const selectedSize = sizeSelect.value;
            const selectedColor = colorSelect.value;
            const stockInfo = document.getElementById('stock-quantity');
            const addToCartBtn = document.getElementById('add-to-cart-btn'); // Add to Cart button

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
                alert("The selected size and color combination is not available. Please choose a different option.");
                priceDisplay.innerText = "$0.00"; // Reset price display
                stockInfo.innerText = "N/A"; // Reset stock info
                addToCartBtn.innerText = 'Sold Out'; // Disable the button
                addToCartBtn.disabled = true; // Disable button
            }
        }

        // Trigger updatePrice function on page load to set default price and stock
        window.onload = updatePrice;