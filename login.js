// login.js
import { supabase } from './supabase-client.js'

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    console.log('🔍 Login attempt:', username);
    
    try {
        // Cek koneksi Supabase
        const { data: test, error: testError } = await supabase.from('users').select('count');
        console.log('📡 Supabase connection test:', { test, testError });
        
        // Query login
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle();
        
        console.log('👤 User query result:', { user, error });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            errorMessage.textContent = 'Database error: ' + error.message;
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!user) {
            errorMessage.textContent = 'Username atau password salah';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Jika nasabah, ambil data lengkap
        if (user.role === 'nasabah') {
            const { data: nasabah, error: nasabahError } = await supabase
                .from('nasabah')
                .select('norek, saldo, alamat, telp')
                .eq('username', username)
                .maybeSingle();
            if (nasabahError) console.error('Nasabah error:', nasabahError);
            if (nasabah) {
                user.saldo = nasabah.saldo;
                user.norek = nasabah.norek;
                user.alamat = nasabah.alamat;
                user.telp = nasabah.telp;
            }
        }
        
        // Log aktivitas (abaikan error)
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: user.nama,
            role: user.role,
            aktivitas: 'Login ke sistem'
        }]);
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = `dashboard-${user.role}.html`;
        
    } catch (err) {
        console.error('💥 Unexpected error:', err);
        errorMessage.textContent = 'Koneksi error: ' + err.message;
        errorMessage.style.display = 'block';
    }
});
