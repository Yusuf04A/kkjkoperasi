import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Scale, 
    ExternalLink, Archive, Clock, CheckCircle, Calendar, Coins, Save, CalendarDays, AlertTriangle, Info
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminPegadaian = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // --- State untuk Custom Modal ---
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false); 
    const [isConfirmCairModal, setIsConfirmCairModal] = useState(false); 
    
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [taksiranCair, setTaksiranCair] = useState<number>(0);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

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

    const openApproveModal = (req: any) => {
        setSelectedReq(req);
        setTaksiranCair(0);
        setIsApproveModalOpen(true);
    };

    const handleTaksiranChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setTaksiranCair(Number(rawValue));
    };

    // --- Logika Eksekusi Pencairan ---
    const executeApproval = async () => {
        if (!selectedReq || taksiranCair <= 0) return;

        setIsProcessing(true);
        const toastId = toast.loading("Memproses pencairan...");

        try {
            await supabase.from("pawn_transactions")
                .update({ status: "approved", loan_amount: taksiranCair })
                .eq("id", selectedReq.id);

            const currentBalance = selectedReq.profiles?.tapro_balance || 0;
            await supabase.from("profiles")
                .update({ tapro_balance: currentBalance + taksiranCair })
                .eq("id", selectedReq.user_id);
            
            await supabase.from("transactions").insert({
                user_id: selectedReq.user_id,
                type: "topup",
                amount: taksiranCair,
                status: "success",
                description: `Pencairan gadai: ${selectedReq.item_name}`
            });

            await supabase.from("notifications").insert({
                user_id: selectedReq.user_id,
                title: "Gadai disetujui ✅",
                message: `Pengajuan gadai ${selectedReq.item_name} disetujui senilai ${formatRupiah(taksiranCair)}. Dana masuk ke Tapro.`,
                type: "success"
            });

            toast.success("Berhasil dicairkan!", { id: toastId });
            setIsConfirmCairModal(false);
            setIsApproveModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Logika Eksekusi Penolakan ---
    const executeReject = async () => {
        if (!selectedReq || !rejectReason.trim()) {
            return toast.error("Alasan penolakan wajib diisi");
        }

        setIsProcessing(true);
        const toastId = toast.loading("Memproses penolakan...");
        try {
            await supabase.from("pawn_transactions")
                .update({ status: "rejected", admin_note: rejectReason })
                .eq("id", selectedReq.id);

            await supabase.from("notifications").insert({
                user_id: selectedReq.user_id,
                title: "Gadai ditolak ❌",
                message: `Pengajuan gadai ${selectedReq.item_name} ditolak. Alasan: ${rejectReason}`,
                type: "error"
            });
            
            toast.success("Pengajuan ditolak", { id: toastId });
            setIsRejectModalOpen(false);
            setRejectReason("");
            fetchData();
        } catch (err) { 
            toast.error("Gagal memproses penolakan", { id: toastId }); 
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] mb-4 w-fit transition-all text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none mb-1">Approval Gadai</h1>
                        <p className="text-sm text-gray-500">Verifikasi & taksiran gadai emas syariah anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {(['pending', 'history'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={cn("pb-3 px-6 font-bold text-sm relative transition-colors whitespace-nowrap flex items-center gap-2", activeTab === tab ? "text-[#136f42]" : "text-gray-400")}>
                        {tab === 'pending' ? <Clock size={16} /> : <Archive size={16} />}
                        {tab === 'pending' ? 'Permintaan Baru' : 'Riwayat Selesai'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-[#136f42]" /></div>
                ) : dataList.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400">
                        <Scale size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="italic font-medium">Tidak ada data pengajuan gadai di antrean {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dataList.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                                <div className="w-full lg:w-44 h-44 bg-gray-100 rounded-[1.5rem] overflow-hidden shrink-0 relative border border-slate-100 shadow-inner group">
                                    <img src={req.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={req.item_name} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={req.image_url} target="_blank" rel="noreferrer" className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ExternalLink size={14} /> Perbesar</a>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-50 text-[#136f42] rounded-2xl flex items-center justify-center border border-green-100"><Coins size={24} /></div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{req.item_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.profiles?.full_name} • {req.profiles?.member_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", 
                                                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                req.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                                            )}>{req.status}</span>
                                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                        <div><p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Berat</p><p className="text-xs font-bold text-slate-800">{req.item_weight} gr</p></div>
                                        <div><p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Karat</p><p className="text-xs font-bold text-slate-800">{req.item_karat} K</p></div>
                                        <div><p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Tenor</p><p className="text-xs font-bold text-blue-700 uppercase">{req.tenor_bulan || 4} bln</p></div>
                                        <div className="truncate px-1"><p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Kondisi</p><p className="text-xs font-bold text-slate-800 truncate">{req.item_condition}</p></div>
                                    </div>
                                    {req.loan_amount > 0 && <div className="flex items-center justify-between bg-blue-50/50 px-4 py-3 rounded-xl border border-blue-100"><span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Taksiran dana cair:</span><span className="font-bold text-blue-900 text-lg tracking-tight">{formatRupiah(req.loan_amount)}</span></div>}
                                </div>

                                {activeTab === 'pending' && (
                                    <div className="flex flex-col justify-center gap-2 min-w-[180px]">
                                        <button onClick={() => openApproveModal(req)} className="w-full py-4 bg-[#136f42] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Setujui</button>
                                        <button onClick={() => { setSelectedReq(req); setIsRejectModalOpen(true); }} className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">Tolak</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Modal 1: Input Taksiran Approval --- */}
            {isApproveModalOpen && selectedReq && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Setujui Gadai</h2>
                            <button onClick={() => setIsApproveModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-slate-100 text-slate-400"><X size={20}/></button>
                        </div>
                        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Barang jaminan</p>
                            <p className="text-sm font-bold text-slate-800 leading-tight uppercase">{selectedReq.item_name} ({selectedReq.item_weight}gr - {selectedReq.item_karat}K)</p>
                        </div>
                        <div className="mb-8">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">Nominal taksiran (cair)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                <input type="text" required placeholder="0" value={taksiranCair ? taksiranCair.toLocaleString('id-ID') : ''} onChange={handleTaksiranChange} className="w-full border-slate-200 bg-slate-50 rounded-2xl pl-12 pr-4 py-4 font-bold text-xl text-slate-900 outline-none focus:bg-white focus:border-[#136f42] transition-all" autoFocus />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => taksiranCair > 0 && setIsConfirmCairModal(true)} className="flex-1 bg-[#136f42] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">Lanjut</button>
                            <button onClick={() => setIsApproveModalOpen(false)} className="px-6 border border-slate-100 rounded-2xl font-bold text-slate-400 text-[10px] uppercase tracking-widest">Batal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal 2: Konfirmasi Pencairan Akhir --- */}
            {isConfirmCairModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Info size={32} /></div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight mb-2">Konfirmasi Cair</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Cairkan dana <b>{formatRupiah(taksiranCair)}</b> ke saldo Tapro <b>{selectedReq.profiles?.full_name}</b>?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsConfirmCairModal(false)} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Batal</button>
                            <button onClick={executeApproval} disabled={isProcessing} className="py-3 bg-[#136f42] text-white font-bold rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Cairkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal 3: Penolakan (Reject) --- */}
            {isRejectModalOpen && selectedReq && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Tolak Pengajuan</h2>
                        <p className="text-xs text-slate-400 font-medium mb-6">Berikan alasan mengapa pengajuan gadai ini ditolak.</p>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Contoh: Foto barang tidak jelas / emas tidak murni..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium outline-none focus:bg-white focus:border-rose-500 transition-all h-28 resize-none mb-6" />
                        <div className="flex gap-3">
                            <button onClick={executeReject} disabled={isProcessing} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Ya, Tolak</button>
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-6 border border-slate-100 rounded-2xl font-bold text-slate-400 text-[10px] uppercase tracking-widest">Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};