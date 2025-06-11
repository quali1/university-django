async function loadSalesReport() {
    try {
        const response = await apiCall('/reports/sales/');
        const report = await response.json();
        displaySalesReport(report);
    } catch (error) {
        showToast('Błąd podczas ładowania raportu sprzedaży', 'error');
    }
}

async function loadInventoryReport() {
    try {
        const response = await apiCall('/reports/inventory/');
        const report = await response.json();
        displayInventoryReport(report);
    } catch (error) {
        showToast('Błąd podczas ładowania raportu magazynu', 'error');
    }
}

async function loadLowStockItems() {
    try {
        const response = await apiCall('/ingredients/low-stock/');
        const items = await response.json();
        displayLowStockItems(items);
    } catch (error) {
        showToast('Błąd podczas ładowania składników', 'error');
    }
}

function displaySalesReport(report) {
    const container = document.getElementById('salesReport');
    container.innerHTML = `
        <p><strong>Całkowita sprzedaż:</strong> ${report.total_sales || 0} PLN</p>
        <p><strong>Liczba zamówień:</strong> ${report.total_orders || 0}</p>
        <p><strong>Średnia wartość zamówienia:</strong> ${report.average_order_value?.toFixed(2) || 0} PLN</p>
        <hr>
        <h6>Top 5 produktów:</h6>
        <ul>
            ${report.top_items?.slice(0, 5).map(item => 
                `<li>${item.menu_item__name} - ${item.total_quantity} szt.</li>`
            ).join('') || '<li>Brak danych</li>'}
        </ul>
    `;
}

function displayInventoryReport(report) {
    const container = document.getElementById('inventoryReport');
    container.innerHTML = `
        <p><strong>Wartość magazynu:</strong> ${report.total_inventory_value?.toFixed(2) || 0} PLN</p>
        <p><strong>Składniki poniżej minimum:</strong> ${report.low_stock_count || 0}</p>
        <div class="alert alert-warning mt-3">
            ${report.low_stock_count > 0 ? 
                'Uwaga! Niektóre składniki wymagają uzupełnienia' : 
                'Wszystkie składniki są w wystarczającej ilości'}
        </div>
    `;
}

function displayLowStockItems(items) {
    const tbody = document.getElementById('lowStockTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Brak składników poniżej minimum</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>${item.minimum_quantity} ${item.unit}</td>
            <td>${item.supplier || '-'}</td>
        `;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    loadSalesReport();
    loadInventoryReport();
    loadLowStockItems();
});