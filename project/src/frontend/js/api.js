const API_BASE = 'http://localhost:8000/api';

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = { ...defaultOptions, ...options };
    if (finalOptions.headers) {
        finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, finalOptions);

        if (response.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                const refreshResponse = await fetch(`${API_BASE}/auth/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('access_token', data.access);
                    finalOptions.headers['Authorization'] = `Bearer ${data.access}`;
                    return fetch(`${API_BASE}${endpoint}`, finalOptions);
                }
            }

            localStorage.clear();
            window.location.href = '/index.html';
            return;
        }

        return response;
    } catch (error) {
        showToast('Błąd połączenia z serwerem', 'error');
        throw error;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast ${type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-info'} text-white`;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}