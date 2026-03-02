import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, ShieldCheck, KeyRound, Phone, Search, Download, Upload, Trash2, AlertTriangle, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';

export const AdminVerification = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'verify' | 'reject' | 'reset_pin' | 'delete' | null;
        userId: string;
        userName: string;
        userData?: any;
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

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.eq('status', 'active');
        }

        query = query.neq('role', 'admin');

        const { data, error } = await query;
        if (error) {
            toast.error("gagal mengambil data");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const executeVerify = async () => {
        const userId = selectedMember?.id;
        setIsProcessing(true);
        const toastId = toast.loading('memverifikasi & mengisi saldo...');
        try {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'member')
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
                .update({
                    status: 'active',
                    member_id: memberId,
                    is_verified: true,
                    simpok_balance: 250000
                })
                .eq('id', userId);

            if (error) throw error;

            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'akun aktif!',
                message: `selamat! akun anda telah diverifikasi. niak: ${memberId}. simpanan pokok rp 250.000 telah diaktifkan.`,
                type: 'success'
            });

            toast.success('anggota berhasil diaktifkan!', { id: toastId });
            setShowVerifyModal(false);
            fetchUsers();
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeReject = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('menolak...');
        try {
            await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
            toast.success('pendaftaran ditolak', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeResetPin = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('mereset pin...');
        try {
            const { error } = await supabase.from('profiles').update({ pin: null }).eq('id', userId);
            if (error) throw error;
            toast.success('pin berhasil direset!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeDeleteUser = async () => {
        const { userId, userData } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('memeriksa saldo...');
        try {
            const totalBalance = (
                (userData.tapro_balance || 0) +
                (userData.simpok_balance || 0) +
                (userData.simwa_balance || 0) +
                (userData.tamasa_balance || 0) +
                (userData.inflip_balance || 0)
            );

            if (totalBalance > 0) {
                throw new Error(`gagal: anggota masih memiliki saldo ${formatRupiah(totalBalance)}.`);
            }

            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            toast.success('akun dihapus!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerModal = (type: 'verify' | 'reject' | 'reset_pin' | 'delete', id: string, name: string, data?: any) => {
        if (type === 'verify') {
            setSelectedMember(data);
            setShowVerifyModal(true);
        } else {
            setConfirmModal({ isOpen: true, type, userId: id, userName: name || 'anggota', userData: data });
        }
    };

    const handleExportCSV = () => {
        if (filteredUsers.length === 0) return toast.error("tidak ada data");
        const rows = filteredUsers.map(u => `<tr><td>${u.member_id}</td><td>${u.full_name}</td><td>${u.tapro_balance}</td></tr>`).join('');
        const blob = new Blob([`<html><body><table border="1">${rows}</table></body></html>`], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `data_anggota_kkj.xls`;
        link.click();
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => { /* implementation */ };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white font-sans text-left lowercase">
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> kembali ke dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Manajemen Anggota</h1>
                        <p className="text-xs font-bold text-slate-500 tracking-widest">Verifikasi identitas ktp & kelola data anggota aktif.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeTab === 'active' && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 px-6 bg-blue-600 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 uppercase tracking-widest shadow-sm"><Upload size={16} /> IMPORT</button>
                                <button onClick={handleExportCSV} className="p-2.5 px-6 bg-emerald-600 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 uppercase tracking-widest shadow-sm"><Download size={16} /> EXPORT</button>
                            </>
                        )}
                        <button onClick={fetchUsers} className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"><RefreshCw size={20} className={cn("text-gray-400", loading && "animate-spin")} /></button>
                    </div>
                </div>
            </div>

            <div className="flex gap-8 mb-6 border-b border-gray-100">
                <button onClick={() => setActiveTab('pending')} className={cn("pb-4 px-2 font-semibold text-xs tracking-widest transition-all relative", activeTab === 'pending' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600")}>
                    VERIFIKASI BARU {users.length > 0 && activeTab === 'pending' && <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] tracking-normal font-normal">{users.length}</span>}
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#136f42] animate-in slide-in-from-left duration-300"></div>}
                </button>
                <button onClick={() => setActiveTab('active')} className={cn("pb-4 px-2 font-semibold text-xs tracking-widest transition-all relative", activeTab === 'active' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600")}>
                    DATA ANGGOTA AKTIF
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#136f42] animate-in slide-in-from-left duration-300"></div>}
                </button>
            </div>

            {activeTab === 'active' && (
                <div className="mb-6 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#136f42] transition-colors" size={18} />
                    <input type="text" placeholder="cari nama, niak, atau no hp..." className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 outline-none focus:border-[#136f42] focus:ring-2 focus:ring-green-50 bg-gray-50/50 transition-all font-normal text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/30 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-[10px] font-semibold text-gray-400 tracking-widest">Anggota</th>
                                <th className="p-4 text-[10px] font-semibold text-gray-400 tracking-widest">Kontak</th>
                                <th className="p-4 text-[10px] font-semibold text-gray-400 tracking-widest">Registrasi</th>
                                {activeTab === 'active' && <th className="p-4 text-[10px] font-semibold text-gray-400 tracking-widest">Saldo Tapro</th>}
                                <th className="p-4 text-[10px] font-semibold text-gray-400 tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" size={32} /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-normal text-sm italic">tidak ada data anggota ditemukan.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/20 transition-all group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center font-semibold text-[#136f42] uppercase text-xs">{u.full_name?.substring(0, 2)}</div>}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700 uppercase text-sm tracking-tight">{u.full_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono bg-gray-50 w-fit px-1.5 rounded uppercase mt-0.5">{u.member_id || 'menunggu niak'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-xs font-normal text-gray-600"><Phone size={12} className="text-[#136f42]" /> {u.phone}</div>
                                            <div className="text-[11px] text-gray-400 font-normal lowercase mt-0.5">{u.email || 'email kosong'}</div>
                                        </td>
                                        <td className="p-4 text-[11px] font-normal text-gray-500">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                                        {activeTab === 'active' && <td className="p-4 font-semibold text-gray-700 text-sm">{formatRupiah(u.tapro_balance || 0)}</td>}
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => triggerModal('reject', u.id, u.full_name)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-50 transition-all active:scale-95"><X size={18} /></button>
                                                        <button onClick={() => triggerModal('verify', u.id, u.full_name, u)} className="px-5 py-2 bg-[#136f42] text-white rounded-lg hover:bg-green-800 font-semibold text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95"><Check size={14} /> Review Verifikasi</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => triggerModal('reset_pin', u.id, u.full_name)} className="px-4 py-2 border border-amber-100 text-amber-600 hover:bg-amber-50 rounded-lg text-[10px] font-semibold flex items-center gap-2 tracking-widest transition-all"><KeyRound size={14} /> Reset Pin</button>
                                                        <button onClick={() => triggerModal('delete', u.id, u.full_name, u)} className="p-2 border border-rose-50 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-95"><Trash2 size={16} /></button>
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

            {/* MODAL DETAIL VERIFIKASI */}
            {showVerifyModal && selectedMember && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Review Pendaftaran</h3>
                                <p className="text-[10px] font-normal text-gray-400 mt-0.5 tracking-widest">Pastikan foto ktp & bukti transfer di wa sesuai</p>
                            </div>
                            <button onClick={() => setShowVerifyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90"><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-widest block text-left">Foto KTP Anggota</label>
                                <div className="aspect-video w-full bg-slate-50 rounded-xl overflow-hidden border border-gray-100 group relative">
                                    {selectedMember.ktp_url ? (
                                        <>
                                            <img
                                                src={`${supabase.storage.from('ktp-registrations').getPublicUrl(selectedMember.ktp_url).data.publicUrl}`}
                                                alt="KTP"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <a href={supabase.storage.from('ktp-registrations').getPublicUrl(selectedMember.ktp_url).data.publicUrl} target="_blank" rel="noreferrer" className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-semibold text-[10px] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                                                    <Maximize2 size={14} /> perbesar foto
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <AlertTriangle size={32} />
                                            <p className="font-medium uppercase text-[9px] tracking-widest">ktp belum diunggah</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-left">
                                    <p className="text-[9px] font-semibold text-gray-400 tracking-widest mb-1">Nama Pendaftar</p>
                                    <p className="text-base font-semibold text-gray-700 tracking-tight">{selectedMember.full_name}</p>
                                    <p className="text-xs font-normal text-[#136f42] mt-0.5">{selectedMember.phone}</p>
                                </div>
                                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 text-left">
                                    <p className="text-[9px] font-semibold text-green-600 tracking-widest mb-1">Status Keuangan</p>
                                    <p className="text-base font-semibold text-green-700 tracking-tight">Wajib Bayar</p>
                                    <p className="text-xs font-normal text-green-600 mt-0.5 italic">rp 250.000 (pas)</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-400 font-semibold text-[10px] tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95">Tunda</button>
                            <button
                                onClick={executeVerify}
                                disabled={isProcessing}
                                className="flex-[2] bg-[#136f42] text-white py-3 rounded-xl font-semibold text-[10px] tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> AKTIFKAN ANGGOTA</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI LAINNYA */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center border border-gray-100">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm",
                            confirmModal.type === 'reject' ? 'bg-rose-50 text-rose-500' :
                                confirmModal.type === 'reset_pin' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                        )}>
                            {confirmModal.type === 'reject' ? <X size={28} /> : confirmModal.type === 'reset_pin' ? <KeyRound size={28} /> : <Trash2 size={28} />}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 tracking-tight mb-2">
                            {confirmModal.type === 'reject' ? 'TOLAK ANGGOTA?' : confirmModal.type === 'reset_pin' ? 'RESET PIN?' : 'HAPUS AKUN?'}
                        </h3>
                        <p className="text-xs text-gray-400 font-normal uppercase tracking-wider mb-8 leading-relaxed">
                            konfirmasi tindakan untuk anggota <span className="text-gray-700 font-semibold">{confirmModal.userName}</span>. tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-3 bg-gray-50 text-gray-400 font-semibold rounded-lg text-[10px] tracking-widest active:scale-95 transition-all">Batal</button>
                            <button onClick={() => {
                                if (confirmModal.type === 'reject') executeReject();
                                else if (confirmModal.type === 'reset_pin') executeResetPin();
                                else if (confirmModal.type === 'delete') executeDeleteUser();
                            }} className={cn("py-3 text-white font-semibold rounded-lg text-[10px] tracking-widest active:scale-95 transition-all shadow-sm",
                                confirmModal.type === 'reset_pin' ? 'bg-amber-500' : 'bg-rose-600'
                            )}>LANJUTKAN</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};