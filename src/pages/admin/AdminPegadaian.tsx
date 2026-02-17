import React, { useEffect, useState } from "react";
import API from "../../api/api"; // Menggunakan Axios
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Scale, 
    ExternalLink, Archive, Clock, CheckCircle, Calendar, Coins, CalendarDays, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminPegadaian = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // --- STATE UNTUK MODAL APPROVAL ---
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [taksiranCair, setTaksiranCair] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Panggil API Laravel: GET /admin/pawn/transactions
            // Backend bertugas melakukan JOIN dengan profiles dan filter status
            const response = await API.get('/admin/pawn/transactions', {
                params: { status: activeTab }
            });
            setDataList(response.data || []);
        } catch (err: any) {
            toast.error("Gagal memuat data gadai");
        } finally {
            setLoading(false);
        }
    };

    // 1. BUKA MODAL APPROVE
    const openApproveModal = (req: any) => {
        setSelectedReq(req);
        setTaksiranCair(0); // Reset nilai
        setIsApproveModalOpen(true);
    };

    // 2. HANDLE INPUT FORMAT RUPIAH
    const handleTaksiranChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); 
        setTaksiranCair(Number(rawValue));
    };

    // 3. SUBMIT APPROVAL
    const handleSubmitApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReq) return;
        if (taksiranCair <= 0) return toast.error("Nominal taksiran harus diisi!");

        const confirm = window.confirm(`Cairkan dana ${formatRupiah(taksiranCair)} ke saldo user?`);
        if (!confirm) return;

        setIsProcessing(true);
        const toastId = toast.loading("Memproses pencairan...");

        try {
            // Endpoint Laravel: POST /admin/pawn/transactions/{id}/approve
            // Backend menangani: Update status gadai, Update saldo Tapro user, Catat transaksi log, Kirim notifikasi
            await API.post(`/admin/pawn/transactions/${selectedReq.id}/approve`, {
                loan_amount: taksiranCair
            });

            toast.success("Berhasil dicairkan!", { id: toastId });
            setIsApproveModalOpen(false);
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error("Gagal: " + msg, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // 4. HANDLE REJECT
    const handleReject = async (req: any) => {
        const reason = window.prompt("Alasan penolakan:", "Foto kurang jelas / Kualitas barang tidak sesuai");
        if (!reason) return;
        const toastId = toast.loading("Memproses penolakan...");
        try {
            // Endpoint Laravel: POST /admin/pawn/transactions/{id}/reject
            await API.post(`/admin/pawn/transactions/${req.id}/reject`, {
                admin_note: reason
            });
            
            toast.success("Pengajuan ditolak", { id: toastId });
            fetchData();
        } catch (err: any) { 
            toast.error("Gagal memproses penolakan", { id: toastId }); 
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
                        <h1 className="text-2xl font-bold text-gray-900">Approval Gadai</h1>
                        <p className="text-sm text-gray-500">Verifikasi & Taksiran Gadai Emas Syariah Anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#003366]")} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-[#003366]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={16} /> Permintaan Baru
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366] rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'history' ? 'text-[#003366]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Archive size={16} /> Riwayat (Selesai)
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366] rounded-t-full"></div>}
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#003366] mb-2" size={32} />
                        <span className="text-gray-400 text-sm">Menghubungkan ke server...</span>
                    </div>
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
                                
                                <div className="w-full lg:w-44 h-44 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative group border border-gray-100 shadow-inner">
                                    <img src={req.image_url} alt="Emas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={req.image_url} target="_blank" rel="noreferrer" className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100"><ExternalLink size={14} /> Perbesar</a>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 text-[#003366] rounded-full flex items-center justify-center shadow-sm">
                                                <Coins size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{req.item_name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                                    <span className="font-bold text-gray-700">{req.user?.name}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{req.user?.member_id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", 
                                                req.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            )}>
                                                {req.status?.replace('_', ' ')}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1 font-bold">
                                                <Calendar size={10} /> {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Berat</p>
                                            <p className="text-sm font-black text-gray-900">{req.item_weight} gr</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Karat</p>
                                            <p className="text-sm font-black text-gray-900">{req.item_karat} K</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Tenor</p>
                                            <div className="flex items-center justify-center gap-1 text-sm font-black text-blue-700">
                                                <CalendarDays size={14} /> {req.tenor_bulan || 4} Bln
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Kondisi</p>
                                            <p className="text-sm font-black text-gray-900 truncate px-1" title={req.item_condition}>{req.item_condition}</p>
                                        </div>
                                    </div>

                                    {Number(req.loan_amount) > 0 && (
                                        <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                                            <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Dana Cair:</span>
                                            <span className="font-black text-blue-900 text-lg">{formatRupiah(req.loan_amount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-3 lg:border-l lg:pl-6 border-gray-100 min-w-[200px]">
                                    {req.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => openApproveModal(req)}
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
                                                Gadai<br/>{req.status === 'rejected' ? 'Ditolak' : 'Selesai'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL APPROVAL / TAKSIRAN */}
            {isApproveModalOpen && selectedReq && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Setujui Gadai</h2>
                            <button onClick={() => setIsApproveModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500"><X size={20}/></button>
                        </div>

                        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Barang Jaminan</p>
                                    <p className="text-sm text-blue-900 font-bold uppercase">
                                        {selectedReq.item_name} ({selectedReq.item_weight}gr - {selectedReq.item_karat}K)
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Tenor</p>
                                    <p className="text-sm text-blue-900 font-black uppercase">{selectedReq.tenor_bulan || 4} Bulan</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitApprove}>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">
                                    Masukkan Nilai Taksiran (Cair)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="0" 
                                        value={taksiranCair ? taksiranCair.toLocaleString('id-ID') : ''}
                                        onChange={handleTaksiranChange}
                                        className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 font-bold text-lg text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#003366] transition-all"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
                                    *Dana akan langsung dikirim ke Saldo Tapro anggota.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    type="submit" 
                                    disabled={isProcessing}
                                    className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                                >
                                    <CheckCircle size={18} /> {isProcessing ? 'Memproses...' : 'CAIRKAN DANA'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsApproveModalOpen(false)}
                                    className="px-6 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};