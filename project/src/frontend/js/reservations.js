async function loadReservations() {
    try {
        const response = await apiCall('/reservations/');
        const reservations = await response.json();
        displayReservations(reservations);
    } catch (error) {
        showToast('Błąd podczas ładowania rezerwacji', 'error');
    }
}

function displayReservations(reservations) {
    const tbody = document.getElementById('reservationsTableBody');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isStaff = user.role === 'admin' || user.role === 'waiter';

    tbody.innerHTML = '';

    reservations.forEach(reservation => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${reservation.date}</td>
            <td>${reservation.time}</td>
            <td>${reservation.party_size}</td>
            <td>${getStatusName(reservation.status)}</td>
            <td>${reservation.table_number || '-'}</td>
            ${isStaff ? `<td>${reservation.user.first_name} ${reservation.user.last_name}</td>` : ''}
            <td>
                ${reservation.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">Potwierdź</button>
                    <button class="btn btn-sm btn-danger" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">Anuluj</button>
                ` : ''}
                ${reservation.status === 'confirmed' && isStaff ? `
                    <button class="btn btn-sm btn-primary" onclick="assignTable(${reservation.id})">Przypisz stolik</button>
                ` : ''}
            </td>
        `;
    });
}

function getStatusName(status) {
    const statuses = {
        'pending': 'Oczekuje',
        'confirmed': 'Potwierdzona',
        'cancelled': 'Anulowana',
        'completed': 'Zakończona'
    };
    return statuses[status] || status;
}

async function createReservation(event) {
    event.preventDefault();

    const data = {
        date: document.getElementById('resDate').value,
        time: document.getElementById('resTime').value,
        party_size: parseInt(document.getElementById('resPartySize').value),
        special_requests: document.getElementById('resRequests').value
    };

    try {
        const response = await apiCall('/reservations/', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Rezerwacja utworzona pomyślnie', 'success');
            hideReservationForm();
            loadReservations();
        } else {
            showToast('Błąd podczas tworzenia rezerwacji', 'error');
        }
    } catch (error) {
        showToast('Błąd podczas tworzenia rezerwacji', 'error');
    }
}

async function updateReservationStatus(reservationId, newStatus) {
    try {
        const response = await apiCall(`/reservations/${reservationId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast('Status zaktualizowany', 'success');
            loadReservations();
        }
    } catch (error) {
        showToast('Błąd podczas aktualizacji statusu', 'error');
    }
}

async function assignTable(reservationId) {
    const tableNumber = prompt('Numer stolika:');
    if (tableNumber) {
        try {
            const response = await apiCall(`/reservations/${reservationId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ table_number: parseInt(tableNumber) })
            });

            if (response.ok) {
                showToast('Stolik przypisany', 'success');
                loadReservations();
            }
        } catch (error) {
            showToast('Błąd podczas przypisywania stolika', 'error');
        }
    }
}

function showReservationForm() {
    document.getElementById('reservationForm').style.display = 'block';
}

function hideReservationForm() {
    document.getElementById('reservationForm').style.display = 'none';
    document.getElementById('resDate').value = '';
    document.getElementById('resTime').value = '';
    document.getElementById('resPartySize').value = '';
    document.getElementById('resRequests').value = '';
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role === 'admin' || user.role === 'waiter') {
        document.getElementById('guestHeader').style.display = 'table-cell';
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('resDate').min = today;

    loadReservations();
});