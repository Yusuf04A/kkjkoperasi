import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../lib/utils";
import { ArrowLeft, Check, X, RefreshCw, Scale, ExternalLink, Archive, LayoutList } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminPegadaian = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab: 'pending' vs 'history'
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
                query = query.neq("status", "pending"); // All processed items
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

        const confirm = window.confirm(`Cairkan dana ${formatRupiah(loanAmount)} ke saldo user?`);
        if (!confirm) return;

        const toastId = toast.loading("Memproses pencairan...");
        try {
            // 1. Update Transaksi
            await supabase.from("pawn_transactions").update({ status: "approved", loan_amount: loanAmount }).eq("id", req.id);
            // 2. Update Saldo
            const currentBalance = req.profiles?.tapro_balance || 0;
            await supabase.from("profiles").update({ tapro_balance: currentBalance + loanAmount }).eq("id", req.user_id);
            // 3. Catat History
            await supabase.from("transactions").insert({
                user_id: req.user_id,
                type: "topup",
                amount: loanAmount,
                status: "success",
                description: `Pencairan Gadai: ${req.item_name}`
            });
            // 4. Notifikasi
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
        const reason = window.prompt("Alasan penolakan:", "Foto buram / Barang tidak sesuai");
        if (!reason) return;
        try {
            await supabase.from("pawn_transactions").update({ status: "rejected", admin_note: reason }).eq("id", req.id);

            await supabase.from("notifications").insert({
                user_id: req.user_id,
                title: "Gadai Ditolak ❌",
                message: `Pengajuan gadai ${req.item_name} ditolak. Alasan: ${reason}`,
                type: "error"
            });

            toast.success("Ditolak");
            fetchData();
        } catch (err) { toast.error("Error"); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-3 w-full">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Approval Gadai</h1>
                            <p className="text-sm text-gray-500">Manajemen Gadai Emas Syariah</p>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto shrink-0">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutList size={16} /> Permintaan Baru
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Archive size={16} /> Riwayat
                        </button>
                    </div>
                </div>

                {/* LIST */}
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Memuat data...</div>
                ) : dataList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                        <Scale size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Tidak ada data</h3>
                        <p className="text-gray-500">List {activeTab === 'pending' ? 'pending' : 'riwayat'} kosong.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dataList.map((req) => (
                            <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 transition-all hover:border-blue-300">

                                {/* Foto */}
                                <div className="w-full md:w-48 h-48 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative group border border-gray-100">
                                    <img src={req.image_url} alt="Emas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={req.image_url} target="_blank" rel="noreferrer" className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100"><ExternalLink size={14} /> Perbesar</a>
                                    </div>
                                </div>

                                {/* Detail */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{req.item_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-700">{req.profiles?.full_name}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-xs">{format(new Date(req.created_at), "dd MMM yyyy, HH:mm", { locale: indonesia })}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                    req.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Berat</p><p className="font-bold text-gray-900">{req.item_weight} gr</p></div>
                                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Karat</p><p className="font-bold text-gray-900">{req.item_karat} K</p></div>
                                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Kondisi</p><p className="font-bold text-gray-900 truncate px-1">{req.item_condition}</p></div>
                                    </div>

                                    {/* Nilai Cair (Jika Approved) */}
                                    {req.loan_amount > 0 && (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-900">
                                            <span>Taksiran Cair:</span>
                                            <span className="font-bold text-lg">{formatRupiah(req.loan_amount)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {activeTab === 'pending' && (
                                    <div className="flex flex-col justify-center gap-3 min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0">
                                        <button onClick={() => handleApprove(req)} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-900/10 flex items-center justify-center gap-2 transform active:scale-95 transition-all"><Check size={16} /> Setujui</button>
                                        <button onClick={() => handleReject(req)} className="w-full bg-white border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2 transform active:scale-95 transition-all"><X size={16} /> Tolak</button>
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