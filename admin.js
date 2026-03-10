// Cek autentikasi
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'index.html';
}

document.getElementById('userName').textContent = currentUser.nama;

// Load data
let nasabahData = JSON.parse(localStorage.getItem('nasabahData')) || [];
let transaksiData = JSON.parse(localStorage.getItem('transaksi')) || [];
let transferData = JSON.parse(localStorage.getItem('transfer')) || [];
let logData = JSON.parse(localStorage.getItem('logAktivitas')) || [];

// Fungsi logout
function logout() {
    addLog('Logout dari sistem');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Fungsi add log
function addLog(aktivitas) {
    const log = {
        timestamp: new Date().toISOString(),
        user: currentUser.nama,
        role: currentUser.role,
        aktivitas: aktivitas
    };
    logData.push(log);
    localStorage.setItem('logAktivitas', JSON.stringify(logData));
}

// Switch tab
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    loadData();
}

// Update statistik
function updateStats() {
    document.getElementById('totalNasabah').textContent = nasabahData.length;
    document.getElementById('totalTransaksi').textContent = transaksiData.length;
    document.getElementById('totalTransfer').textContent = transferData.length;
}

// Format rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Format tanggal
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

// ===== NASABAH =====
function loadNasabah() {
    const tbody = document.getElementById('tbodyNasabah');
    tbody.innerHTML = '';
    
    nasabahData.forEach((nasabah, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nasabah.norek}</td>
            <td>${nasabah.nama}</td>
            <td>${nasabah.alamat}</td>
            <td>${nasabah.telp}</td>
            <td>${formatRupiah(nasabah.saldo)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editNasabah(${nasabah.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteNasabah(${nasabah.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModalNasabah(id = null) {
    document.getElementById('modalNasabah').classList.add('active');
    document.getElementById('formNasabah').reset();
    
    if (id) {
        document.getElementById('modalNasabahTitle').textContent = 'Edit Nasabah';
        const nasabah = nasabahData.find(n => n.id === id);
        document.getElementById('nasabahId').value = nasabah.id;
        document.getElementById('norek').value = nasabah.norek;
        document.getElementById('nama').value = nasabah.nama;
        document.getElementById('alamat').value = nasabah.alamat;
        document.getElementById('telp').value = nasabah.telp;
        document.getElementById('saldo').value = nasabah.saldo;
        document.getElementById('usernameNasabah').value = nasabah.username;
        document.getElementById('passwordNasabah').placeholder = 'Kosongkan jika tidak diubah';
        document.getElementById('passwordNasabah').required = false;
    } else {
        document.getElementById('modalNasabahTitle').textContent = 'Tambah Nasabah';
        document.getElementById('nasabahId').value = ''; // Pastikan kosong
        document.getElementById('passwordNasabah').placeholder = 'Masukkan password';
        document.getElementById('passwordNasabah').required = true;
    }
}

function closeModalNasabah() {
    document.getElementById('modalNasabah').classList.remove('active');
}

function editNasabah(id) {
    openModalNasabah(id);
}

function deleteNasabah(id) {
    if (confirm('Yakin ingin menghapus nasabah ini?')) {
        const nasabah = nasabahData.find(n => n.id === id);
        nasabahData = nasabahData.filter(n => n.id !== id);
        localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
        
        // Hapus user account
        const users = JSON.parse(localStorage.getItem('users'));
        delete users[nasabah.username];
        localStorage.setItem('users', JSON.stringify(users));
        
        addLog(`Menghapus nasabah: ${nasabah.nama}`);
        loadData();
    }
}

document.getElementById('formNasabah').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('nasabahId').value;
    const norek = document.getElementById('norek').value;
    const nama = document.getElementById('nama').value;
    const alamat = document.getElementById('alamat').value;
    const telp = document.getElementById('telp').value;
    const saldo = parseFloat(document.getElementById('saldo').value);
    const username = document.getElementById('usernameNasabah').value;
    const password = document.getElementById('passwordNasabah').value;
    
    // Cek apakah ini mode edit atau tambah
    if (id && id !== '') {
        // Update - mode edit
        const index = nasabahData.findIndex(n => n.id == id);
        
        if (index !== -1) {
            // Simpan username lama untuk update users
            const oldUsername = nasabahData[index].username;
            
            nasabahData[index] = {
                ...nasabahData[index],
                norek, nama, alamat, telp, saldo, username
            };
            
            // Update user
            const users = JSON.parse(localStorage.getItem('users'));
            
            if (password) {
                // Jika password diisi, update dengan password baru
                users[username] = {
                    username, 
                    password, 
                    role: 'nasabah', 
                    nama, 
                    norek
                };
            } else {
                // Jika password tidak diisi, gunakan password lama
                if (users[oldUsername]) {
                    users[username] = {
                        ...users[oldUsername],
                        username,
                        nama,
                        norek
                    };
                }
            }
            
            // Hapus user lama jika username berubah
            if (oldUsername && oldUsername !== username && users[oldUsername]) {
                delete users[oldUsername];
            }
            
            localStorage.setItem('users', JSON.stringify(users));
            addLog(`Mengupdate data nasabah: ${nama}`);
        }
    } else {
        // Create - mode tambah baru
        if (!password) {
            alert('Password harus diisi untuk nasabah baru!');
            return;
        }
        
        // Cek duplikasi norek
        const existingNorek = nasabahData.find(n => n.norek === norek);
        if (existingNorek) {
            alert('Nomor rekening sudah digunakan!');
            return;
        }
        
        // Cek duplikasi username
        const users = JSON.parse(localStorage.getItem('users'));
        if (users[username]) {
            alert('Username sudah digunakan!');
            return;
        }
        
        const newId = nasabahData.length > 0 ? Math.max(...nasabahData.map(n => n.id)) + 1 : 1;
        nasabahData.push({
            id: newId,
            norek, nama, alamat, telp, saldo, username
        });
        
        // Tambah user
        users[username] = {
            username,
            password,
            role: 'nasabah',
            nama,
            norek
        };
        localStorage.setItem('users', JSON.stringify(users));
        
        addLog(`Menambah nasabah baru: ${nama}`);
    }
    
    localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
    closeModalNasabah();
    loadData();
});

// ===== TRANSAKSI =====
function loadTransaksi() {
    const tbody = document.getElementById('tbodyTransaksi');
    tbody.innerHTML = '';
    
    transaksiData.slice().reverse().forEach(transaksi => {
        const nasabah = nasabahData.find(n => n.norek === transaksi.norek);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTanggal(transaksi.tanggal)}</td>
            <td>${transaksi.norek}</td>
            <td>${nasabah ? nasabah.nama : '-'}</td>
            <td><span class="badge ${transaksi.jenis === 'Setor' ? 'badge-success' : 'badge-danger'}">${transaksi.jenis}</span></td>
            <td>${formatRupiah(transaksi.jumlah)}</td>
            <td>${transaksi.keterangan || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editTransaksi(${transaksi.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTransaksi(${transaksi.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModalTransaksi(id = null) {
    document.getElementById('modalTransaksi').classList.add('active');
    document.getElementById('formTransaksi').reset();
    
    // Populate dropdown
    const select = document.getElementById('norekTransaksi');
    select.innerHTML = '<option value="">Pilih Rekening</option>';
    nasabahData.forEach(nasabah => {
        select.innerHTML += `<option value="${nasabah.norek}">${nasabah.norek} - ${nasabah.nama}</option>`;
    });
    
    if (id) {
        document.getElementById('modalTransaksiTitle').textContent = 'Edit Transaksi';
        const transaksi = transaksiData.find(t => t.id === id);
        document.getElementById('transaksiId').value = transaksi.id;
        document.getElementById('norekTransaksi').value = transaksi.norek;
        document.getElementById('jenis').value = transaksi.jenis;
        document.getElementById('jumlah').value = transaksi.jumlah;
        document.getElementById('keterangan').value = transaksi.keterangan;
    } else {
        document.getElementById('modalTransaksiTitle').textContent = 'Tambah Transaksi';
    }
}

function closeModalTransaksi() {
    document.getElementById('modalTransaksi').classList.remove('active');
}

function editTransaksi(id) {
    openModalTransaksi(id);
}

function deleteTransaksi(id) {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
        const transaksi = transaksiData.find(t => t.id === id);
        
        // Kembalikan saldo
        const nasabahIndex = nasabahData.findIndex(n => n.norek === transaksi.norek);
        if (transaksi.jenis === 'Setor') {
            nasabahData[nasabahIndex].saldo -= transaksi.jumlah;
        } else {
            nasabahData[nasabahIndex].saldo += transaksi.jumlah;
        }
        
        transaksiData = transaksiData.filter(t => t.id !== id);
        localStorage.setItem('transaksi', JSON.stringify(transaksiData));
        localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
        
        addLog(`Menghapus transaksi ${transaksi.jenis}: ${formatRupiah(transaksi.jumlah)}`);
        loadData();
    }
}

document.getElementById('formTransaksi').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('transaksiId').value;
    const norek = document.getElementById('norekTransaksi').value;
    const jenis = document.getElementById('jenis').value;
    const jumlah = parseFloat(document.getElementById('jumlah').value);
    const keterangan = document.getElementById('keterangan').value;
    
    const nasabahIndex = nasabahData.findIndex(n => n.norek === norek);
    
    if (id) {
        // Update
        const oldTransaksi = transaksiData.find(t => t.id == id);
        
        // Kembalikan saldo lama
        if (oldTransaksi.jenis === 'Setor') {
            nasabahData[nasabahIndex].saldo -= oldTransaksi.jumlah;
        } else {
            nasabahData[nasabahIndex].saldo += oldTransaksi.jumlah;
        }
        
        // Update transaksi
        const index = transaksiData.findIndex(t => t.id == id);
        transaksiData[index] = {
            ...transaksiData[index],
            norek, jenis, jumlah, keterangan
        };
        
        addLog(`Mengupdate transaksi ${jenis}: ${formatRupiah(jumlah)}`);
    } else {
        // Create
        const newId = transaksiData.length > 0 ? Math.max(...transaksiData.map(t => t.id)) + 1 : 1;
        transaksiData.push({
            id: newId,
            tanggal: new Date().toISOString(),
            norek, jenis, jumlah, keterangan
        });
        
        addLog(`Menambah transaksi ${jenis}: ${formatRupiah(jumlah)}`);
    }
    
    // Update saldo
    if (jenis === 'Setor') {
        nasabahData[nasabahIndex].saldo += jumlah;
    } else {
        nasabahData[nasabahIndex].saldo -= jumlah;
    }
    
    localStorage.setItem('transaksi', JSON.stringify(transaksiData));
    localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
    closeModalTransaksi();
    loadData();
});

// ===== TRANSFER =====
function loadTransfer() {
    const tbody = document.getElementById('tbodyTransfer');
    tbody.innerHTML = '';
    
    transferData.slice().reverse().forEach(transfer => {
        const dari = nasabahData.find(n => n.norek === transfer.dariRek);
        const ke = nasabahData.find(n => n.norek === transfer.keRek);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTanggal(transfer.tanggal)}</td>
            <td>${transfer.dariRek} ${dari ? `(${dari.nama})` : ''}</td>
            <td>${transfer.keRek} ${ke ? `(${ke.nama})` : ''}</td>
            <td>${formatRupiah(transfer.jumlah)}</td>
            <td>${transfer.keterangan || '-'}</td>
            <td><span class="badge badge-success">${transfer.status}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editTransfer(${transfer.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTransfer(${transfer.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModalTransfer(id = null) {
    document.getElementById('modalTransfer').classList.add('active');
    document.getElementById('formTransfer').reset();
    
    // Populate dropdown
    const selectDari = document.getElementById('dariRek');
    const selectKe = document.getElementById('keRek');
    selectDari.innerHTML = '<option value="">Pilih Rekening</option>';
    selectKe.innerHTML = '<option value="">Pilih Rekening</option>';
    
    nasabahData.forEach(nasabah => {
        const option = `<option value="${nasabah.norek}">${nasabah.norek} - ${nasabah.nama}</option>`;
        selectDari.innerHTML += option;
        selectKe.innerHTML += option;
    });
    
    if (id) {
        document.getElementById('modalTransferTitle').textContent = 'Edit Transfer';
        const transfer = transferData.find(t => t.id === id);
        document.getElementById('transferId').value = transfer.id;
        document.getElementById('dariRek').value = transfer.dariRek;
        document.getElementById('keRek').value = transfer.keRek;
        document.getElementById('jumlahTransfer').value = transfer.jumlah;
        document.getElementById('keteranganTransfer').value = transfer.keterangan;
    } else {
        document.getElementById('modalTransferTitle').textContent = 'Tambah Transfer';
    }
}

function closeModalTransfer() {
    document.getElementById('modalTransfer').classList.remove('active');
}

function editTransfer(id) {
    openModalTransfer(id);
}

function deleteTransfer(id) {
    if (confirm('Yakin ingin menghapus transfer ini?')) {
        const transfer = transferData.find(t => t.id === id);
        
        // Kembalikan saldo
        const dariIndex = nasabahData.findIndex(n => n.norek === transfer.dariRek);
        const keIndex = nasabahData.findIndex(n => n.norek === transfer.keRek);
        
        nasabahData[dariIndex].saldo += transfer.jumlah;
        nasabahData[keIndex].saldo -= transfer.jumlah;
        
        transferData = transferData.filter(t => t.id !== id);
        localStorage.setItem('transfer', JSON.stringify(transferData));
        localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
        
        addLog(`Menghapus transfer: ${formatRupiah(transfer.jumlah)}`);
        loadData();
    }
}

document.getElementById('formTransfer').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('transferId').value;
    const dariRek = document.getElementById('dariRek').value;
    const keRek = document.getElementById('keRek').value;
    const jumlah = parseFloat(document.getElementById('jumlahTransfer').value);
    const keterangan = document.getElementById('keteranganTransfer').value;
    
    if (dariRek === keRek) {
        alert('Rekening pengirim dan penerima tidak boleh sama!');
        return;
    }
    
    const dariIndex = nasabahData.findIndex(n => n.norek === dariRek);
    const keIndex = nasabahData.findIndex(n => n.norek === keRek);
    
    if (id) {
        // Update
        const oldTransfer = transferData.find(t => t.id == id);
        
        // Kembalikan saldo lama
        const oldDariIndex = nasabahData.findIndex(n => n.norek === oldTransfer.dariRek);
        const oldKeIndex = nasabahData.findIndex(n => n.norek === oldTransfer.keRek);
        nasabahData[oldDariIndex].saldo += oldTransfer.jumlah;
        nasabahData[oldKeIndex].saldo -= oldTransfer.jumlah;
        
        // Update transfer
        const index = transferData.findIndex(t => t.id == id);
        transferData[index] = {
            ...transferData[index],
            dariRek, keRek, jumlah, keterangan
        };
        
        addLog(`Mengupdate transfer: ${formatRupiah(jumlah)}`);
    } else {
        // Create
        const newId = transferData.length > 0 ? Math.max(...transferData.map(t => t.id)) + 1 : 1;
        transferData.push({
            id: newId,
            tanggal: new Date().toISOString(),
            dariRek, keRek, jumlah, keterangan,
            status: 'Berhasil'
        });
        
        addLog(`Menambah transfer: ${formatRupiah(jumlah)}`);
    }
    
    // Update saldo
    nasabahData[dariIndex].saldo -= jumlah;
    nasabahData[keIndex].saldo += jumlah;
    
    localStorage.setItem('transfer', JSON.stringify(transferData));
    localStorage.setItem('nasabahData', JSON.stringify(nasabahData));
    closeModalTransfer();
    loadData();
});

// ===== LOG =====
function loadLog() {
    const tbody = document.getElementById('tbodyLog');
    tbody.innerHTML = '';
    
    logData.slice().reverse().forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTanggal(log.timestamp)}</td>
            <td>${log.user}</td>
            <td><span class="badge badge-info">${log.role}</span></td>
            <td>${log.aktivitas}</td>
        `;
        tbody.appendChild(tr);
    });
}

function clearLogs() {
    if (confirm('Yakin ingin menghapus semua log aktivitas?')) {
        logData = [];
        localStorage.setItem('logAktivitas', JSON.stringify(logData));
        addLog('Menghapus semua log aktivitas');
        loadData();
    }
}

// Load all data
function loadData() {
    nasabahData = JSON.parse(localStorage.getItem('nasabahData')) || [];
    transaksiData = JSON.parse(localStorage.getItem('transaksi')) || [];
    transferData = JSON.parse(localStorage.getItem('transfer')) || [];
    logData = JSON.parse(localStorage.getItem('logAktivitas')) || [];
    
    updateStats();
    loadNasabah();
    loadTransaksi();
    loadTransfer();
    loadPengguna();
    loadLog();
}

// ===== PENGGUNA =====
function loadPengguna() {
    const tbody = document.getElementById('tbodyPengguna');
    tbody.innerHTML = '';
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    Object.keys(users).forEach(key => {
        const user = users[key];
        // Hanya tampilkan admin dan petugas
        if (user.role === 'admin' || user.role === 'petugas') {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.nama}</td>
                <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}">${user.role.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editPengguna('${user.username}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePengguna('${user.username}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });
}

function openModalPengguna(username = null) {
    document.getElementById('modalPengguna').classList.add('active');
    document.getElementById('formPengguna').reset();
    
    if (username) {
        document.getElementById('modalPenggunaTitle').textContent = 'Edit Pengguna';
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[username];
        document.getElementById('penggunaUsername').value = user.username;
        document.getElementById('usernamePengguna').value = user.username;
        document.getElementById('namaPengguna').value = user.nama;
        document.getElementById('rolePengguna').value = user.role;
        document.getElementById('passwordPengguna').placeholder = 'Kosongkan jika tidak diubah';
        document.getElementById('passwordPengguna').required = false;
        document.getElementById('usernamePengguna').readOnly = true;
    } else {
        document.getElementById('modalPenggunaTitle').textContent = 'Tambah Pengguna';
        document.getElementById('penggunaUsername').value = '';
        document.getElementById('passwordPengguna').placeholder = 'Masukkan password';
        document.getElementById('passwordPengguna').required = true;
        document.getElementById('usernamePengguna').readOnly = false;
    }
}

function closeModalPengguna() {
    document.getElementById('modalPengguna').classList.remove('active');
}

function editPengguna(username) {
    openModalPengguna(username);
}

function deletePengguna(username) {
    if (username === currentUser.username) {
        alert('Tidak bisa menghapus akun Anda sendiri!');
        return;
    }
    
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
        const users = JSON.parse(localStorage.getItem('users'));
        const nama = users[username].nama;
        delete users[username];
        localStorage.setItem('users', JSON.stringify(users));
        
        addLog(`Menghapus pengguna: ${nama}`);
        loadData();
    }
}

document.getElementById('formPengguna').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const oldUsername = document.getElementById('penggunaUsername').value;
    const username = document.getElementById('usernamePengguna').value;
    const nama = document.getElementById('namaPengguna').value;
    const role = document.getElementById('rolePengguna').value;
    const password = document.getElementById('passwordPengguna').value;
    
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (oldUsername && oldUsername !== '') {
        // Update
        if (password) {
            users[username] = {
                username,
                password,
                role,
                nama
            };
        } else {
            users[username] = {
                ...users[oldUsername],
                username,
                nama,
                role
            };
        }
        
        if (oldUsername !== username) {
            delete users[oldUsername];
        }
        
        addLog(`Mengupdate pengguna: ${nama}`);
    } else {
        // Create
        if (!password) {
            alert('Password harus diisi untuk pengguna baru!');
            return;
        }
        
        if (users[username]) {
            alert('Username sudah digunakan!');
            return;
        }
        
        users[username] = {
            username,
            password,
            role,
            nama
        };
        
        addLog(`Menambah pengguna baru: ${nama} (${role})`);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    closeModalPengguna();
    loadData();
});

// Initial load
loadData();
