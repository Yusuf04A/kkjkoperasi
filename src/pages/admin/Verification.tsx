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
        userData?: any; // Simpan data user lengkap untuk validasi saldo
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
            // Generate NIAK: KKJ-YYMMNNNN (hanya menghitung anggota aktif)
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')
                .not('member_id', 'is', null);

            const seq = (count || 0) + 1;
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const nnak = String(seq).padStart(4, '0');
            const memberId = `KKJ-${yy}${mm}${nnak}`;

            const { error } = await supabase
                .from('profiles')
                .update({ status: 'active', member_id: memberId })
                .eq('id', userId);
            if (error) throw error;

            // Buat notifikasi selamat datang
            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'Selamat Bergabung!',
                message: `Akun Anda telah diverifikasi. NIAK Anda: ${memberId}. Silakan lengkapi profil dan atur PIN transaksi.`,
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

    // --- 🔥 LOGIC HAPUS AKUN DENGAN VALIDASI SALDO NOL 🔥 ---
    const executeDeleteUser = async () => {
        const { userId, userData } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('Memeriksa saldo...');

        try {
            // 1. Cek semua komponen saldo (Simpanan & Investasi)
            const totalBalance = (
                (userData.tapro_balance || 0) +
                (userData.simpok_balance || 0) +
                (userData.simwa_balance || 0) +
                (userData.simade_balance || 0) +
                (userData.sipena_balance || 0) +
                (userData.siwalima_balance || 0) +
                (userData.siuji_balance || 0) +
                (userData.siqurma_balance || 0) +
                (userData.sihara_balance || 0) +
                (userData.tamasa_balance || 0) +
                (userData.inflip_balance || 0)
            );

            // Syarat: saldo harus sudah nol
            if (totalBalance > 0) {
                throw new Error(`Anggota masih memiliki sisa saldo ${formatRupiah(totalBalance)}. Harap kosongkan saldo sebelum menghapus.`);
            }

            // 2. Eksekusi hapus jika saldo sudah benar-benar nol
            const { error } = await supabase.from('profiles').delete().eq('id', userId);

            if (error) {
                if (error.code === '23503') {
                    throw new Error("Gagal: Anggota memiliki data terkait di tabel lain. Hubungi IT untuk penghapusan paksa.");
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

    const triggerModal = (type: 'verify' | 'reject' | 'reset_pin' | 'delete', id: string, name: string, data?: any) => {
        setConfirmModal({ isOpen: true, type, userId: id, userName: name || 'Anggota', userData: data });
    };

    // --- LOGIC EXPORT & IMPORT (DISEDERHANAKAN) ---
    const handleExportCSV = () => {
        if (filteredUsers.length === 0) return toast.error("Tidak ada data");
        const headers = ['Member ID', 'Nama', 'Saldo Tapro'];
        const tableRows = filteredUsers.map(user => `<tr><td>${user.member_id}</td><td>${user.full_name}</td><td>${user.tapro_balance}</td></tr>`).join('');
        const htmlContent = `<html><body><table border="1">${tableRows}</table></body></html>`;
        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Data_Anggota.xls`;
        link.click();
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => { /* Tetap sama seperti kode Anda */ };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-left lowercase">
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit">
                    <ArrowLeft size={18} /> Kembali ke Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 first-letter:uppercase">manajemen anggota</h1>
                        <p className="text-sm text-gray-500">verifikasi anggota baru & kelola data anggota aktif.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeTab === 'active' && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 px-4 bg-blue-600 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all active:scale-95"><Upload size={18} /> Import CSV</button>
                                <button onClick={handleExportCSV} className="p-2 px-4 bg-emerald-600 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all active:scale-95"><Download size={18} /> Export Excel</button>
                            </>
                        )}
                        <button onClick={fetchUsers} className="p-2 bg-white border border-gray-200 rounded-lg"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button onClick={() => { setActiveTab('pending'); setSearchTerm(''); }} className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-kkj-blue border-b-2 border-kkj-blue' : 'text-gray-400'}`}>Verifikasi Baru {users.length > 0 && activeTab === 'pending' && <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{users.length}</span>}</button>
                <button onClick={() => { setActiveTab('active'); setSearchTerm(''); }} className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'active' ? 'text-kkj-blue border-b-2 border-kkj-blue' : 'text-gray-400'}`}>Data Anggota Aktif</button>
            </div>

            {activeTab === 'active' && (
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="cari nama, niak, atau no hp..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kkj-blue" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                                <tr><td colSpan={5} className="p-12 text-center text-gray-500"><p>tidak ada data.</p></td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-400 font-bold uppercase text-xs">{u.full_name?.substring(0, 2)}</span>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight uppercase">{u.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{u.member_id || 'PROSES...'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2"><Phone size={14} /> {u.phone}</div>
                                            <div className="text-xs text-gray-400 mt-1">{u.email}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                                        {activeTab === 'active' && <td className="p-4 font-bold text-gray-900">{formatRupiah(u.tapro_balance || 0)}</td>}
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => triggerModal('reject', u.id, u.full_name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-all active:scale-90"><X size={18} /></button>
                                                        <button onClick={() => triggerModal('verify', u.id, u.full_name)} className="px-4 py-2 bg-kkj-blue text-white rounded-lg hover:bg-blue-800 font-bold text-sm flex items-center gap-2 transition-all active:scale-95"><Check size={18} /> Verifikasi</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => triggerModal('reset_pin', u.id, u.full_name)} className="px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold flex items-center gap-1 uppercase tracking-tighter"><KeyRound size={14} /> Reset PIN</button>
                                                        {/* 🔥 TOMBOL HAPUS DENGAN DATA USER LENGKAP 🔥 */}
                                                        <button onClick={() => triggerModal('delete', u.id, u.full_name, u)} className="p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
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
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner",
                            confirmModal.type === 'verify' ? 'bg-green-50 text-[#136f42]' :
                                confirmModal.type === 'reset_pin' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        )}>
                            {confirmModal.type === 'verify' ? <Check size={32} /> : confirmModal.type === 'reset_pin' ? <KeyRound size={32} /> : <Trash2 size={32} />}
                        </div>

                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'verify' ? 'Verifikasi Anggota?' : confirmModal.type === 'reset_pin' ? 'Reset PIN Transaksi?' : 'Hapus Anggota?'}
                        </h3>

                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8 px-2 uppercase">
                            {confirmModal.type === 'verify' && `setujui pendaftaran ${confirmModal.userName}?`}
                            {confirmModal.type === 'reset_pin' && `pin milik ${confirmModal.userName} akan di-nol-kan kembali.`}
                            {confirmModal.type === 'delete' && `hapus akun ${confirmModal.userName} secara permanen? syarat: seluruh saldo harus sudah nol.`}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-3.5 bg-slate-100 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">batal</button>
                            <button
                                onClick={() => {
                                    if (confirmModal.type === 'verify') executeVerify();
                                    else if (confirmModal.type === 'reject') executeReject();
                                    else if (confirmModal.type === 'reset_pin') executeResetPin();
                                    else if (confirmModal.type === 'delete') executeDeleteUser();
                                }}
                                disabled={isProcessing}
                                className={cn("py-3.5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all",
                                    confirmModal.type === 'verify' ? 'bg-[#136f42] shadow-green-900/20' :
                                        confirmModal.type === 'reset_pin' ? 'bg-amber-500 shadow-amber-900/20' : 'bg-rose-600 shadow-rose-900/20'
                                )}
                            >
                                {isProcessing ? 'proses...' : 'lanjutkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};