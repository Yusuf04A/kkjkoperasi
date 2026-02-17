import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api'; // Axios
import { ArrowLeft, Calendar, CheckCircle, Wallet, Clock, AlertTriangle, User, History, X } from 'lucide-react';
import { formatRupiah, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

export const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();

    const [loan, setLoan] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // State untuk Modal Request
    const [showModal, setShowModal] = useState(false);
    const [newTenor, setNewTenor] = useState('');
    const [reason, setReason] = useState('');

    // FETCH DATA
    const fetchData = async () => {
        setLoading(true);
        try {
            // Endpoint Laravel: GET /financing/loan/{id}
            const res = await API.get(`/financing/loan/${id}`);
            setLoan(res.data.loan);
            setInstallments(res.data.installments);
        } catch (err) {
            toast.error("Gagal memuat data pinjaman");
            navigate('/pembiayaan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // LOGIC BAYAR
    const handlePay = async (instId: string, amount: number) => {
        const confirm = window.confirm(`Bayar tagihan sebesar ${formatRupiah(amount)}?\nSaldo Tapro akan terpotong.`);
        if (!confirm) return;
        const toastId = toast.loading('Memproses pembayaran...');
        try {
            // Endpoint Laravel: POST /financing/pay-installment
            await API.post('/financing/pay-installment', { installment_id: instId });
            
            toast.success('Pembayaran Berhasil!', { id: toastId });
            fetchData();
            checkSession();
        } catch (err: any) {
            toast.error(`Gagal: ${err.response?.data?.message || err.message}`, { id: toastId });
        }
    };

    // LOGIC KIRIM REQUEST (DARI MODAL)
    const submitRestructure = async (e: React.FormEvent) => {
        e.preventDefault();

        const tenorInt = parseInt(newTenor);
        if (!tenorInt || tenorInt <= loan.duration) {
            toast.error("Tenor baru harus lebih besar dari tenor saat ini.");
            return;
        }
        if (!reason.trim()) {
            toast.error("Alasan wajib diisi.");
            return;
        }

        const toastId = toast.loading("Mengirim pengajuan...");
        try {
            // Endpoint Laravel: POST /financing/restructure
            await API.post('/financing/restructure', {
                loan_id: loan.id,
                new_duration: tenorInt,
                reason: reason
            });
            toast.success("Pengajuan dikirim ke Admin", { id: toastId });
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            toast.error("Gagal mengirim request", { id: toastId });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#136f42] border-t-transparent"></div>
        </div>
    );
    
    if (!loan) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Data tidak ditemukan</div>;

    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative font-sans">

            {/* HEADER (HIJAU KONSISTEN) */}
            <div className="bg-white border-b border-green-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/pembiayaan')} className="p-2 hover:bg-green-50 rounded-full transition-colors text-[#136f42]">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-gray-900 leading-tight tracking-tight">Detail Pinjaman</h1>
                        <p className="text-[10px] font-bold text-[#136f42] uppercase tracking-wider">{loan.type}</p>
                    </div>
                </div>
                <img
                    src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=136f42&color=fff`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-green-50 shadow-sm"
                />
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* CARD INFO UTAMA (HIJAU PREMIUM) */}
                <div className="bg-[#136f42] p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
                    <div className="absolute right-0 top-0 w-32 h-32 bg-[#aeea00]/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-green-100/70 uppercase tracking-[0.2em] mb-1">Total Pinjaman</p>
                                <h2 className="text-3xl font-black tracking-tighter">{formatRupiah(loan.amount)}</h2>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border",
                                loan.status === 'active' ? "bg-[#aeea00] text-[#0f5c35] border-transparent" : "bg-white/10 border-white/20 text-white"
                            )}>
                                {loan.status === 'active' ? 'Berjalan' : loan.status}
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-green-100/80">
                                <span>Progress Pelunasan</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2 shadow-inner">
                                <div 
                                    className="bg-[#aeea00] h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(174,234,0,0.5)]" 
                                    style={{ width: `${progress}%` }} 
                                />
                            </div>
                            <p className="text-[10px] text-right text-green-100/50 font-medium italic">
                                {paidCount} dari {installments.length} angsuran telah terbayar
                            </p>
                        </div>
                    </div>
                </div>

                {/* ALERT STATUS RESTRUKTURISASI */}
                {loan.restructure_status === 'pending' && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 items-center shadow-sm">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 animate-pulse">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-900 uppercase tracking-tighter">Pengajuan Ditinjau</p>
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                Permintaan perpanjangan tenor menjadi <b>{loan.restructure_req_duration} bulan</b> sedang diproses Admin.
                            </p>
                        </div>
                    </div>
                )}

                {/* TOMBOL AJUKAN PERPANJANGAN */}
                {loan.status === 'active' && loan.restructure_status !== 'pending' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between hover:bg-green-50 transition-all group active:scale-95"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-[#136f42] rounded-xl group-hover:bg-white transition-colors">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-gray-900 text-sm tracking-tight">Merasa berat membayar?</h4>
                                <p className="text-xs text-gray-500 font-medium">Klik untuk ajukan perpanjangan tenor</p>
                            </div>
                        </div>
                        <div className="bg-[#136f42] text-white p-2 rounded-lg group-hover:bg-[#0f5c35]">
                            <ArrowLeft size={16} className="rotate-180" />
                        </div>
                    </button>
                )}

                {/* LIST CICILAN */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <History size={18} className="text-[#136f42]" />
                        <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">Jadwal Pembayaran</h3>
                    </div>

                    <div className="space-y-3">
                        {installments.map((item, index) => {
                            const isPaid = item.status === 'paid';
                            const dueDate = new Date(item.due_date);
                            const isOverdue = !isPaid && dueDate < new Date();

                            return (
                                <div key={item.id} className={cn(
                                    "p-4 rounded-2xl border flex justify-between items-center transition-all",
                                    isPaid 
                                    ? "bg-white border-green-100 opacity-80" 
                                    : "bg-white border-gray-100 hover:border-[#136f42] shadow-sm"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs",
                                            isPaid ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 tracking-tight">{formatRupiah(item.amount)}</p>
                                            <p className={cn(
                                                "text-[10px] mt-0.5 flex items-center gap-1 font-bold uppercase tracking-wider",
                                                isOverdue ? "text-rose-600" : "text-gray-400"
                                            )}>
                                                <Calendar size={12} /> {format(dueDate, 'dd MMM yyyy', { locale: indonesia })}
                                                {isOverdue && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[8px] ml-1">Terlambat</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {isPaid ? (
                                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                                            <CheckCircle className="text-green-500" size={16} strokeWidth={3} />
                                            <span className="text-[10px] text-green-700 font-black tracking-widest">LUNAS</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePay(item.id, item.amount)}
                                            className="bg-[#136f42] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-900/10 hover:bg-[#0f5c35] active:scale-90 transition-all flex items-center gap-2"
                                        >
                                            <Wallet size={14} /> Bayar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL FORM PERPANJANGAN */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-[#0f5c35]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Ajukan Perpanjangan</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={submitRestructure} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tenor Baru (Total Bulan)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-bold bg-gray-50 transition-all"
                                    placeholder={`Min: ${loan.duration + 1} Bulan`}
                                    value={newTenor}
                                    onChange={(e) => setNewTenor(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-2 ml-1 italic leading-relaxed">
                                    * Tenor berjalan saat ini: {loan.duration} bulan.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Alasan Perpanjangan</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-medium bg-gray-50 transition-all h-28 resize-none"
                                    placeholder="Jelaskan kendala Anda secara singkat..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full bg-[#136f42] text-white font-black py-4 rounded-2xl shadow-xl shadow-green-900/20 hover:bg-[#0f5c35] active:scale-95 transition-all uppercase tracking-widest text-sm">
                                Kirim Pengajuan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};