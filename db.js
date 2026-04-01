// db.js
import { supabase } from './supabase-client.js'

// ========== HELPER ==========
export function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

export function formatTanggal(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatTanggalSaja(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

export function checkAuth(requiredRole) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== requiredRole) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

export function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ========== NASABAH API ==========
export const NasabahAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*')
            .order('id', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    },

    async create(data) {
        // Cek duplikasi norek
        const { data: existingNorek } = await supabase
            .from('nasabah')
            .select('norek')
            .eq('norek', data.norek)
            .maybeSingle();
        if (existingNorek) {
            return { success: false, message: 'Nomor rekening sudah digunakan' };
        }
        // Cek duplikasi username
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', data.username)
            .maybeSingle();
        if (existingUser) {
            return { success: false, message: 'Username sudah digunakan' };
        }

        // Insert ke users
        const { error: userError } = await supabase
            .from('users')
            .insert([{
                username: data.username,
                password: data.password,
                nama: data.nama,
                role: 'nasabah',
                norek: data.norek
            }]);
        if (userError) return { success: false, message: userError.message };

        // Insert ke nasabah
        const { error: nasabahError } = await supabase
            .from('nasabah')
            .insert([{
                norek: data.norek,
                nama: data.nama,
                alamat: data.alamat,
                telp: data.telp,
                saldo: data.saldo,
                username: data.username
            }]);
        if (nasabahError) return { success: false, message: nasabahError.message };

        // Log aktivitas
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menambah nasabah baru: ${data.nama}`
        }]);

        return { success: true, message: 'Nasabah berhasil ditambahkan' };
    },

    async update(data) {
        // Update nasabah
        const { error: nasabahError } = await supabase
            .from('nasabah')
            .update({
                nama: data.nama,
                alamat: data.alamat,
                telp: data.telp,
                saldo: data.saldo,
                username: data.username
            })
            .eq('id', data.id);
        if (nasabahError) return { success: false, message: nasabahError.message };

        // Update users
        let updateUser = {
            nama: data.nama,
            username: data.username,
            norek: data.norek
        };
        if (data.password) updateUser.password = data.password;

        const { error: userError } = await supabase
            .from('users')
            .update(updateUser)
            .eq('username', data.oldUsername);
        if (userError) return { success: false, message: userError.message };

        // Log aktivitas
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Mengupdate data nasabah: ${data.nama}`
        }]);

        return { success: true, message: 'Nasabah berhasil diupdate' };
    },

    async delete(data) {
        // Hapus nasabah (cascade akan hapus user juga)
        const { error } = await supabase
            .from('nasabah')
            .delete()
            .eq('id', data.id);
        if (error) return { success: false, message: error.message };

        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menghapus nasabah: ${data.nama}`
        }]);

        return { success: true, message: 'Nasabah berhasil dihapus' };
    }
};

// ========== TRANSAKSI API ==========
export const TransaksiAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('transaksi')
            .select('*')
            .order('tanggal', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    },

    async create(data) {
        // Cek saldo untuk tarik
        if (data.jenis === 'Tarik') {
            const { data: nasabah, error: cekError } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('norek', data.norek)
                .single();
            if (cekError) return { success: false, message: cekError.message };
            if (nasabah.saldo < data.jumlah) {
                return { success: false, message: 'Saldo tidak mencukupi' };
            }
        }

        // Insert transaksi
        const { error: transError } = await supabase
            .from('transaksi')
            .insert([{
                tanggal: data.tanggal,
                norek: data.norek,
                jenis: data.jenis,
                jumlah: data.jumlah,
                keterangan: data.keterangan
            }]);
        if (transError) return { success: false, message: transError.message };

        // Update saldo
        const increment = data.jenis === 'Setor' ? data.jumlah : -data.jumlah;
        const { error: saldoError } = await supabase
            .from('nasabah')
            .update({ saldo: supabase.rpc('increment', { row_id: data.norek, amount: increment }) }) // kita buat fungsi increment nanti
            .eq('norek', data.norek);
        // Cara sederhana: ambil saldo sekarang lalu update
        // Lebih aman pakai RPC, tapi untuk sederhana kita ambil saldo lalu update.
        // Saya akan gunakan cara sederhana:
        const { data: current } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.norek)
            .single();
        const newSaldo = current.saldo + increment;
        await supabase
            .from('nasabah')
            .update({ saldo: newSaldo })
            .eq('norek', data.norek);

        // Log aktivitas
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menambah transaksi ${data.jenis}: Rp ${data.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transaksi berhasil', saldo: newSaldo };
    },

    async update(data) {
        // Ambil transaksi lama
        const { data: old, error: oldError } = await supabase
            .from('transaksi')
            .select('*')
            .eq('id', data.id)
            .single();
        if (oldError) return { success: false, message: oldError.message };

        // Kembalikan saldo lama
        const oldIncrement = old.jenis === 'Setor' ? old.jumlah : -old.jumlah;
        const { data: current } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', old.norek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: current.saldo - oldIncrement })
            .eq('norek', old.norek);

        // Update transaksi
        const { error: updateError } = await supabase
            .from('transaksi')
            .update({
                norek: data.norek,
                jenis: data.jenis,
                jumlah: data.jumlah,
                keterangan: data.keterangan
            })
            .eq('id', data.id);
        if (updateError) return { success: false, message: updateError.message };

        // Update saldo baru
        const newIncrement = data.jenis === 'Setor' ? data.jumlah : -data.jumlah;
        const { data: currentNew } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.norek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: currentNew.saldo + newIncrement })
            .eq('norek', data.norek);

        // Log
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Mengupdate transaksi ${data.jenis}: Rp ${data.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transaksi berhasil diupdate' };
    },

    async delete(data) {
        // Ambil transaksi
        const { data: trans, error: getError } = await supabase
            .from('transaksi')
            .select('*')
            .eq('id', data.id)
            .single();
        if (getError) return { success: false, message: getError.message };

        // Kembalikan saldo
        const increment = trans.jenis === 'Setor' ? -trans.jumlah : trans.jumlah;
        const { data: current } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', trans.norek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: current.saldo + increment })
            .eq('norek', trans.norek);

        // Hapus transaksi
        const { error: delError } = await supabase
            .from('transaksi')
            .delete()
            .eq('id', data.id);
        if (delError) return { success: false, message: delError.message };

        // Log
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menghapus transaksi ${trans.jenis}: Rp ${trans.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transaksi berhasil dihapus' };
    }
};

// ========== TRANSFER API ==========
export const TransferAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('transfer')
            .select('*')
            .order('tanggal', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    },

    async create(data) {
        if (data.dariRek === data.keRek) {
            return { success: false, message: 'Tidak bisa transfer ke rekening yang sama' };
        }

        // Cek saldo pengirim
        const { data: pengirim, error: cekError } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.dariRek)
            .single();
        if (cekError) return { success: false, message: cekError.message };
        if (pengirim.saldo < data.jumlah) {
            return { success: false, message: 'Saldo tidak mencukupi' };
        }

        // Insert transfer
        const { error: transferError } = await supabase
            .from('transfer')
            .insert([{
                tanggal: data.tanggal,
                dari_rek: data.dariRek,
                ke_rek: data.keRek,
                jumlah: data.jumlah,
                keterangan: data.keterangan,
                status: 'Berhasil'
            }]);
        if (transferError) return { success: false, message: transferError.message };

        // Update saldo pengirim (kurang)
        const { data: currentPengirim } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.dariRek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: currentPengirim.saldo - data.jumlah })
            .eq('norek', data.dariRek);

        // Update saldo penerima (tambah)
        const { data: currentPenerima } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.keRek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: currentPenerima.saldo + data.jumlah })
            .eq('norek', data.keRek);

        // Log
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menambah transfer: Rp ${data.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transfer berhasil' };
    },

    async update(data) {
        // Ambil transfer lama
        const { data: old, error: oldError } = await supabase
            .from('transfer')
            .select('*')
            .eq('id', data.id)
            .single();
        if (oldError) return { success: false, message: oldError.message };

        // Kembalikan saldo lama
        const { data: oldPengirim } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', old.dari_rek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: oldPengirim.saldo + old.jumlah })
            .eq('norek', old.dari_rek);
        const { data: oldPenerima } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', old.ke_rek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: oldPenerima.saldo - old.jumlah })
            .eq('norek', old.ke_rek);

        // Update transfer
        const { error: updateError } = await supabase
            .from('transfer')
            .update({
                dari_rek: data.dariRek,
                ke_rek: data.keRek,
                jumlah: data.jumlah,
                keterangan: data.keterangan
            })
            .eq('id', data.id);
        if (updateError) return { success: false, message: updateError.message };

        // Update saldo baru
        const { data: newPengirim } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.dariRek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: newPengirim.saldo - data.jumlah })
            .eq('norek', data.dariRek);
        const { data: newPenerima } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', data.keRek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: newPenerima.saldo + data.jumlah })
            .eq('norek', data.keRek);

        // Log
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Mengupdate transfer: Rp ${data.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transfer berhasil diupdate' };
    },

    async delete(data) {
        // Ambil transfer
        const { data: transfer, error: getError } = await supabase
            .from('transfer')
            .select('*')
            .eq('id', data.id)
            .single();
        if (getError) return { success: false, message: getError.message };

        // Kembalikan saldo
        const { data: pengirim } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', transfer.dari_rek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: pengirim.saldo + transfer.jumlah })
            .eq('norek', transfer.dari_rek);
        const { data: penerima } = await supabase
            .from('nasabah')
            .select('saldo')
            .eq('norek', transfer.ke_rek)
            .single();
        await supabase
            .from('nasabah')
            .update({ saldo: penerima.saldo - transfer.jumlah })
            .eq('norek', transfer.ke_rek);

        // Hapus transfer
        const { error: delError } = await supabase
            .from('transfer')
            .delete()
            .eq('id', data.id);
        if (delError) return { success: false, message: delError.message };

        // Log
        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menghapus transfer: Rp ${transfer.jumlah.toLocaleString('id-ID')}`
        }]);

        return { success: true, message: 'Transfer berhasil dihapus' };
    }
};

// ========== PENGGUNA API ==========
export const PenggunaAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['admin', 'petugas'])
            .order('id', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    },

    async create(data) {
        // Cek duplikasi username
        const { data: existing } = await supabase
            .from('users')
            .select('username')
            .eq('username', data.username)
            .maybeSingle();
        if (existing) {
            return { success: false, message: 'Username sudah digunakan' };
        }

        const { error } = await supabase
            .from('users')
            .insert([{
                username: data.username,
                password: data.password,
                nama: data.nama,
                role: data.role
            }]);
        if (error) return { success: false, message: error.message };

        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menambah pengguna baru: ${data.nama} (${data.role})`
        }]);

        return { success: true, message: 'Pengguna berhasil ditambahkan' };
    },

    async update(data) {
        let updateData = {
            username: data.username,
            nama: data.nama,
            role: data.role
        };
        if (data.password) updateData.password = data.password;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('username', data.oldUsername);
        if (error) return { success: false, message: error.message };

        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Mengupdate pengguna: ${data.nama}`
        }]);

        return { success: true, message: 'Pengguna berhasil diupdate' };
    },

    async delete(data) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('username', data.username);
        if (error) return { success: false, message: error.message };

        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: `Menghapus pengguna: ${data.nama}`
        }]);

        return { success: true, message: 'Pengguna berhasil dihapus' };
    }
};

// ========== LOG API ==========
export const LogAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('log_aktivitas')
            .select('*')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    },

    async deleteAll(data) {
        const { error } = await supabase
            .from('log_aktivitas')
            .delete()
            .neq('id', 0); // hapus semua
        if (error) return { success: false, message: error.message };

        await supabase.from('log_aktivitas').insert([{
            timestamp: new Date().toISOString(),
            user: data.currentUser,
            role: data.currentRole,
            aktivitas: 'Menghapus semua log aktivitas'
        }]);

        return { success: true, message: 'Semua log berhasil dihapus' };
    }
};