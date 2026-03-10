// Cek autentikasi
const currentUser = checkAuth('admin');
if (!currentUser) {
    window.location.href = 'index.html';
}

document.getElementById('userName').textContent = currentUser.nama;

// Load data
let nasabahData = [];
let transaksiData = [];
let transferData = [];
let penggunaData = [];
let logData = [];

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

// ===== NASABAH =====
async function loadNasabah() {
    const tbody = document.getElementById('tbodyNasabah');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    const result = await NasabahAPI.getAll();
    if (result.success) {
        nasabahData = result.data;
        tbody.innerHTML = '';
        
        nasabahData.forEach(nasabah => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nasabah.norek}</td>
                <td>${nasabah.nama}</td>
                <td>${nasabah.alamat}</td>
                <td>${nasabah.telp}</td>
                <td>${formatRupiah(parseFloat(nasabah.saldo))}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editNasabah(${nasabah.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNasabah(${nasabah.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
}

function openModalNasabah(id = null) {
    document.getElementById('modalNasabah').classList.add('active');
    document.getElementById('formNasabah').reset();
    
    if (id) {
        document.getElementById('modalNasabahTitle').textContent = 'Edit Nasabah';
        const nasabah = nasabahData.find(n => n.id == id);
        document.getElementById('nasabahId').value = nasabah.id;
        document.getElementById('norek').value = nasabah.norek;
        document.getElementById('nama').value = nasabah.nama;
        document.getElementById('alamat').value = nasabah.alamat;
        document.getElementById('telp').value = nasabah.telp;
        document.getElementById('saldo').value = nasabah.saldo;
        document.getElementById('usernameNasabah').value = nasabah.username;
        document.getElementById('passwordNasabah').placeholder = 'Kosongkan jika tidak diubah';
        document.getElementById('passwordNasabah').required = false;
        document.getElementById('usernameNasabah').readOnly = true;
    } else {
        document.getElementById('modalNasabahTitle').textContent = 'Tambah Nasabah';
        document.getElementById('nasabahId').value = '';
        document.getElementById('passwordNasabah').placeholder = 'Masukkan password';
        document.getElementById('passwordNasabah').required = true;
        document.getElementById('usernameNasabah').readOnly = false;
    }
}

function closeModalNasabah() {
    document.getElementById('modalNasabah').classList.remove('active');
}

function editNasabah(id) {
    openModalNasabah(id);
}

async function deleteNasabah(id) {
    if (confirm('Yakin ingin menghapus nasabah ini?')) {
        const nasabah = nasabahData.find(n => n.id == id);
        const result = await NasabahAPI.delete({
            id: id,
            username: nasabah.username,
            nama: nasabah.nama,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert('Nasabah berhasil dihapus');
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
}

document.getElementById('formNasabah').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('nasabahId').value;
    const norek = document.getElementById('norek').value;
    const nama = document.getElementById('nama').value;
    const alamat = document.getElementById('alamat').value;
    const telp = document.getElementById('telp').value;
    const saldo = parseFloat(document.getElementById('saldo').value);
    const username = document.getElementById('usernameNasabah').value;
    const password = document.getElementById('passwordNasabah').value;
    
    const data = {
        norek, nama, alamat, telp, saldo, username,
        currentUser: currentUser.nama,
        currentRole: currentUser.role
    };
    
    let result;
    if (id && id !== '') {
        // Update
        const oldNasabah = nasabahData.find(n => n.id == id);
        data.id = id;
        data.oldUsername = oldNasabah.username;
        if (password) data.password = password;
        
        result = await NasabahAPI.update(data);
    } else {
        // Create
        if (!password) {
            alert('Password harus diisi untuk nasabah baru!');
            return;
        }
        data.password = password;
        result = await NasabahAPI.create(data);
    }
    
    if (result.success) {
        alert(result.message);
        closeModalNasabah();
        loadData();
    } else {
        alert('Error: ' + result.message);
    }
});

// ===== TRANSAKSI =====
async function loadTransaksi() {
    const tbody = document.getElementById('tbodyTransaksi');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
    
    const result = await TransaksiAPI.getAll();
    if (result.success) {
        transaksiData = result.data;
        tbody.innerHTML = '';
        
        transaksiData.forEach(transaksi => {
            const nasabah = nasabahData.find(n => n.norek === transaksi.norek);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatTanggal(transaksi.tanggal)}</td>
                <td>${transaksi.norek}</td>
                <td>${nasabah ? nasabah.nama : '-'}</td>
                <td><span class="badge ${transaksi.jenis === 'Setor' ? 'badge-success' : 'badge-danger'}">${transaksi.jenis}</span></td>
                <td>${formatRupiah(parseFloat(transaksi.jumlah))}</td>
                <td>${transaksi.keterangan || '-'}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editTransaksi(${transaksi.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaksi(${transaksi.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
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
        const transaksi = transaksiData.find(t => t.id == id);
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

async function deleteTransaksi(id) {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
        const result = await TransaksiAPI.delete({
            id: id,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert('Transaksi berhasil dihapus');
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
}

document.getElementById('formTransaksi').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('transaksiId').value;
    const norek = document.getElementById('norekTransaksi').value;
    const jenis = document.getElementById('jenis').value;
    const jumlah = parseFloat(document.getElementById('jumlah').value);
    const keterangan = document.getElementById('keterangan').value;
    
    const data = {
        norek, jenis, jumlah, keterangan,
        tanggal: new Date().toISOString().slice(0, 19).replace('T', ' '),
        currentUser: currentUser.nama,
        currentRole: currentUser.role
    };
    
    let result;
    if (id && id !== '') {
        data.id = id;
        result = await TransaksiAPI.update(data);
    } else {
        result = await TransaksiAPI.create(data);
    }
    
    if (result.success) {
        alert(result.message);
        closeModalTransaksi();
        loadData();
    } else {
        alert('Error: ' + result.message);
    }
});

// ===== TRANSFER =====
async function loadTransfer() {
    const tbody = document.getElementById('tbodyTransfer');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
    
    const result = await TransferAPI.getAll();
    if (result.success) {
        transferData = result.data;
        tbody.innerHTML = '';
        
        transferData.forEach(transfer => {
            const dari = nasabahData.find(n => n.norek === transfer.dari_rek);
            const ke = nasabahData.find(n => n.norek === transfer.ke_rek);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatTanggal(transfer.tanggal)}</td>
                <td>${transfer.dari_rek} ${dari ? `(${dari.nama})` : ''}</td>
                <td>${transfer.ke_rek} ${ke ? `(${ke.nama})` : ''}</td>
                <td>${formatRupiah(parseFloat(transfer.jumlah))}</td>
                <td>${transfer.keterangan || '-'}</td>
                <td><span class="badge badge-success">${transfer.status}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editTransfer(${transfer.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTransfer(${transfer.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
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
        const transfer = transferData.find(t => t.id == id);
        document.getElementById('transferId').value = transfer.id;
        document.getElementById('dariRek').value = transfer.dari_rek;
        document.getElementById('keRek').value = transfer.ke_rek;
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

async function deleteTransfer(id) {
    if (confirm('Yakin ingin menghapus transfer ini?')) {
        const result = await TransferAPI.delete({
            id: id,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert('Transfer berhasil dihapus');
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
}

document.getElementById('formTransfer').addEventListener('submit', async function(e) {
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
    
    const data = {
        dariRek, keRek, jumlah, keterangan,
        tanggal: new Date().toISOString().slice(0, 19).replace('T', ' '),
        currentUser: currentUser.nama,
        currentRole: currentUser.role
    };
    
    let result;
    if (id && id !== '') {
        data.id = id;
        result = await TransferAPI.update(data);
    } else {
        result = await TransferAPI.create(data);
    }
    
    if (result.success) {
        alert(result.message);
        closeModalTransfer();
        loadData();
    } else {
        alert('Error: ' + result.message);
    }
});

// ===== PENGGUNA =====
async function loadPengguna() {
    const tbody = document.getElementById('tbodyPengguna');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    const result = await PenggunaAPI.getAll();
    if (result.success) {
        penggunaData = result.data;
        tbody.innerHTML = '';
        
        penggunaData.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.nama}</td>
                <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}">${user.role.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editPengguna('${user.username}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePengguna('${user.username}', '${user.nama}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
}

function openModalPengguna(username = null) {
    document.getElementById('modalPengguna').classList.add('active');
    document.getElementById('formPengguna').reset();
    
    if (username) {
        document.getElementById('modalPenggunaTitle').textContent = 'Edit Pengguna';
        const user = penggunaData.find(u => u.username === username);
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

async function deletePengguna(username, nama) {
    if (username === currentUser.username) {
        alert('Tidak bisa menghapus akun Anda sendiri!');
        return;
    }
    
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
        const result = await PenggunaAPI.delete({
            username: username,
            nama: nama,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert('Pengguna berhasil dihapus');
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
}

document.getElementById('formPengguna').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const oldUsername = document.getElementById('penggunaUsername').value;
    const username = document.getElementById('usernamePengguna').value;
    const nama = document.getElementById('namaPengguna').value;
    const role = document.getElementById('rolePengguna').value;
    const password = document.getElementById('passwordPengguna').value;
    
    const data = {
        username, nama, role,
        currentUser: currentUser.nama,
        currentRole: currentUser.role
    };
    
    let result;
    if (oldUsername && oldUsername !== '') {
        data.oldUsername = oldUsername;
        if (password) data.password = password;
        result = await PenggunaAPI.update(data);
    } else {
        if (!password) {
            alert('Password harus diisi untuk pengguna baru!');
            return;
        }
        data.password = password;
        result = await PenggunaAPI.create(data);
    }
    
    if (result.success) {
        alert(result.message);
        closeModalPengguna();
        loadData();
    } else {
        alert('Error: ' + result.message);
    }
});

// ===== LOG =====
async function loadLog() {
    const tbody = document.getElementById('tbodyLog');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    const result = await LogAPI.getAll();
    if (result.success) {
        logData = result.data;
        tbody.innerHTML = '';
        
        logData.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatTanggal(log.timestamp)}</td>
                <td>${log.user}</td>
                <td><span class="badge badge-info">${log.role}</span></td>
                <td>${log.aktivitas}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
}

async function clearLogs() {
    if (confirm('Yakin ingin menghapus semua log aktivitas?')) {
        const result = await LogAPI.deleteAll({
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert('Semua log berhasil dihapus');
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
}

// Load all data
async function loadData() {
    await loadNasabah();
    await loadTransaksi();
    await loadTransfer();
    await loadPengguna();
    await loadLog();
    updateStats();
}

// Initial load
loadData();
