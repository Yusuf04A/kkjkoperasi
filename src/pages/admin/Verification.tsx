import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, User, ShieldCheck, KeyRound, Phone, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';

export const AdminVerification = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // STATE TAB: 'pending' (Verifikasi) atau 'active' (Daftar Anggota)
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter berdasarkan Tab
        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.eq('status', 'active');
        }

        // Jangan tampilkan akun Admin di list
        query = query.neq('role', 'admin');

        const { data, error } = await query;
        if (error) {
            toast.error("Gagal mengambil data");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    // --- LOGIC VERIFIKASI ---
    const handleVerify = async (id: string, name: string) => {
        const confirm = window.confirm(`Setujui pendaftaran ${name}?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses...');
        try {
            const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
            if (error) throw error;

            // Buat notifikasi selamat datang (Opsional)
            await supabase.from('notifications').insert({
                user_id: id,
                title: 'Selamat Bergabung!',
                message: 'Akun Anda telah diverifikasi. Silakan lengkapi profil dan atur PIN transaksi.',
                type: 'info'
            });

            toast.success('Berhasil diverifikasi!', { id: toastId });
            fetchUsers();
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Tolak pendaftaran ini?")) return;
        const toastId = toast.loading('Menolak...');
        await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
        toast.success('Ditolak', { id: toastId });
        fetchUsers();
    };

    // --- LOGIC RESET PIN ---
    const handleResetPin = async (id: string, name: string) => {
        const confirm = window.confirm(`Reset PIN untuk ${name}?\nPIN akan dihapus dan member harus mengaturnya ulang.`);
        if (!confirm) return;

        const toastId = toast.loading('Mereset PIN...');
        try {
            const { error } = await supabase.from('profiles').update({ pin: null }).eq('id', id);
            if (error) throw error;
            toast.success('PIN Berhasil Direset!', { id: toastId });
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        }
    };

    // --- LOGIC EXPORT TO CSV ---
    const handleExportCSV = () => {
        if (filteredUsers.length === 0) {
            toast.error("Tidak ada data untuk di-export");
            return;
        }

        // 1. Definisikan Header CSV
        const headers = ['Member ID', 'Nama Lengkap', 'Email', 'No. HP', 'Status', 'Saldo Tapro', 'Tanggal Daftar'];
        
        // 2. Format Data ke bentuk CSV
        const csvRows = filteredUsers.map(user => {
            return [
                user.member_id || '-',
                `"${user.full_name || '-'}"`, // Pakai kutip agar aman jika nama ada koma
                user.email || '-',
                `"${user.phone || '-'}"`, // Pakai kutip agar angka 0 di awal nomor HP tidak hilang di Excel
                user.status || '-',
                user.tapro_balance || 0,
                format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss')
            ].join(',');
        });

        // 3. Gabungkan Header dan Baris Data
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // 4. Buat file Blob dan Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Anggota_Koperasi_${format(new Date(), 'dd-MMM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Data berhasil di-export!");
    };

    // Filter pencarian
    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">

            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit">
                    <ArrowLeft size={18} /> Kembali ke Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Anggota</h1>
                        <p className="text-sm text-gray-500">Verifikasi anggota baru & kelola data anggota aktif.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* TOMBOL EXPORT MUNCUL DI SINI */}
                        {activeTab === 'active' && (
                            <button onClick={handleExportCSV} className="p-2 px-4 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors">
                                <Download size={18} /> Export Data
                            </button>
                        )}
                        <button onClick={fetchUsers} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Verifikasi Baru
                    {activeTab === 'pending' && <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{users.length}</span>}
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('active'); setSearchTerm(''); }}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'active' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Data Anggota Aktif
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* SEARCH BAR (Hanya di Tab Active) */}
            {activeTab === 'active' && (
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama, ID anggota, atau no HP..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-kkj-blue focus:ring-1 focus:ring-kkj-blue outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* LIST CONTENT */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Anggota</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Kontak</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tanggal Daftar</th>
                                {activeTab === 'active' && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Saldo Tapro</th>}
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <User size={40} className="mx-auto mb-2 text-gray-300" />
                                        <p>Tidak ada data {activeTab === 'pending' ? 'verifikasi baru' : 'anggota'}.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                                                    {user.full_name?.substring(0, 2) || 'US'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{user.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{user.member_id || 'Belum ada ID'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} /> {user.phone}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{user.email}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {format(new Date(user.created_at), 'dd MMM yyyy, HH:mm')}
                                        </td>

                                        {activeTab === 'active' && (
                                            <td className="p-4 font-bold text-gray-900">
                                                {formatRupiah(user.tapro_balance || 0)}
                                            </td>
                                        )}

                                        <td className="p-4 text-right">
                                            {activeTab === 'pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => handleReject(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => handleVerify(user.id, user.full_name)} className="px-4 py-2 bg-kkj-blue text-white rounded-lg hover:bg-blue-800 font-bold text-sm flex items-center gap-2">
                                                        <Check size={18} /> Verifikasi
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleResetPin(user.id, user.full_name)}
                                                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                                                    title="Hapus PIN User agar bisa buat baru"
                                                >
                                                    <KeyRound size={14} /> Reset PIN
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};