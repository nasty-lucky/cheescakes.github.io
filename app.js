// Cart State Management
class CartManager {
    constructor() {
        this.cart = {
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
        };
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Cart trigger button
        const cartTrigger = document.querySelector('.cart-trigger');
        cartTrigger.addEventListener('click', () => this.toggleCart());

        // Close modal button
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => this.closeCart());

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleAddToCart(e));
        });

        // Click outside modal to close
        document.querySelector('.cart-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-modal')) {
                this.closeCart();
            }
        });

        // Checkout button
        document.querySelector('.checkout-btn').addEventListener('click', () => {
            this.handleCheckout();
        });
    }

    toggleCart() {
        const modal = document.querySelector('.cart-modal');
        modal.classList.toggle('active');
        document.body.style.overflow = modal.classList.contains('active') ? 'hidden' : '';
    }

    closeCart() {
        const modal = document.querySelector('.cart-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async handleAddToCart(event) {
        const card = event.target.closest('.cheesecake-card');
        const productData = this.getProductData(card);
        
        // Create and animate floating image
        await this.animateAddToCart(card);
        
        // Add item to cart
        this.addItem(productData);
        
        // Update UI
        this.updateCartDisplay();
        this.animateCartCount();
        this.saveToLocalStorage();
    }

    getProductData(card) {
        return {
            id: card.dataset.id,
            name: card.querySelector('h3').textContent,
            price: parseFloat(card.querySelector('.price').textContent.replace('Р', '')),
            image: card.querySelector('.image-container img').src
        };
    }

    async animateAddToCart(card) {
        return new Promise(resolve => {
            const productImage = card.querySelector('.image-container img');
            const cartIcon = document.querySelector('.cart-trigger');
            const floatImage = document.createElement('div');
            
            // Setup floating image
            floatImage.className = 'float-image';
            floatImage.innerHTML = `<img src="${productImage.src}" alt="Flying cheesecake">`;
            document.body.appendChild(floatImage);

            // Get positions
            const startRect = productImage.getBoundingClientRect();
            const endRect = cartIcon.getBoundingClientRect();

            // Calculate movement
            const moveX = endRect.left - startRect.left;
            const moveY = endRect.top - startRect.top;

            // Position and animate
            floatImage.style.cssText = `
                top: ${startRect.top}px;
                left: ${startRect.left}px;
                width: ${startRect.width}px;
                height: ${startRect.height}px;
                --moveX: ${moveX}px;
                --moveY: ${moveY}px;
            `;

            // Start animation
            requestAnimationFrame(() => {
                floatImage.style.animation = 'floatToCart 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            });

            // Cleanup after animation
            floatImage.addEventListener('animationend', () => {
                floatImage.remove();
                resolve();
            });
        });
    }

    addItem(productData) {
        const existingItem = this.cart.items.find(item => item.id === productData.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.items.push({
                ...productData,
                quantity: 1
            });
        }
        
        this.updateTotals();
    }

    removeItem(itemId) {
        this.cart.items = this.cart.items.filter(item => item.id !== itemId);
        this.updateTotals();
        this.updateCartDisplay();
        this.saveToLocalStorage();
    }

    updateQuantity(itemId, delta) {
        const item = this.cart.items.find(item => item.id === itemId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(itemId);
            } else {
                this.updateTotals();
                this.updateCartDisplay();
                this.saveToLocalStorage();
            }
        }
    }

    updateTotals() {
        this.cart.subtotal = this.cart.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
        this.cart.total = this.cart.subtotal;
    }

    updateCartDisplay() {
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        const itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'flex' : 'none';

        // Update cart items
        const cartItems = document.querySelector('.cart-items');
        cartItems.innerHTML = '';
        
        this.cart.items.forEach(item => {
            const itemElement = this.createCartItemElement(item);
            cartItems.appendChild(itemElement);
        });

        document.querySelector('.total-amount').textContent = `${this.cart.total.toFixed(2)}₽`;
    }

    createCartItemElement(item) {
        const template = document.querySelector('#cart-item-template');
        const itemElement = template.content.cloneNode(true).querySelector('.cart-item');

        // Fill in item details
        itemElement.querySelector('img').src = item.image;
        itemElement.querySelector('.cart-item-title').textContent = item.name;
        itemElement.querySelector('.cart-item-price').textContent = `${(item.price * item.quantity).toFixed(2)}₽`;
        itemElement.querySelector('.quantity').textContent = item.quantity;

        // Setup event listeners
        itemElement.querySelector('.plus').addEventListener('click', () => 
            this.updateQuantity(item.id, 1));
        itemElement.querySelector('.minus').addEventListener('click', () => 
            this.updateQuantity(item.id, -1));
        itemElement.querySelector('.remove-item').addEventListener('click', () => 
            this.removeItem(item.id));

        return itemElement;
    }

    animateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        cartCount.classList.add('bump');
        setTimeout(() => cartCount.classList.remove('bump'), 300);
    }

    saveToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadFromLocalStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
    }

    handleCheckout() {
        if (this.cart.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Here you would typically redirect to checkout page or open checkout modal
        alert('Proceeding to checkout...');
        // window.location.href = '/checkout'; // Uncomment when checkout page is ready
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});