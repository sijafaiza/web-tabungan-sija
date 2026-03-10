// Konfigurasi API
const API_URL = 'http://localhost/tabungan'; // SESUAIKAN dengan folder htdocs Anda

// Helper untuk request API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== NASABAH API =====
const NasabahAPI = {
    async getAll() {
        return await apiRequest('api_nasabah.php', 'GET');
    },
    
    async create(data) {
        return await apiRequest('api_nasabah.php', 'POST', data);
    },
    
    async update(data) {
        return await apiRequest('api_nasabah.php', 'PUT', data);
    },
    
    async delete(data) {
        return await apiRequest('api_nasabah.php', 'DELETE', data);
    }
};

// ===== TRANSAKSI API =====
const TransaksiAPI = {
    async getAll() {
        return await apiRequest('api_transaksi.php', 'GET');
    },
    
    async create(data) {
        return await apiRequest('api_transaksi.php', 'POST', data);
    },
    
    async update(data) {
        return await apiRequest('api_transaksi.php', 'PUT', data);
    },
    
    async delete(data) {
        return await apiRequest('api_transaksi.php', 'DELETE', data);
    }
};

// ===== TRANSFER API =====
const TransferAPI = {
    async getAll() {
        return await apiRequest('api_transfer.php', 'GET');
    },
    
    async create(data) {
        return await apiRequest('api_transfer.php', 'POST', data);
    },
    
    async update(data) {
        return await apiRequest('api_transfer.php', 'PUT', data);
    },
    
    async delete(data) {
        return await apiRequest('api_transfer.php', 'DELETE', data);
    }
};

// ===== PENGGUNA API =====
const PenggunaAPI = {
    async getAll() {
        return await apiRequest('api_pengguna.php', 'GET');
    },
    
    async create(data) {
        return await apiRequest('api_pengguna.php', 'POST', data);
    },
    
    async update(data) {
        return await apiRequest('api_pengguna.php', 'PUT', data);
    },
    
    async delete(data) {
        return await apiRequest('api_pengguna.php', 'DELETE', data);
    }
};

// ===== LOG API =====
const LogAPI = {
    async getAll() {
        return await apiRequest('api_log.php', 'GET');
    },
    
    async deleteAll(data) {
        return await apiRequest('api_log.php', 'DELETE', data);
    }
};

// ===== HELPER FUNCTIONS =====
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function formatTanggal(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTanggalSaja(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Cek autentikasi
function checkAuth(requiredRole) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== requiredRole) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
