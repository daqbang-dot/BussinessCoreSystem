// --- DATA & STATE ---
let inventory = JSON.parse(localStorage.getItem('biz_inventory')) || [
    { id: 1, name: 'Standard Product', sku: 'SKU-001', stock: 50, price: 29.99 },
    { id: 2, name: 'Premium Item', sku: 'SKU-002', stock: 3, price: 99.00 }
];

let sales = JSON.parse(localStorage.getItem('biz_sales')) || [];
let leads = JSON.parse(localStorage.getItem('biz_leads')) || [];
let cart = [];

// --- AUTH LOGIC ---
const auth = {
    login() {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        
        // Simple hardcoded demo credentials
        if (u === "admin" && p === "1234") {
            sessionStorage.setItem('biz_session', 'active');
            this.checkSession();
        } else {
            document.getElementById('auth-error').innerText = "Invalid Credentials";
        }
    },
    logout() {
        sessionStorage.removeItem('biz_session');
        location.reload();
    },
    checkSession() {
        if (sessionStorage.getItem('biz_session') === 'active') {
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            ui.init();
        }
    }
};

// --- UI CONTROLLER ---
const ui = {
    init() {
        this.bindNav();
        this.renderAll();
    },
    bindNav() {
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.onclick = () => {
                document.querySelectorAll('.nav-links li, .view').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                document.getElementById(li.dataset.target).classList.add('active');
            };
        });
    },
    renderAll() {
        this.updateDashboard();
        this.renderInventory();
        this.renderPOS();
        this.renderLeads();
    },
    updateDashboard() {
        const rev = sales.reduce((a, b) => a + b.total, 0);
        document.getElementById('stat-sales').innerText = `$${rev.toFixed(2)}`;
        document.getElementById('stat-stock').innerText = inventory.filter(i => i.stock < 10).length;
        document.getElementById('stat-leads').innerText = leads.length;
    },
    renderInventory() {
        const query = document.getElementById('inv-search').value.toLowerCase();
        const list = document.getElementById('inventory-list');
        list.innerHTML = inventory
            .filter(i => i.name.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query))
            .map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.sku}</td>
                    <td style="color: ${item.stock < 10 ? 'red' : 'green'}">${item.stock}</td>
                    <td>$${item.price.toFixed(2)}</td>
                </tr>`).join('');
    },
    renderPOS() {
        const query = document.getElementById('pos-search').value.toLowerCase();
        const grid = document.getElementById('pos-item-grid');
        grid.innerHTML = inventory
            .filter(i => i.name.toLowerCase().includes(query))
            .map(item => `
                <div class="item-btn" onclick="pos.addToCart(${item.id})">
                    <strong>${item.name}</strong><br>$${item.price}
                </div>`).join('');
    },
    renderLeads() {
        document.getElementById('lead-display').innerHTML = leads.map(l => `
            <div class="card" style="margin-bottom:10px">
                <strong>${l.name}</strong><br><small>${l.email}</small>
            </div>`).join('');
    }
};

// --- POS LOGIC ---
const pos = {
    addToCart(id) {
        const item = inventory.find(p => p.id === id);
        if(item.stock <= 0) return alert("Out of Stock");
        cart.push({...item});
        this.renderCart();
    },
    renderCart() {
        let total = 0;
        document.getElementById('cart-list').innerHTML = cart.map(i => {
            total += i.price;
            return `<div class="cart-item"><span>${i.name}</span><span>$${i.price}</span></div>`;
        }).join('');
        document.getElementById('cart-total-amount').innerText = `$${total.toFixed(2)}`;
    },
    checkout() {
        if(!cart.length) return;
        const total = cart.reduce((a, b) => a + b.price, 0);
        
        cart.forEach(c => {
            const i = inventory.find(inv => inv.id === c.id);
            if(i) i.stock--;
        });

        sales.push({ total, date: new Date().toLocaleString() });
        localStorage.setItem('biz_inventory', JSON.stringify(inventory));
        localStorage.setItem('biz_sales', JSON.stringify(sales));
        
        alert("Receipt Sent to Printer!");
        cart = [];
        this.renderCart();
        ui.renderAll();
    }
};

// --- CRM LOGIC ---
const marketing = {
    addLead() {
        const name = document.getElementById('lead-name').value;
        const email = document.getElementById('lead-email').value;
        if(!name || !email) return;
        leads.push({ name, email });
        localStorage.setItem('biz_leads', JSON.stringify(leads));
        ui.renderLeads();
        ui.updateDashboard();
    }
};

// --- UTILS ---
const utils = {
    exportCSV() {
        let csv = "Name,SKU,Stock,Price\n" + inventory.map(i => `${i.name},${i.sku},${i.stock},${i.price}`).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'inventory.csv');
        a.click();
    }
};

// Initialize
auth.checkSession();
