import React, { useEffect, useState } from "react";
import API from "../../api/api"; // Menggunakan Axios
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Wallet, 
    User, Calendar, Clock, AlertCircle, Loader2 
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminSimpanan = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // MAPPING NAMA KOLOM DATABASE (Backend Laravel biasanya menggunakan snake_case)
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
            // Panggil API Laravel: GET /admin/savings/withdrawals
            // Mengirim parameter status untuk filter di backend
            const response = await API.get('/admin/savings/withdrawals', {
                params: { status: activeTab }
            });
            setRequests(response.data || []);
        } catch (err: any) {
            console.error("Fetch Error:", err);
            toast.error("Gagal memuat data request penarikan");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: any) => {
        const confirm = window.confirm(`Setujui penarikan ${req.type.toUpperCase()} sebesar ${formatRupiah(req.amount)}?`);
        if (!confirm) return;

        const toastId = toast.loading("Memproses approval...");

        try {
            // Endpoint Laravel: POST /admin/savings/withdrawals/{id}/approve
            // Backend menangani: Validasi saldo cukup, potong saldo user, update status, dan catat transaksi
            await API.post(`/admin/savings/withdrawals/${req.id}/approve`);

            toast.success("Penarikan disetujui!", { id: toastId });
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error("Gagal: " + msg, { id: toastId });
        }
    };

    const handleReject = async (req: any) => {
        const reason = window.prompt("Alasan penolakan:", "Data rekening tidak valid");
        if (!reason) return;

        const toastId = toast.loading("Membatalkan request...");
        try {
            // Endpoint Laravel: POST /admin/savings/withdrawals/{id}/reject
            await API.post(`/admin/savings/withdrawals/${req.id}/reject`, { reason });
            
            toast.success("Request ditolak", { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error("Gagal menolak request", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* Header */}
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

            {/* Tabs */}
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
                    <div className="p-12 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#003366] mb-2" size={32} />
                        <span className="text-gray-400 text-sm">Menghubungkan ke server...</span>
                    </div>
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
                                        <span className="bg-blue-50 text-[#003366] px-2.5 py-1 rounded text-[10px] font-black uppercase border border-blue-100">
                                            {req.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {format(new Date(req.created_at), 'dd MMM yyyy HH:mm', { locale: indonesia })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[#003366]"><User size={20}/></div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{req.user?.name}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.user?.member_id}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between border border-gray-100">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Jumlah Tarik</p>
                                            <p className="text-lg font-black text-[#003366]">{formatRupiah(req.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Saldo Simpanan</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {formatRupiah(req.user?.[columnMapping[req.type]] || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    {req.bank_name && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded">
                                            <Wallet size={12} /> Transfer ke: {req.bank_name} - {req.account_number}
                                        </div>
                                    )}
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                                        <button onClick={() => handleApprove(req)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95">Setujui</button>
                                        <button onClick={() => handleReject(req)} className="flex-1 bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all">Tolak</button>
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