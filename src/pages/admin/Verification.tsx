import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, User, ShieldCheck, KeyRound, Phone, Search, Download, Upload, Trash2, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';

export const AdminVerification = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // STATE TAB: 'pending' (Verifikasi) atau 'active' (Daftar Anggota)
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    
    // REF UNTUK INPUT FILE IMPORT
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🔥 STATE UNTUK CUSTOM POPUP CONFIRMATION 🔥
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'verify' | 'reject' | 'reset_pin' | 'delete' | null; 
        userId: string; 
        userName: string; 
    }>({
        isOpen: false,
        type: null,
        userId: '',
        userName: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

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
    const executeVerify = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('Memproses...');
        try {
            const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
            if (error) throw error;

            // Buat notifikasi selamat datang
            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'Selamat Bergabung!',
                message: 'Akun Anda telah diverifikasi. Silakan lengkapi profil dan atur PIN transaksi.',
                type: 'info'
            });

            toast.success('Berhasil diverifikasi!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeReject = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('Menolak...');
        try {
            await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
            toast.success('Ditolak', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- LOGIC RESET PIN ---
    const executeResetPin = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('Mereset PIN...');
        try {
            const { error } = await supabase.from('profiles').update({ pin: null }).eq('id', userId);
            if (error) throw error;
            toast.success('PIN Berhasil Direset!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- LOGIC HAPUS AKUN ---
    const executeDeleteUser = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('Menghapus akun...');
        try {
            // Menghapus data profil dari database
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            
            if (error) {
                // Menangkap error spesifik Foreign Key Constraint
                if (error.code === '23503') {
                    throw new Error("Anggota ini masih memiliki riwayat transaksi/pinjaman. Aktifkan fitur 'ON DELETE CASCADE' di Database Supabase Anda terlebih dahulu.");
                }
                throw error;
            }
            
            toast.success('Akun berhasil dihapus!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message, { id: toastId, duration: 6000 });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- TRIGGER UNTUK MEMBUKA MODAL KUSTOM ---
    const triggerModal = (type: 'verify' | 'reject' | 'reset_pin' | 'delete', id: string, name: string) => {
        setConfirmModal({ isOpen: true, type, userId: id, userName: name || 'Anggota' });
    };

    // --- LOGIC EXPORT TO EXCEL TABLE ---
    const handleExportCSV = () => {
        if (filteredUsers.length === 0) {
            toast.error("Tidak ada data untuk di-export");
            return;
        }

        const headers = ['Member ID', 'Nama Lengkap', 'Email', 'No. HP', 'Status', 'Saldo Tapro', 'Tanggal Daftar'];
        
        // Membangun baris tabel HTML dengan styling
        const tableRows = filteredUsers.map(user => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 4px;">${user.member_id || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${user.full_name || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${user.email || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px; mso-number-format:'\\@';">${user.phone || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${user.status || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${user.tapro_balance || 0}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
            </tr>
        `).join('');

        // Struktur dokumen Excel (XLS) berbasis HTML agar rapi saat dibuka
        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                </head>
            <body>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th style="background-color: #136f42; color: white; border: 1px solid #136f42; padding: 8px; font-weight: bold;">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Anggota_Koperasi_${format(new Date(), 'dd-MMM-yyyy')}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Data berhasil di-export ke Excel!");
    };

    // --- LOGIC IMPORT DATA DARI CSV ---
    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Memproses import data...');
        try {
            const text = await file.text();
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) throw new Error("File CSV kosong atau format tidak sesuai");

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            
            const emailIdx = headers.findIndex(h => h.includes('email'));
            const memberIdIdx = headers.findIndex(h => h.includes('member id') || h.includes('id'));
            const balanceIdx = headers.findIndex(h => h.includes('saldo') || h.includes('tapro'));
            const statusIdx = headers.findIndex(h => h.includes('status'));

            if (emailIdx === -1 && memberIdIdx === -1) {
                throw new Error("Kolom 'Email' atau 'Member ID' tidak ditemukan untuk pencocokan data");
            }

            let successCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || rows[i].split(',');
                
                const email = emailIdx !== -1 ? cols[emailIdx] : null;
                const memberId = memberIdIdx !== -1 ? cols[memberIdIdx] : null;
                
                if (!email && !memberId) continue;

                const updateData: any = {};
                if (balanceIdx !== -1 && cols[balanceIdx]) {
                    updateData.tapro_balance = parseInt(cols[balanceIdx].replace(/\D/g, '')) || 0;
                }
                if (statusIdx !== -1 && cols[statusIdx]) {
                    updateData.status = cols[statusIdx];
                }

                if (Object.keys(updateData).length > 0) {
                    let query = supabase.from('profiles').update(updateData);
                    if (email) query = query.eq('email', email);
                    else if (memberId) query = query.eq('member_id', memberId);

                    const { error } = await query;
                    if (!error) successCount++;
                }
            }

            toast.success(`Berhasil update ${successCount} data anggota!`, { id: toastId });
            fetchUsers(); 
        } catch (err: any) {
            toast.error(`Gagal import: ${err.message}`, { id: toastId });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit">
                    <ArrowLeft size={18} /> Kembali ke Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Anggota</h1>
                        <p className="text-sm text-gray-500">Verifikasi anggota baru & kelola data anggota aktif.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeTab === 'active' && (
                            <>
                                {/* INPUT FILE TERSEMBUNYI UNTUK IMPORT */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImportCSV} 
                                    accept=".csv" 
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-2 px-4 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                >
                                    <Upload size={18} /> Import CSV
                                </button>
                                
                                <button onClick={handleExportCSV} className="p-2 px-4 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors">
                                    <Download size={18} /> Export Excel
                                </button>
                            </>
                        )}
                        <button onClick={fetchUsers} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
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
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {/* Menampilkan Foto Profil dari DB */}
                                                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-400 font-bold uppercase text-xs">
                                                            {user.full_name?.substring(0, 2) || 'US'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight">{user.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{user.member_id || 'PROSES...'}</p>
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
                                                    <button onClick={() => triggerModal('reject', user.id, user.full_name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => triggerModal('verify', user.id, user.full_name)} className="px-4 py-2 bg-kkj-blue text-white rounded-lg hover:bg-blue-800 font-bold text-sm flex items-center gap-2">
                                                        <Check size={18} /> Verifikasi
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => triggerModal('reset_pin', user.id, user.full_name)}
                                                        className="px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <KeyRound size={14} /> Reset PIN
                                                    </button>
                                                    <button
                                                        onClick={() => triggerModal('delete', user.id, user.full_name)}
                                                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 CUSTOM POPUP CONFIRMATION MODAL 🔥 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        
                        {/* Icon Dinamis Berdasarkan Tipe Aksi */}
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", 
                            confirmModal.type === 'verify' ? 'bg-green-50 text-green-600' : 
                            confirmModal.type === 'reset_pin' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        )}>
                            {confirmModal.type === 'verify' ? <Check size={32} /> : 
                             confirmModal.type === 'reset_pin' ? <KeyRound size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        
                        {/* Judul Dinamis */}
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'verify' ? 'Verifikasi Pendaftaran?' : 
                             confirmModal.type === 'reject' ? 'Tolak Pendaftaran?' : 
                             confirmModal.type === 'reset_pin' ? 'Reset PIN Transaksi?' : 'Hapus Akun Permanen?'}
                        </h3>
                        
                        {/* Pesan Dinamis */}
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 px-2">
                            {confirmModal.type === 'verify' && `Setujui pendaftaran atas nama ${confirmModal.userName}?`}
                            {confirmModal.type === 'reject' && `Tolak pendaftaran atas nama ${confirmModal.userName}?`}
                            {confirmModal.type === 'reset_pin' && `PIN milik ${confirmModal.userName} akan dihapus dan pengguna harus mengaturnya ulang.`}
                            {confirmModal.type === 'delete' && `PERINGATAN: Apakah Anda yakin ingin menghapus akun ${confirmModal.userName} secara permanen? Tindakan ini tidak dapat dibatalkan.`}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button 
                                onClick={() => {
                                    if (confirmModal.type === 'verify') executeVerify();
                                    else if (confirmModal.type === 'reject') executeReject();
                                    else if (confirmModal.type === 'reset_pin') executeResetPin();
                                    else if (confirmModal.type === 'delete') executeDeleteUser();
                                }} 
                                disabled={isProcessing} 
                                className={cn("py-3.5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform", 
                                    confirmModal.type === 'verify' ? 'bg-[#136f42] shadow-green-900/20' : 
                                    confirmModal.type === 'reset_pin' ? 'bg-amber-500 shadow-amber-900/20' : 'bg-rose-600 shadow-rose-900/20'
                                )}
                            >
                                {isProcessing ? 'Proses...' : 'Ya, Lanjutkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};