import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Scale, 
    ExternalLink, Archive, Clock, CheckCircle, Calendar, Coins 
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminPegadaian = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab: 'pending' vs 'history' konsisten dengan TAMASA
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("pawn_transactions")
                .select(`*, profiles:user_id (full_name, member_id, tapro_balance)`)
                .order("created_at", { ascending: false });

            if (activeTab === 'pending') {
                query = query.eq("status", "pending");
            } else {
                query = query.neq("status", "pending");
            }

            const { data, error } = await query;
            if (error) throw error;
            setDataList(data || []);
        } catch (err: any) {
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: any) => {
        const input = window.prompt(`Masukkan Nilai Taksiran (Cair) untuk ${req.item_weight}gr emas ini (Rupiah):`, "0");
        if (!input) return;
        const loanAmount = parseInt(input.replace(/\D/g, ''));
        if (loanAmount <= 0) return toast.error("Nominal tidak valid!");

        const confirm = window.confirm(`Setujui dan cairkan dana ${formatRupiah(loanAmount)} ke saldo user?`);
        if (!confirm) return;

        const toastId = toast.loading("Memproses pencairan...");
        try {
            await supabase.from("pawn_transactions").update({ status: "approved", loan_amount: loanAmount }).eq("id", req.id);
            const currentBalance = req.profiles?.tapro_balance || 0;
            await supabase.from("profiles").update({ tapro_balance: currentBalance + loanAmount }).eq("id", req.user_id);
            
            await supabase.from("transactions").insert({
                user_id: req.user_id,
                type: "topup",
                amount: loanAmount,
                status: "success",
                description: `Pencairan Gadai: ${req.item_name}`
            });

            await supabase.from("notifications").insert({
                user_id: req.user_id,
                title: "Gadai Disetujui ✅",
                message: `Pengajuan gadai ${req.item_name} disetujui senilai ${formatRupiah(loanAmount)}. Dana masuk ke Tapro.`,
                type: "success"
            });

            toast.success("Berhasil dicairkan!", { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    const handleReject = async (req: any) => {
        const reason = window.prompt("Alasan penolakan:", "Foto kurang jelas / Kualitas barang tidak sesuai");
        if (!reason) return;
        const toastId = toast.loading("Memproses penolakan...");
        try {
            await supabase.from("pawn_transactions").update({ status: "rejected", admin_note: reason }).eq("id", req.id);
            await supabase.from("notifications").insert({
                user_id: req.user_id,
                title: "Gadai Ditolak ❌",
                message: `Pengajuan gadai ${req.item_name} ditolak. Alasan: ${reason}`,
                type: "error"
            });
            toast.success("Pengajuan ditolak", { id: toastId });
            fetchData();
        } catch (err) { toast.error("Gagal memproses penolakan", { id: toastId }); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* Header Konsisten */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Approval Gadai</h1>
                        <p className="text-sm text-gray-500">Verifikasi & Taksiran Gadai Emas Syariah Anggota</p>
                    </div>
                    <button 
                        onClick={fetchData} 
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-kkj-blue")} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation Konsisten */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={16} /> Permintaan Baru
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'history' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Archive size={16} /> Riwayat (Selesai)
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : dataList.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                            <Scale size={32} />
                        </div>
                        <p>Tidak ada data pengajuan gadai di antrean {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dataList.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-all duration-300">
                                
                                {/* Foto Barang - Gaya Konsisten */}
                                <div className="w-full lg:w-44 h-44 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative group border border-gray-100 shadow-inner">
                                    <img src={req.image_url} alt="Emas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={req.image_url} target="_blank" rel="noreferrer" className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100"><ExternalLink size={14} /> Perbesar</a>
                                    </div>
                                </div>

                                {/* Info Detail - Gaya TAMASA */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 text-kkj-blue rounded-full flex items-center justify-center shadow-sm">
                                                <Coins size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{req.item_name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                                    <span className="font-bold text-gray-700">{req.profiles?.full_name}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{req.profiles?.member_id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", 
                                                req.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            )}>
                                                {req.status}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                                                <Calendar size={10} /> {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Grid Spek Barang - Gaya TAMASA */}
                                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Berat</p>
                                            <p className="text-sm font-bold text-gray-900">{req.item_weight} gr</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Karat</p>
                                            <p className="text-sm font-bold text-gray-900">{req.item_karat} K</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Kondisi</p>
                                            <p className="text-sm font-bold text-gray-900 truncate px-1">{req.item_condition}</p>
                                        </div>
                                    </div>

                                    {/* Hasil Taksiran (Muncul di Riwayat) */}
                                    {req.loan_amount > 0 && (
                                        <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                                            <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">Taksiran Cair:</span>
                                            <span className="font-bold text-blue-900 text-lg">{formatRupiah(req.loan_amount)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Kolom Aksi Vertikal - Konsisten TAMASA */}
                                <div className="flex flex-col justify-center gap-3 lg:border-l lg:pl-6 border-gray-100 min-w-[200px]">
                                    {activeTab === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => handleApprove(req)} 
                                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                            >
                                                <Check size={18} /> Setujui
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req)} 
                                                className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <X size={18} /> Tolak
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                                            <CheckCircle size={24} className={cn(req.status === 'rejected' ? "text-red-400" : "text-green-500", "mb-2")} />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                                                Transaksi<br/>{req.status === 'rejected' ? 'Ditolak' : 'Selesai'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};