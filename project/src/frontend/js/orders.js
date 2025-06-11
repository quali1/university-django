async function loadOrders() {
    const status = document.getElementById('statusFilter')?.value;
    const orderType = document.getElementById('orderTypeFilter')?.value;

    let endpoint = '/orders/';
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (orderType) params.append('order_type', orderType);

    if (params.toString()) {
        endpoint += '?' + params.toString();
    }

    try {
        const response = await apiCall(endpoint);
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        showToast('Błąd podczas ładowania zamówień', 'error');
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isStaff = user.role === 'admin' || user.role === 'waiter';

    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Brak zamówień</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${getOrderTypeName(order.order_type)}</td>
            <td>${getStatusName(order.status)}</td>
            <td>${order.final_amount} PLN</td>
            <td>${order.items.length}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})">Szczegóły</button>
                ${isStaff && order.status !== 'delivered' && order.status !== 'cancelled' ? `
                    <button class="btn btn-sm btn-warning" onclick="updateOrderStatus(${order.id}, '${getNextStatus(order.status)}')">
                        ${getNextStatus(order.status) ? 'Dalej' : 'Gotowe'}
                    </button>
                ` : ''}
            </td>
        `;
    });
}

function getOrderTypeName(type) {
    const types = {
        'dine_in': 'Na miejscu',
        'takeout': 'Na wynos',
        'delivery': 'Dostawa'
    };
    return types[type] || type;
}

function getStatusName(status) {
    const statuses = {
        'pending': 'Oczekuje',
        'preparing': 'W przygotowaniu',
        'ready': 'Gotowe',
        'delivered': 'Dostarczone',
        'cancelled': 'Anulowane'
    };
    return statuses[status] || status;
}

function getNextStatus(currentStatus) {
    const flow = {
        'pending': 'preparing',
        'preparing': 'ready',
        'ready': 'delivered'
    };
    return flow[currentStatus];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pl-PL');
}

async function viewOrderDetails(orderId) {
    try {
        const response = await apiCall(`/orders/${orderId}/`);
        const order = await response.json();

        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.menu_item_name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price} PLN</td>
                    <td>${item.subtotal} PLN</td>
                </tr>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="orderModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Zamówienie #${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Data:</strong> ${formatDate(order.created_at)}</p>
                            <p><strong>Status:</strong> ${getStatusName(order.status)}</p>
                            <p><strong>Typ:</strong> ${getOrderTypeName(order.order_type)}</p>
                            <h6>Pozycje:</h6>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Nazwa</th>
                                        <th>Ilość</th>
                                        <th>Cena</th>
                                        <th>Suma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                            <p><strong>Suma końcowa: ${order.final_amount} PLN</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    } catch (error) {
        showToast('Błąd podczas ładowania szczegółów', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    try {
        const response = await apiCall(`/orders/${orderId}/update-status/`, {
            method: 'POST',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast('Status zaktualizowany', 'success');
            loadOrders();
        }
    } catch (error) {
        showToast('Błąd podczas aktualizacji statusu', 'error');
    }
}

function showOrderForm() {
    document.getElementById('orderForm').style.display = 'block';
    loadMenuForOrder();
}

function hideOrderForm() {
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('orderForm').querySelector('form').reset();
}

async function loadMenuForOrder() {
    try {
        const response = await apiCall('/menu-items/?is_available=true');
        const items = await response.json();

        const selects = document.querySelectorAll('.menu-item-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Wybierz danie</option>';
            items.forEach(item => {
                select.innerHTML += `<option value="${item.id}">${item.name} - ${item.price} PLN</option>`;
            });
        });
    } catch (error) {
        showToast('Błąd podczas ładowania menu', 'error');
    }
}

function addOrderItem() {
    const container = document.getElementById('orderItems');
    const newItem = document.createElement('div');
    newItem.className = 'row mb-2';
    newItem.innerHTML = `
        <div class="col-md-6">
            <select class="form-select menu-item-select" required>
                <option value="">Wybierz danie</option>
            </select>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control" placeholder="Ilość" min="1" value="1" required>
        </div>
        <div class="col-md-3">
            <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(this)">Usuń</button>
        </div>
    `;
    container.appendChild(newItem);
    loadMenuForOrder();
}

function removeOrderItem(button) {
    button.closest('.row').remove();
}

async function createOrder(event) {
    event.preventDefault();

    const items = [];
    const orderItems = document.querySelectorAll('#orderItems .row');

    orderItems.forEach(item => {
        const menuItemId = item.querySelector('.menu-item-select').value;
        const quantity = item.querySelector('input[type="number"]').value;

        if (menuItemId && quantity) {
            items.push({
                menu_item_id: parseInt(menuItemId),
                quantity: parseInt(quantity)
            });
        }
    });

    if (items.length === 0) {
        showToast('Dodaj przynajmniej jedną pozycję', 'error');
        return;
    }

    const orderData = {
        order_type: document.getElementById('orderType').value,
        table_number: document.getElementById('tableNumber').value ? parseInt(document.getElementById('tableNumber').value) : null,
        special_instructions: document.getElementById('specialInstructions').value,
        items: items
    };

    try {
        const response = await apiCall('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            showToast('Zamówienie utworzone pomyślnie', 'success');
            hideOrderForm();
            loadOrders();
        } else {
            showToast('Błąd podczas tworzenia zamówienia', 'error');
        }
    } catch (error) {
        showToast('Błąd podczas tworzenia zamówienia', 'error');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.email) {
        window.location.href = '../index.html';
        return;
    }

    loadOrders();
});