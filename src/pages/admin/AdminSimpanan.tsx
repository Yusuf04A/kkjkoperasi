import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Wallet, 
    User, Calendar, Clock, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminSimpanan = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // MAPPING NAMA KOLOM DATABASE (SESUAI GAMBAR ANDA)
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
            // Kita ambil semua kolom balance agar tidak error saat pemanggilan dinamis
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
            console.error("Fetch Error:", err);
            toast.error("Gagal memuat data request");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: any) => {
        // Cari nama kolom di database berdasarkan type request (misal: 'simpok')
        const targetColumn = columnMapping[req.type];
        
        if (!targetColumn) {
            return toast.error("Jenis simpanan tidak dikenali sistem");
        }

        const confirm = window.confirm(`Setujui penarikan ${req.type.toUpperCase()} sebesar ${formatRupiah(req.amount)}?`);
        if (!confirm) return;

        const toastId = toast.loading("Memproses approval...");

        try {
            // 1. Ambil Saldo Real-time
            const { data: profile } = await supabase.from('profiles').select(targetColumn).eq('id', req.user_id).single();
            const currentBalance = profile ? profile[targetColumn] : 0;

            if (currentBalance < req.amount) {
                throw new Error("Saldo anggota tidak mencukupi.");
            }

            // 2. Kurangi Saldo di Profile
            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ [targetColumn]: currentBalance - req.amount })
                .eq('id', req.user_id);
            
            if (updateProfileError) throw updateProfileError;

            // 3. Update Status Request
            await supabase.from('savings_withdrawals').update({ status: 'approved' }).eq('id', req.id);

            // 4. Catat Transaksi
            await supabase.from('transactions').insert({
                user_id: req.user_id,
                type: 'withdraw',
                amount: req.amount,
                status: 'success',
                description: `Penarikan: ${req.type.toUpperCase()}`
            });

            toast.success("Penarikan disetujui!", { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    const handleReject = async (req: any) => {
        const reason = window.prompt("Alasan penolakan:", "Data rekening tidak valid");
        if (!reason) return;

        const toastId = toast.loading("Membatalkan request...");
        try {
            await supabase.from('savings_withdrawals').update({ status: 'rejected', admin_note: reason }).eq('id', req.id);
            toast.success("Request ditolak", { id: toastId });
            fetchData();
        } catch (err) {
            toast.error("Gagal menolak request", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* ... Header & Tabs Tetap Sama ... */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#003366] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Approval Penarikan</h1>
                        <p className="text-sm text-gray-500">Verifikasi penarikan Simpanan Anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#003366]")} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('pending')} className={`pb-3 px-4 font-bold text-sm relative ${activeTab === 'pending' ? 'text-[#003366]' : 'text-gray-400'}`}>
                    Menunggu Persetujuan
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366]"></div>}
                </button>
                <button onClick={() => setActiveTab('history')} className={`pb-3 px-4 font-bold text-sm relative ${activeTab === 'history' ? 'text-[#003366]' : 'text-gray-400'}`}>
                    Riwayat Proses
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366]"></div>}
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-[#003366]" /></div>
                ) : requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                        <p>Tidak ada data permintaan penarikan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-6 items-center">
                                <div className="flex-1 space-y-2 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="bg-blue-50 text-[#003366] px-2.5 py-1 rounded text-[10px] font-bold uppercase">
                                            {req.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {format(new Date(req.created_at), 'dd MMM yyyy HH:mm', { locale: indonesia })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><User size={20}/></div>
                                        <div>
                                            <h3 className="font-bold">{req.profiles?.full_name}</h3>
                                            <p className="text-xs text-gray-400">{req.profiles?.member_id}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Tarik</p>
                                            <p className="text-lg font-bold text-[#003366]">{formatRupiah(req.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Saldo Saat Ini</p>
                                            <p className="text-sm font-bold">
                                                {formatRupiah(req.profiles?.[columnMapping[req.type]] || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    {req.bank_name && <p className="text-xs text-gray-500 italic">Transfer ke: {req.bank_name} - {req.account_number}</p>}
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="flex lg:flex-col gap-2">
                                        <button onClick={() => handleApprove(req)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Setujui</button>
                                        <button onClick={() => handleReject(req)} className="bg-white text-red-600 border border-red-100 px-6 py-2 rounded-lg font-bold text-sm">Tolak</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};