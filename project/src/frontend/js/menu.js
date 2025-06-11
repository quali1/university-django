async function loadMenuItems() {
    const category = document.getElementById('categoryFilter').value;
    let endpoint = '/menu-items/';
    if (category) {
        endpoint += `?category=${category}`;
    }

    try {
        const response = await apiCall(endpoint);
        const items = await response.json();
        displayMenuItems(items);
    } catch (error) {
        showToast('Błąd podczas ładowania menu', 'error');
    }
}

function displayMenuItems(items) {
    const tbody = document.getElementById('menuTableBody');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin' || user.role === 'waiter';

    tbody.innerHTML = '';

    items.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${getCategoryName(item.category)}</td>
            <td>${item.price} PLN</td>
            <td>${item.is_available ? 'Dostępne' : 'Niedostępne'}</td>
            ${isAdmin ? `<td>
                <button class="btn btn-sm btn-warning" onclick="toggleAvailability(${item.id}, ${item.is_available})">
                    ${item.is_available ? 'Ukryj' : 'Pokaż'}
                </button>
            </td>` : ''}
        `;
    });
}

function getCategoryName(category) {
    const categories = {
        'appetizer': 'Przystawka',
        'main': 'Danie główne',
        'dessert': 'Deser',
        'beverage': 'Napój'
    };
    return categories[category] || category;
}

async function addMenuItem(event) {
    event.preventDefault();

    const data = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        preparation_time: parseInt(document.getElementById('itemPrepTime').value),
        is_vegetarian: document.getElementById('itemVegetarian').checked,
        is_vegan: document.getElementById('itemVegan').checked,
        is_gluten_free: document.getElementById('itemGlutenFree').checked,
        is_available: true
    };

    try {
        const response = await apiCall('/menu-items/', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Pozycja dodana pomyślnie', 'success');
            hideAddForm();
            loadMenuItems();
        } else {
            showToast('Błąd podczas dodawania pozycji', 'error');
        }
    } catch (error) {
        showToast('Błąd podczas dodawania pozycji', 'error');
    }
}

async function toggleAvailability(itemId, currentStatus) {
    try {
        const response = await apiCall(`/menu-items/${itemId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ is_available: !currentStatus })
        });

        if (response.ok) {
            showToast('Status zmieniony', 'success');
            loadMenuItems();
        }
    } catch (error) {
        showToast('Błąd podczas zmiany statusu', 'error');
    }
}

function showAddForm() {
    document.getElementById('addMenuForm').style.display = 'block';
}

function hideAddForm() {
    document.getElementById('addMenuForm').style.display = 'none';
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemPrepTime').value = '';
    document.getElementById('itemVegetarian').checked = false;
    document.getElementById('itemVegan').checked = false;
    document.getElementById('itemGlutenFree').checked = false;
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role === 'admin' || user.role === 'waiter') {
        document.getElementById('addMenuBtn').style.display = 'block';
        document.getElementById('actionsHeader').style.display = 'table-cell';
    }

    loadMenuItems();
});