import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Wallet, 
    User, Calendar, Clock, AlertCircle, CheckCircle, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminSimpanan = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // 🔥 STATE UNTUK CUSTOM MODAL CONFIRMATION
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        req: any;
    }>({
        isOpen: false,
        type: 'approve',
        req: null
    });

    const [rejectReason, setRejectReason] = useState('');

    const columnMapping: any = {
        'simwa': 'simwa_balance',
        'simpok': 'simpok_balance',
        'simade': 'simade_balance',
        'sipena': 'sipena_balance',
        'sihara': 'sihara_balance',
        'siqurma': 'siqurma_balance',
        'siuji': 'siuji_balance',
        'siwalima': 'siwalima_balance',
        'tapro': 'tapro_balance'
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("savings_withdrawals")
                .select(`
                    *, 
                    profiles:user_id (
                        full_name, 
                        member_id, 
                        simwa_balance, 
                        simpok_balance, 
                        simade_balance, 
                        sipena_balance, 
                        sihara_balance, 
                        siqurma_balance, 
                        siuji_balance, 
                        siwalima_balance,
                        tapro_balance
                    )
                `)
                .order("created_at", { ascending: false });

            if (activeTab === 'pending') {
                query = query.eq("status", "pending");
            } else {
                query = query.neq("status", "pending");
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            toast.error("Gagal memuat data request");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 LOGIKA EKSEKUSI (DARI MODAL)
    const handleConfirmAction = async () => {
        const { req, type } = confirmModal;
        if (!req) return;

        const toastId = toast.loading(type === 'approve' ? "Memproses approval..." : "Membatalkan...");
        const targetColumn = columnMapping[req.type];

        try {
            if (type === 'approve') {
                // 1. Ambil Saldo Real-time
                const { data: profile } = await supabase.from('profiles').select(targetColumn).eq('id', req.user_id).single();
                const currentBalance = profile ? profile[targetColumn] : 0;

                if (currentBalance < req.amount) throw new Error("Saldo anggota tidak mencukupi.");

                // 2. Kurangi Saldo & Update Status
                const { error: updateProfileError } = await supabase
                    .from('profiles')
                    .update({ [targetColumn]: currentBalance - req.amount })
                    .eq('id', req.user_id);
                
                if (updateProfileError) throw updateProfileError;

                await supabase.from('savings_withdrawals').update({ status: 'approved' }).eq('id', req.id);

                // 3. Catat Riwayat Transaksi Utama
                await supabase.from('transactions').insert({
                    user_id: req.user_id,
                    type: 'withdraw',
                    amount: req.amount,
                    status: 'success',
                    description: `Penarikan: ${req.type.toUpperCase()}`
                });

                toast.success("Penarikan Berhasil Disetujui!", { id: toastId });
            } else {
                if (!rejectReason.trim()) throw new Error("Alasan penolakan wajib diisi");
                
                // 🔥 Gunakan status 'rejected' sesuai skema tabel withdrawals
                await supabase.from('savings_withdrawals')
                    .update({ status: 'rejected', admin_note: rejectReason })
                    .eq('id', req.id);
                
                toast.success("Permintaan Telah Ditolak", { id: toastId });
            }
            
            fetchData();
            setConfirmModal({ isOpen: false, type: 'approve', req: null });
            setRejectReason('');
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approval Penarikan</h1>
                        <p className="text-sm text-gray-500">Verifikasi penarikan Simpanan Anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {(['pending', 'history'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-4 font-bold text-sm relative transition-colors ${activeTab === tab ? 'text-[#136f42]' : 'text-gray-400'}`}>
                        {tab === 'pending' ? 'Menunggu Persetujuan' : 'Riwayat Proses'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-[#136f42]" /></div>
                ) : requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400 py-20">
                        <AlertCircle size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="italic font-medium">Tidak ada data permintaan penarikan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 items-center hover:shadow-md transition-shadow">
                                <div className="flex-1 space-y-3 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="bg-green-50 text-[#136f42] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                            {req.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {format(new Date(req.created_at), 'dd MMM yyyy HH:mm', { locale: indonesia })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100"><User size={24}/></div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 tracking-tight">{req.profiles?.full_name}</h3>
                                            <p className="text-xs text-gray-400 font-mono uppercase">{req.profiles?.member_id}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-2xl flex justify-between border border-gray-100/50">
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Nominal Tarik</p>
                                            <p className="text-xl font-black text-[#136f42] tracking-tight">{formatRupiah(req.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Saldo Saat Ini</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                {formatRupiah(req.profiles?.[columnMapping[req.type]] || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    {req.bank_name && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 text-blue-700 rounded-xl border border-blue-100 text-[11px] font-medium">
                                            <Wallet size={14} /> Transfer ke: {req.bank_name} - {req.account_number}
                                        </div>
                                    )}
                                </div>
                                
                                {activeTab === 'pending' ? (
                                    <div className="flex lg:flex-col gap-2 w-full lg:w-fit">
                                        <button onClick={() => setConfirmModal({ isOpen: true, type: 'approve', req })} className="flex-1 lg:w-32 bg-[#136f42] text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-900/10 active:scale-95 transition-all">Setujui</button>
                                        <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', req })} className="flex-1 lg:w-32 bg-white text-rose-600 border border-rose-100 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Tolak</button>
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                        req.status === 'approved' ? "bg-green-50 text-green-700 border-green-100" : "bg-rose-50 text-rose-700 border-rose-100"
                                    )}>
                                        {req.status === 'approved' ? 'Berhasil' : 'Ditolak'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🔥 CUSTOM POPUP MODAL CONFIRMATION 🔥 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                            {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'approve' ? 'Konfirmasi persetujuan' : 'Konfirmasi penolakan'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                            Apakah anda yakin ingin {confirmModal.type === 'approve' ? 'menyetujui' : 'menolak'} penarikan <b>{confirmModal.req.type.toUpperCase()}</b> sebesar <b>{formatRupiah(confirmModal.req.amount)}</b> untuk <b>{confirmModal.req.profiles?.full_name}</b>?
                        </p>

                        {confirmModal.type === 'reject' && (
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-6 outline-none focus:border-rose-500 transition-all h-20 resize-none font-medium"
                                placeholder="Tuliskan alasan penolakan (misal: Data rekening salah)..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                autoFocus
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => {
                                setConfirmModal({ isOpen: false, type: 'approve', req: null });
                                setRejectReason('');
                            }} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button onClick={handleConfirmAction} className={`py-3 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform ${confirmModal.type === 'approve' ? 'bg-[#136f42] shadow-green-900/20' : 'bg-rose-600 shadow-red-900/20'}`}>
                                Ya, {confirmModal.type === 'approve' ? 'Setujui' : 'Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};