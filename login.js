// login.js
import { supabase } from './supabase-client.js'

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        // Cari user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
        
        if (error || !user) {
            errorMessage.textContent = 'Username atau password salah';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Jika nasabah, ambil data lengkap
        if (user.role === 'nasabah') {
            const { data: nasabah } = await supabase
                .from('nasabah')
                .select('saldo, alamat, telp')
                .eq('username', username)
                .single();
            if (nasabah) {
                user.saldo = nasabah.saldo;
                user.alamat = nasabah.alamat;
                user.telp = nasabah.telp;
            }
        }
        
        // Log aktivitas
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: user.nama,
            role: user.role,
            aktivitas: 'Login ke sistem'
        }]);
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = `dashboard-${user.role}.html`;
        
    } catch (error) {
        console.error(error);
        errorMessage.textContent = 'Terjadi kesalahan koneksi';
        errorMessage.style.display = 'block';
    }
});