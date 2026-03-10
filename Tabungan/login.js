// Konfigurasi API
const API_URL = 'http://localhost/tabungan'; // Sesuaikan dengan folder Anda

// Inisialisasi data default (untuk pertama kali)
async function initDefaultData() {
    // Cek apakah sudah ada data di database
    try {
        const response = await fetch(`${API_URL}/api_login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Database sudah siap');
        }
    } catch (error) {
        console.error('Error koneksi database:', error);
        alert('Tidak dapat terhubung ke database. Pastikan XAMPP/Apache dan MySQL sudah running!');
    }
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(`${API_URL}/api_login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Simpan session
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Redirect ke dashboard sesuai role
            window.location.href = `dashboard-${result.user.role}.html`;
        } else {
            errorMessage.textContent = result.message || 'Username atau password tidak sesuai!';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Tidak dapat terhubung ke server. Pastikan XAMPP sudah running!';
        errorMessage.style.display = 'block';
    }
});

// Init saat page load
initDefaultData();
