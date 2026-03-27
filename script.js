/**
 * Jejak Keinginan v2.0 - Wishlist & Tabungan Integration
 * Handles items, transactions, budget sync, and cross-tab navigation
 */

const MAX_VALUE = 10000000000;

const state = {
    wishlist: (JSON.parse(localStorage.getItem('wishlist')) || []).map(item => ({
        ...item,
        priority: item.priority || 2
    })),
    savings: JSON.parse(localStorage.getItem('savings')) || [],
    budget: parseFloat(localStorage.getItem('budget')) || 0,
    showNominal: localStorage.getItem('showNominal') === null ? true : localStorage.getItem('showNominal') === 'true',
    syncTabungan: localStorage.getItem('syncTabungan') === null ? true : localStorage.getItem('syncTabungan') === 'true',
    editingId: null,
    activeTab: 'wishlist'
};

// DOM Elements - General
const showNominalBtn = document.getElementById('toggleVisibility');
const eyeIcon = document.getElementById('eyeIcon');
const budgetInput = document.getElementById('budgetInput');
const syncToggle = document.getElementById('syncToggle');
const syncLabel = document.getElementById('syncLabel');
const syncSubtext = document.getElementById('syncSubtext');

// DOM Elements - Wishlist
const itemNameInput = document.getElementById('itemNameInput');
const itemPriorityInput = document.getElementById('itemPriorityInput');
const itemPriceInput = document.getElementById('itemPriceInput');
const addItemBtn = document.getElementById('addItemBtn');
const wishlistContainer = document.getElementById('wishlistItems');
const totalCostEl = document.getElementById('totalCost');
const remainingBudgetEl = document.getElementById('remainingBudget');
const achievedCountEl = document.getElementById('achievedCount');

// DOM Elements - Tabungan
const totalSavingsEl = document.getElementById('totalSavings');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const transNameInput = document.getElementById('transNameInput');
const transTypeInput = document.getElementById('transTypeInput');
const transAmountInput = document.getElementById('transAmountInput');
const addTransBtn = document.getElementById('addTransBtn');
const savingsContainer = document.getElementById('savingsItems');

// DOM Elements - Management
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

// Helpers
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function formatDisplay(num) {
    if (!state.showNominal) return '••••••';
    return formatNumber(num);
}

function updateEyeIcon() {
    if (!eyeIcon) return;
    if (state.showNominal) {
        eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    } else {
        eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
    }
}

// State Management
function saveState() {
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    localStorage.setItem('savings', JSON.stringify(state.savings));
    localStorage.setItem('budget', state.budget);
    localStorage.setItem('showNominal', state.showNominal);
    localStorage.setItem('syncTabungan', state.syncTabungan);
}

// Core// Initialize
function init() {
    updateEyeIcon();
    render();

    // Page-Aware Initialization
    if (addItemBtn) {
        // Wishlist Page Listeners
        addItemBtn.addEventListener('click', addItem);
        itemPriceInput.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = formatNumber(parseInt(val) || 0);
        });
        
        // Manual Budget Override (Optional - synced by default)
        budgetInput.addEventListener('input', (e) => {
            if (state.syncTabungan) return; // Prevent manual typing entirely if synced
            const rawValue = e.target.value.replace(/\D/g, '');
            state.budget = parseInt(rawValue) || 0;
            e.target.value = formatNumber(state.budget);
            saveState();
            render();
        });
        
        // Sync Toggle
        if (syncToggle) {
            syncToggle.checked = state.syncTabungan;
            updateSyncUI();
            syncToggle.addEventListener('change', (e) => {
                state.syncTabungan = e.target.checked;
                updateSyncUI();
                if (state.syncTabungan) {
                    render(); // recalculates and overwrites
                }
                saveState();
            });
        }
    }

    if (addTransBtn) {
        // Savings Page Listeners
        addTransBtn.addEventListener('click', addTransaction);
        transAmountInput.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = formatNumber(parseInt(val) || 0);
        });
    }

    // Management
    downloadBtn.addEventListener('click', downloadData);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', uploadData);

    // Visibility Toggle
    if (showNominalBtn) {
        showNominalBtn.addEventListener('click', () => {
            state.showNominal = !state.showNominal;
            updateEyeIcon();
            render();
            if (budgetInput) budgetInput.value = state.showNominal ? formatNumber(state.budget) : '••••••';
            saveState();
        });
    }
}

function updateSyncUI() {
    if (!syncToggle || !budgetInput) return;
    budgetInput.readOnly = state.syncTabungan;
    budgetInput.style.opacity = state.syncTabungan ? '0.6' : '1';
    budgetInput.style.cursor = state.syncTabungan ? 'not-allowed' : 'text';
    
    syncLabel.textContent = state.syncTabungan ? 'Sinkron Otomatis (Aktif)' : 'Input Manual (Aktif)';
    syncLabel.style.color = state.syncTabungan ? 'var(--primary)' : 'var(--text-main)';
    syncSubtext.textContent = state.syncTabungan ? 'Tabungan akan menimpa saldo ini' : 'Saldo bebas diatur sendiri (Tidak Terkunci Tabungan)';
}

function render() {
    calculateSavings();
    if (wishlistContainer) renderWishlist();
    if (savingsContainer) renderSavings();
    
    // Update Global Budget Displays
    if (budgetInput) {
        budgetInput.value = state.showNominal ? formatNumber(state.budget) : '••••••';
    }
}

function calculateSavings() {
    let income = 0;
    let expense = 0;
    state.savings.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });
    
    const balance = income - expense;
    if (state.syncTabungan) {
        state.budget = balance; // Sync total savings to budget
    }
    
    if (totalSavingsEl) totalSavingsEl.textContent = `Rp ${formatDisplay(balance)}`;
    if (totalIncomeEl) totalIncomeEl.textContent = `Rp ${formatDisplay(income)}`;
    if (totalExpenseEl) totalExpenseEl.textContent = `Rp ${formatDisplay(expense)}`;
    
    // Calculate Sisa (Net Remaining after Wishlist)
    const netRemainingEl = document.getElementById('netRemaining');
    if (netRemainingEl) {
        const totalWishlistCost = state.wishlist.reduce((sum, item) => sum + item.price, 0);
        const netRemaining = balance - totalWishlistCost;
        netRemainingEl.textContent = `Rp ${formatDisplay(netRemaining)}`;
        netRemainingEl.style.color = netRemaining < 0 ? 'var(--danger)' : 'var(--text-main)';
    }
    
    // Update Savings Rate Badge
    const savingsRateEl = document.getElementById('savingsRateBadge');
    if (savingsRateEl) {
        if (income > 0) {
            const perc = Math.round((balance / income) * 100);
            savingsRateEl.textContent = `${perc}% Tersimpan`;
            if (perc > 0) {
                savingsRateEl.style.background = 'rgba(16, 185, 129, 0.15)';
                savingsRateEl.style.color = '#10b981';
            } else if (perc < 0) {
                savingsRateEl.style.background = 'rgba(239, 68, 68, 0.15)';
                savingsRateEl.style.color = 'var(--danger)';
            } else {
                savingsRateEl.style.background = 'rgba(255, 255, 255, 0.05)';
                savingsRateEl.style.color = 'var(--text-muted)';
            }
        } else {
            savingsRateEl.textContent = `0% Tersimpan`;
            savingsRateEl.style.background = 'rgba(255, 255, 255, 0.05)';
            savingsRateEl.style.color = 'var(--text-muted)';
        }
    }
}

function renderWishlist() {
    if (!wishlistContainer) return;
    wishlistContainer.innerHTML = '';
    let totalCost = 0;
    let achievedCount = 0;

    if (state.wishlist.length === 0) {
        wishlistContainer.innerHTML = `<div class="empty-state">💸 Wishlist kosong</div>`;
    } else {
        const sorted = [...state.wishlist].sort((a, b) => {
            const aAffordable = state.budget >= a.price;
            const bAffordable = state.budget >= b.price;
            
            // 1. Barang yang bisa dibeli muncul paling atas
            if (aAffordable && !bAffordable) return -1;
            if (!aAffordable && bAffordable) return 1;
            
            // 2. Urutan dari harga terkecil
            if (a.price !== b.price) return a.price - b.price;
            
            // 3. Cadangan: berdasarkan urutan ditambahkan (ID)
            return a.id - b.id;
        });
        
        sorted.forEach(item => {
            totalCost += item.price;
            
            // Hitung secara independen terhadap total uang saat ini
            let progress = state.budget >= item.price ? 100 : (state.budget > 0 ? (state.budget / item.price) * 100 : 0);
            
            const isAffordable = progress === 100;
            if (isAffordable) achievedCount++;
            
            let affordableHtml = '';
            if (isAffordable) {
                const count = Math.floor(state.budget / item.price);
                affordableHtml = `<div style="font-size: 0.75rem; color: var(--success); margin-top: 8px; font-weight: 600;">✨ Anda bisa membeli ${count} buah ${item.name}</div>`;
            }

            const card = document.createElement('div');
            card.className = `item-card ${isAffordable ? 'affordable' : ''}`;
            card.innerHTML = `
                <div class="item-info">
                    <div style="display: flex; justify-content: space-between;">
                        <span class="priority-badge priority-${item.priority}">${item.priority === 3 ? 'High' : (item.priority === 2 ? 'Med' : 'Low')}</span>
                        <span style="font-size: 0.7rem; font-weight: 700;">${Math.floor(progress)}%</span>
                    </div>
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">Rp ${formatDisplay(item.price)}</span>
                    <div class="item-progress-container"><div class="item-progress-bar" style="width: ${progress}%"></div></div>
                    ${affordableHtml}
                </div>
                <div class="item-actions">
                    <button class="btn-delete" title="Edit" onclick="editItem(${item.id})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="btn-delete" title="Hapus" onclick="deleteItem(${item.id})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
                </div>
            `;
            wishlistContainer.appendChild(card);
        });
    }

    totalCostEl.textContent = `Rp ${formatDisplay(totalCost)}`;
    const remaining = state.budget - totalCost;
    remainingBudgetEl.textContent = `Rp ${formatDisplay(remaining)}`;
    remainingBudgetEl.className = remaining < 0 ? 'negative' : '';
    achievedCountEl.textContent = `${achievedCount} / ${state.wishlist.length}`;
    
    // Update Circular Chart
    const percentage = totalCost > 0 ? Math.min(100, Math.round((state.budget / totalCost) * 100)) : 0;
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    const progressSubtext = document.getElementById('progressSubtext');
    
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${percentage}, 100`;
        progressText.textContent = `${percentage}%`;
        progressCircle.style.stroke = percentage === 100 ? 'var(--success)' : 'var(--primary)';
        progressSubtext.textContent = percentage === 100 ? 'Target tercapai!' : `${achievedCount} dari ${state.wishlist.length} tercapai.`;
    }
}

function renderSavings() {
    if (!savingsContainer) return;
    savingsContainer.innerHTML = '';
    const sorted = [...state.savings].reverse();

    if (sorted.length === 0) {
        savingsContainer.innerHTML = `<div class="empty-state">Belum ada transaksi</div>`;
    } else {
        sorted.forEach(t => {
            const card = document.createElement('div');
            card.className = `item-card trans-item type-${t.type}`;
            card.innerHTML = `
                <div class="item-info">
                    <div class="trans-date">${new Date(t.id).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <span class="item-name">${t.description}</span>
                    <span class="item-price">${t.type === 'income' ? '+' : '-'} Rp ${formatDisplay(t.amount)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-delete" title="Hapus" onclick="deleteTransaction(${t.id})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
                </div>
            `;
            savingsContainer.appendChild(card);
        });
    }
}

// Transaction Logic
function addTransaction() {
    const desc = transNameInput.value.trim();
    const amount = parseInt(transAmountInput.value.replace(/\D/g, '')) || 0;
    const type = transTypeInput.value;

    if (!desc || amount <= 0) return;

    state.savings.push({ id: Date.now(), type, amount, description: desc });
    saveState();
    render();
    
    transNameInput.value = '';
    transAmountInput.value = '';
    transNameInput.focus();
}

function deleteTransaction(id) {
    state.savings = state.savings.filter(t => t.id !== id);
    saveState();
    render();
}

// Wishlist Logic (Modified)
function addItem() {
    const name = itemNameInput.value.trim();
    const price = parseInt(itemPriceInput.value.replace(/\D/g, '')) || 0;
    const priority = parseInt(itemPriorityInput.value);

    if (!name || price <= 0) return;

    if (state.editingId) {
        const idx = state.wishlist.findIndex(i => i.id === state.editingId);
        if (idx !== -1) {
            state.wishlist[idx] = { ...state.wishlist[idx], name, price, priority };
        }
        state.editingId = null;
        addItemBtn.classList.remove('editing');
    } else {
        state.wishlist.push({ id: Date.now(), name, price, priority });
    }

    saveState();
    render();
    itemNameInput.value = '';
    itemPriceInput.value = '';
}

function editItem(id) {
    const item = state.wishlist.find(i => i.id === id);
    if (!item) return;
    state.editingId = id;
    itemNameInput.value = item.name;
    itemPriceInput.value = formatNumber(item.price);
    itemPriorityInput.value = item.priority;
    addItemBtn.classList.add('editing');
    itemNameInput.focus();
}

function deleteItem(id) {
    state.wishlist = state.wishlist.filter(i => i.id !== id);
    saveState();
    render();
}

// Backup & Restore
function downloadData() {
    const isTabunganPage = !!document.getElementById('savingsItems');
    const type = isTabunganPage ? 'tabungan' : 'wishlist';
    
    const data = { 
        type: type,
        version: "2.1",
        exportDate: new Date().toISOString() 
    };

    if (isTabunganPage) {
        data.savings = state.savings;
    } else {
        data.wishlist = state.wishlist;
        data.budget = state.budget; 
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jejak_${type}_backup_${new Date().getTime()}.json`;
    a.click();
}

function uploadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const isTabunganPage = !!document.getElementById('savingsItems');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = JSON.parse(e.target.result);
            let data = {};
            
            // Handle v1.0 (raw array) vs v2.0 (unified object without type) vs v2.1+ (typed object)
            if (Array.isArray(result)) {
                data = { type: 'wishlist', wishlist: result };
            } else {
                data = result;
                if (!data.type && data.wishlist && data.savings) {
                    data.type = 'unified';
                } else if (!data.type && data.wishlist) {
                    data.type = 'wishlist';
                }
            }

            // Validation Logic
            if (isTabunganPage && data.type === 'wishlist') {
                alert('Terkunci! File ini adalah backup Wishlist. Harap gunakan file backup Tabungan untuk memulihkan di halaman ini.');
                event.target.value = ''; // Reset input
                return;
            }
            if (!isTabunganPage && data.type === 'tabungan') {
                alert('Terkunci! File ini adalah backup Tabungan. Harap gunakan file backup Wishlist untuk memulihkan di halaman ini.');
                event.target.value = ''; // Reset input
                return;
            }

            if (confirm(`Import data? Ini akan memulihkan data ${isTabunganPage ? 'Tabungan' : 'Wishlist'} Anda.`)) {
                if (data.type === 'unified') {
                    if (isTabunganPage) state.savings = data.savings || [];
                    else {
                        state.wishlist = data.wishlist || [];
                        // budget syncing happens in render()
                    }
                } else if (isTabunganPage) {
                    state.savings = data.savings || [];
                } else {
                    state.wishlist = data.wishlist || [];
                }
                
                saveState();
                render();
                alert('Data berhasil dipulihkan!');
                event.target.value = ''; // Reset input
            }
        } catch (err) { 
            alert('Gagal membaca file: pastikan file yang dipilih adalah format JSON JSON Jejak Keinginan.'); 
            event.target.value = ''; // Reset input
        }
    };
    reader.readAsText(file);
}

// Global scope for onclick
window.deleteItem = deleteItem;
window.editItem = editItem;
window.deleteTransaction = deleteTransaction;

init();

// Particle Animation System
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 0.5;
            this.color = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(176, 38, 255, 0.5)';
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
    
    const particleCount = Math.floor((width * height) / 12000);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist/100)})`;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

initParticles();
