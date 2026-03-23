/**
 * Wishlist Logic
 * Handles item management and budget matching
 */

// const defaultWishlist = [
//     { id: 1, name: "iPhone 15 Pro", price: 18000000 },
//     { id: 2, name: "Logitech MX Master 3S", price: 1500000 },
//     { id: 3, name: "Mechanical Keyboard", price: 800000 }
// ];

const state = {
    wishlist: JSON.parse(localStorage.getItem('wishlist')) || defaultWishlist,
    budget: parseFloat(localStorage.getItem('budget')) || 0
};

// DOM Elements
const budgetInput = document.getElementById('budgetInput');
const itemNameInput = document.getElementById('itemNameInput');
const itemPriceInput = document.getElementById('itemPriceInput');
const addItemBtn = document.getElementById('addItemBtn');
const wishlistContainer = document.getElementById('wishlistItems');
const totalCostEl = document.getElementById('totalCost');
const achievedCountEl = document.getElementById('achievedCount');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

// Helper to format number to ID-ID string with dot separator
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Initialize
function init() {
    budgetInput.value = formatNumber(state.budget);
    render();

    // Event Listeners for Input Formatting
    budgetInput.addEventListener('input', (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numValue = parseInt(rawValue) || 0;
        state.budget = numValue;
        e.target.value = formatNumber(numValue);
        localStorage.setItem('budget', state.budget);
        render();
    });

    itemPriceInput.addEventListener('input', (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numValue = parseInt(rawValue) || 0;
        e.target.value = formatNumber(numValue);
    });

    addItemBtn.addEventListener('click', addItem);

    itemPriceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    // Backup & Restore
    downloadBtn.addEventListener('click', downloadData);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', uploadData);
}

function addItem() {
    const name = itemNameInput.value.trim();
    const priceStr = itemPriceInput.value;
    const price = parseInt(priceStr.replace(/\D/g, '')) || 0;

    if (name && !isNaN(price) && price >= 0) {
        state.wishlist.push({
            id: Date.now(),
            name,
            price
        });

        saveAndRender();

        // Clear inputs
        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemNameInput.focus();
    } else {
        alert('Please enter a valid item name and price.');
    }
}

function deleteItem(id) {
    state.wishlist = state.wishlist.filter(item => item.id !== id);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    render();
}

/**
 * Backup Data (Download as JSON)
 */
function downloadData() {
    const data = {
        wishlist: state.wishlist,
        budget: state.budget,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `wishlist_backup_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Restore Data (Upload from JSON)
 */
function uploadData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.wishlist && typeof data.budget === 'number') {
                if (confirm('Import backup? This will replace your current wishlist.')) {
                    state.wishlist = data.wishlist;
                    state.budget = data.budget;
                    budgetInput.value = formatNumber(state.budget);
                    localStorage.setItem('budget', state.budget);
                    saveAndRender();
                    alert('Data restored successfully!');
                }
            } else {
                alert('Invalid file format.');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    event.target.value = '';
}

function render() {
    wishlistContainer.innerHTML = '';
    let totalCost = 0;
    let achievedCount = 0;

    if (state.wishlist.length === 0) {
        wishlistContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💸</div>
                <p>Wishlist Anda masih kosong.</p>
                <small>Tambah barang yang ingin Anda beli!</small>
            </div>
        `;
    } else {
        state.wishlist.forEach(item => {
            totalCost += item.price;
            const isAffordable = state.budget >= item.price;
            if (isAffordable) achievedCount++;

            const itemEl = document.createElement('div');
            itemEl.className = `item-card ${isAffordable ? 'affordable' : ''}`;
            itemEl.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">Rp ${formatNumber(item.price)}</span>
                    ${isAffordable ? '<span class="item-status">✓ Tercapai</span>' : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteItem(${item.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            wishlistContainer.appendChild(itemEl);
        });
    }

    // Update Summary
    totalCostEl.innerText = `Rp ${formatNumber(totalCost)}`;
    achievedCountEl.innerText = `${achievedCount} / ${state.wishlist.length}`;
}

// Global exposure for onclick
window.deleteItem = deleteItem;

// Start the app
init();
