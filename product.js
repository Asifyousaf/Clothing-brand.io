let cart = JSON.parse(localStorage.getItem('cart')) || [];
let inventory = []; // Start with an empty inventory array

// Update the cart on page load
window.onload = function () {
    updateCart();
    const productId = document.querySelector('.product-page-container').dataset.productId;
    fetchProductFromSupabase(productId).then(product => {
        if (product) {
            loadProductDetails(product);
        }
    });
};

// Function to fetch product data from Supabase
async function fetchProductFromSupabase(productId) {
    try {
        const response = await fetch(`/api/inventory?productId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product data');
        
        const responseData = await response.json();
        const product = Array.isArray(responseData) ? responseData[0] : responseData;

        if (product) {
            // Update local inventory with the latest data
            const existingProductIndex = inventory.findIndex(item => item.id === product.id);
            if (existingProductIndex !== -1) {
                inventory[existingProductIndex] = product; // Update existing product
            } else {
                inventory.push(product); // Add new product
            }
            localStorage.setItem('inventory', JSON.stringify(inventory)); // Update localStorage
        }
        return product;
    } catch (error) {
        console.log(`Current Product ID: ${productId}`);

        console.error('Error fetching product from Supabase:', error);
        return null;
    }
}
const colorToImageMap = {
    "black": "img/emg/tshirt-black.png",
    "white": "img/emg/tshirt-white.png"
};

// Load product details into the page
function loadProductDetails(product) {
    const sizeSelect = document.getElementById('size');
    const colorSelect = document.getElementById('color');
    const priceDisplay = document.getElementById('product-price');
    const stockInfo = document.getElementById('stock-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    sizeSelect.innerHTML = '';
    colorSelect.innerHTML = '';

    // Create a dynamic color-to-image mapping for the current product
    const colorToImageMap = {};

    // Example for mapping images based on product ID or other identifiers
    if (product.id === 34) {  // Example product ID for a shirt
        colorToImageMap["black"] = "img/emg/shirt-black.png";
        colorToImageMap["white"] = "img/emg/shirt-white.png";
    } else if (product.id === 26) {  // Example product ID for shorts
        colorToImageMap["black"] = "img/emg/ShortsB(01Black).png";
        colorToImageMap["blue"] = "img/emg/ShortsF(01Blue).png";
    }

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
        option.setAttribute('data-image', colorToImageMap[color.toLowerCase()]);  // Set the image based on color
        colorSelect.appendChild(option);
    });

    sizeSelect.addEventListener('change', () => updatePrice(product));
    
    // Set event listener to change image based on selected color
    colorSelect.addEventListener('change', function () {
        changeProductImage(colorToImageMap);  // Pass the current product's image mapping
    });

    updatePrice(product); // Call updatePrice initially to set default values
}

// Function to update the image based on selected color
function changeProductImage() {
    const selectedColor = document.getElementById('color').value;
    
    // Get all preview images
    const previews = document.querySelectorAll('.preview');
    
    // Hide all preview images first
    previews.forEach(img => img.style.display = 'none');
    
    // Show only the images that match the selected color
    previews.forEach(img => {
        if (img.getAttribute('data-color') === selectedColor) {
            img.style.display = 'block';
        }
    });
    
    // Change the main product image to the first matching preview image
    const firstVisibleImage = document.querySelector(`.preview[data-color="${selectedColor}"]`);
    if (firstVisibleImage) {
        document.getElementById('main-product-image').src = firstVisibleImage.src;
    }
}


// Update price and stock info when size or color changes
function updatePrice(product) {
    const selectedSize = document.getElementById('size').value;
    const selectedColor = document.getElementById('color').value;
    const priceDisplay = document.getElementById('product-price');
    const stockInfo = document.getElementById('stock-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    const sizePrices = product.prices[selectedSize];
    const sizeStock = product.stock[selectedSize];

    if (sizePrices && sizePrices[selectedColor] !== undefined && sizeStock && sizeStock[selectedColor] !== undefined) {
        const price = sizePrices[selectedColor];
        const stock = sizeStock[selectedColor];

        priceDisplay.innerText = `$${price.toFixed(2)}`;
        stockInfo.innerText = stock;

        addToCartBtn.innerText = stock > 0 ? 'Add to Cart' : 'Sold Out';
        addToCartBtn.disabled = stock <= 0; // Disable button if out of stock
    } else {
        priceDisplay.innerText = "$0.00";
        stockInfo.innerText = "N/A";
        addToCartBtn.innerText = 'Sold Out';
        addToCartBtn.disabled = true;
    }
}

// Add product to cart
async function addToCart(productId) {
    const product = inventory.find(p => p.id === parseInt(productId, 10));
    if (!product) {
        alert('Product not found.');
        return;
    }

    const size = document.getElementById('size').value.toLowerCase();
    const color = document.getElementById('color').value.toLowerCase();
    const availableStock = product.stock[size][color];
    const existingProduct = cart.find(item => item.productId === productId && item.size === size && item.color === color);
    // Get the image from the currently displayed product image
       // Get the image from the currently displayed product image
       const imageElement = document.getElementById('main-product-image');
       const imageSrc = imageElement ? imageElement.src : '';
    if (!existingProduct) {
        if (availableStock <= 0) {
            alert(`Cannot add more items. Only ${availableStock} in stock.`);
            return;
        }

        cart.push({
            productId: productId,
            name: product.name,
            price: product.prices[size][color],
            quantity: 1,
            size: size,
            color: color,
            image: imageSrc  // Use the image from the HTML page
        });
    } else {
        if (existingProduct.quantity >= availableStock) {
            alert(`Cannot add more. Only ${availableStock} in stock.`);
            return;
        }
        existingProduct.quantity += 1;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    openCart();
}

// Update cart display
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

    document.getElementById('cart-total-price').innerText = `AED ${total.toFixed(2)}`;
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

// Change quantity in the cart
async function changeQuantity(index, change) {
    const item = cart[index];
    let product = inventory.find(p => p.id === item.productId);

    // If product is not found in inventory, fetch it again
    if (!product) {
        product = await fetchProductFromSupabase(item.productId);
        if (!product) {
            alert('Product not found in inventory.');
            return;
        }
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

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Open and close cart functions
function openCart() {
    document.getElementById('cart-popup').classList.add('show');
    document.getElementById('cart-popup-wrapper').classList.add('show');
}

function closeCart() {
    document.getElementById('cart-popup').classList.remove('show');
    setTimeout(() => {
        document.getElementById('cart-popup-wrapper').classList.remove('show');
    }, 400);
}

document.getElementById('cart-button').addEventListener('click', function(event) {
    event.preventDefault();
    openCart();
});

document.getElementById('cart-popup-wrapper').addEventListener('click', closeCartOnClickOutside);

function closeCartOnClickOutside(event) {
    if (event.target === document.getElementById('cart-popup-wrapper')) {
        closeCart();
    }
}
