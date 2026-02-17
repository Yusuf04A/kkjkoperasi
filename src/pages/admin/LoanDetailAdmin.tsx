import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import {
    ArrowLeft, Calendar, CheckCircle, AlertTriangle,
    MessageSquare, Smartphone, DollarSign, Clock, Check, X
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const AdminLoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // === 1. FETCH DATA DARI LARAVEL ===
    const fetchData = async () => {
        setLoading(true);
        try {
            // Endpoint Laravel: GET /admin/financing/loan/{id}
            const response = await API.get(`/admin/financing/loan/${id}`);
            setLoan(response.data.loan);
            setInstallments(response.data.installments || []);
        } catch (error: any) {
            console.error("Error:", error);
            toast.error("Gagal memuat data pinjaman");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // === 2. LOGIC RESTRUKTURISASI ===
    const handleApproveRestructure = async () => {
        const confirm = window.confirm(`Setujui perpanjangan menjadi ${loan.restructure_req_duration} bulan?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses...');
        try {
            // Endpoint Laravel: POST /admin/financing/restructure/approve
            await API.post(`/admin/financing/restructure/approve`, { loan_id: loan.id });
            
            toast.success('Berhasil diperpanjang!', { id: toastId });
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error('Gagal: ' + msg, { id: toastId });
        }
    };

    const handleRejectRestructure = async () => {
        if (!window.confirm("Tolak pengajuan?")) return;
        const toastId = toast.loading('Menolak...');
        try {
            // Endpoint Laravel: POST /admin/financing/restructure/reject
            await API.post(`/admin/financing/restructure/reject`, { loan_id: loan.id });
            
            toast.success('Ditolak', { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error('Gagal menolak', { id: toastId });
        }
    };

    // === 3. LOGIC KIRIM WA (PANGGIL BACKEND LARAVEL) ===
    const handleIngatkanNasabah = async () => {
        if (!loan?.user?.phone) return toast.error("No HP Nasabah tidak ada!");
        
        const toastId = toast.loading("Mengirim WA...");
        try {
            // Kita serahkan logic pembuatan pesan dan pengiriman ke Backend
            // Endpoint Laravel: POST /admin/financing/remind
            await API.post(`/admin/financing/remind`, { loan_id: loan.id });
            toast.success("Pesan WA Terkirim! 🚀", { id: toastId });
        } catch (err: any) {
            toast.error("Gagal kirim WA", { id: toastId });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
            <Loader2 className="animate-spin text-[#003366] mr-2" /> Memuat data...
        </div>
    );
    if (!loan) return <div className="text-center p-10 text-red-500 font-bold">Data tidak ditemukan.</div>;

    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;
    const sisaPokok = Number(loan.remaining_amount ?? 0);

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto min-h-screen bg-gray-50/50">

            {/* HEADER */}
            <div className="mb-6">
                <button onClick={() => navigate('/admin/pembiayaan')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-2">
                    <ArrowLeft size={18} /> Kembali
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Detail Pinjaman</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        loan.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        loan.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        STATUS: {loan.status?.toUpperCase()}
                    </span>
                </div>
                <p className="text-sm text-gray-500">{loan.type}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* KOLOM KIRI (INFO UTAMA) */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={loan.user?.avatar_url || `https://ui-avatars.com/api/?name=${loan.user?.name}&background=136f42&color=fff`}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full object-cover border border-gray-100"
                            />
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-gray-900 truncate">{loan.user?.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Smartphone size={12} /> {loan.user?.phone || '-'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleIngatkanNasabah}
                            className="bg-green-50 hover:bg-green-100 text-green-600 p-2.5 rounded-lg transition-colors border border-green-200"
                            title="Kirim WA Tagihan"
                        >
                            <MessageSquare size={18} />
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Sisa Pokok</p>
                            <p className="text-3xl font-bold text-blue-600">{formatRupiah(sisaPokok)}</p>
                            <div className="text-xs text-gray-400 mt-1">dari total {formatRupiah(loan.amount)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5"><Clock size={10} /> Tenor</p>
                                <p className="font-bold text-gray-800 text-sm">{loan.duration} Bln</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5"><DollarSign size={10} /> Cicilan</p>
                                <p className="font-bold text-gray-800 text-sm">{formatRupiah(loan.monthly_payment)}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] mb-1 font-semibold text-gray-500">
                                <span>Progress Bayar</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* ALERT RESTRUKTURISASI */}
                    {loan.restructure_status === 'pending' && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                            <div className="absolute -top-2 -right-2 p-2 opacity-10"><AlertTriangle size={80} /></div>
                            <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} /> Pengajuan Perpanjangan
                            </h4>
                            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                Member mengajukan perubahan tenor menjadi <b className="text-sm bg-orange-100 px-1 rounded">{loan.restructure_req_duration} Bulan</b>.
                            </p>
                            <div className="mt-2 bg-white/80 p-2.5 rounded text-xs italic text-orange-900 border border-orange-100">
                                "{loan.restructure_reason}"
                            </div>
                            <div className="flex gap-2 mt-3 relative z-10">
                                <button onClick={handleApproveRestructure} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1">
                                    <Check size={14} /> Setujui
                                </button>
                                <button onClick={handleRejectRestructure} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <X size={14} /> Tolak
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN (DAFTAR CICILAN) */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" /> Riwayat Angsuran
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">
                            {paidCount} dari {installments.length} Lunas
                        </span>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10 text-xs text-gray-500 font-semibold uppercase">
                                <tr>
                                    <th className="p-3 pl-5 w-12 text-center">#</th>
                                    <th className="p-3">Jatuh Tempo</th>
                                    <th className="p-3">Tagihan</th>
                                    <th className="p-3 text-right pr-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {installments.map((item, index) => {
                                    const isPaid = item.status === 'paid';
                                    const dueDate = new Date(item.due_date);
                                    const isOverdue = !isPaid && dueDate < new Date();

                                    return (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isPaid ? 'bg-green-50/10' : ''}`}>
                                            <td className="p-3 pl-5 text-center text-gray-400 text-xs">{index + 1}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-gray-700">
                                                    {format(dueDate, 'dd MMM yyyy', { locale: indonesia })}
                                                </div>
                                                {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded inline-block mt-1">TELAT</span>}
                                            </td>
                                            <td className="p-3 font-bold text-gray-800">
                                                {formatRupiah(item.amount)}
                                            </td>
                                            <td className="p-3 text-right pr-5">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded text-[10px] font-bold">
                                                        <CheckCircle size={12} /> LUNAS
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded text-[10px] font-bold">
                                                        <Clock size={12} /> PENDING
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};