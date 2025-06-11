async function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));

            showToast('Zalogowano pomyślnie', 'success');
            setTimeout(() => {
                checkAuth();
            }, 1000);
        } else {
            showToast('Nieprawidłowy email lub hasło', 'error');
        }
    } catch (error) {
        showToast('Błąd podczas logowania', 'error');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

function checkAuth() {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    const userName = document.getElementById('userName');

    if (token && user.email) {
        if (loginForm) loginForm.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        if (userName) userName.textContent = `${user.first_name} ${user.last_name}`;

        const navAdmin = document.getElementById('navAdmin');
        const navOrders = document.getElementById('navOrders');
        const navReservations = document.getElementById('navReservations');
        const dashOrders = document.getElementById('dashOrders');
        const dashReservations = document.getElementById('dashReservations');

        if (user.role === 'admin') {
            if (navAdmin) navAdmin.style.display = 'block';
        }

        if (user.role === 'client') {
            if (navOrders) navOrders.style.display = 'none';
            if (dashOrders) dashOrders.style.display = 'none';
        }
    } else {
        if (loginForm) loginForm.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', checkAuth);