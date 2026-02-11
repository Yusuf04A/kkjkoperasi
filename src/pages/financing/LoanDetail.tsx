import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle, Wallet, Clock, AlertTriangle, User, History, X } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
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
        const { data: loanData } = await supabase.from('loans').select('*').eq('id', id).single();
        setLoan(loanData);

        if (loanData) {
            const { data: instData } = await supabase
                .from('installments').select('*').eq('loan_id', id).order('due_date', { ascending: true });
            setInstallments(instData || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [id]);

    // LOGIC BAYAR
    const handlePay = async (instId: string, amount: number) => {
        const confirm = window.confirm(`Bayar tagihan sebesar ${formatRupiah(amount)}?\nSaldo Tapro akan terpotong.`);
        if (!confirm) return;
        const toastId = toast.loading('Memproses pembayaran...');
        try {
            const { error } = await supabase.rpc('pay_installment', { installment_id_param: instId });
            if (error) throw error;
            toast.success('Pembayaran Berhasil!', { id: toastId });
            fetchData();
            checkSession();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
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
        const { error } = await supabase.from('loans').update({
            restructure_req_duration: tenorInt,
            restructure_reason: reason,
            restructure_status: 'pending'
        }).eq('id', loan.id);

        if (error) toast.error("Gagal mengirim request");
        else {
            toast.success("Pengajuan dikirim ke Admin", { id: toastId });
            setShowModal(false); // Tutup modal
            fetchData(); // Refresh tampilan
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat data...</div>;
    if (!loan) return <div className="min-h-screen flex items-center justify-center text-red-500">Data tidak ditemukan</div>;

    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative">

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/pembiayaan')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Detail Pinjaman</h1>
                        <p className="text-xs text-gray-500">{loan.type}</p>
                    </div>
                </div>
                <img
                    src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=0D8ABC&color=fff`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-gray-200"
                />
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* CARD INFO UTAMA */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Pinjaman</p>
                            <h2 className="text-3xl font-bold text-kkj-blue">{formatRupiah(loan.amount)}</h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${loan.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {loan.status === 'active' ? 'Berjalan' : loan.status}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress Pembayaran</span>
                            <span className="font-bold text-gray-800">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-right text-gray-400 mt-1">{paidCount} dari {installments.length} angsuran lunas</p>
                    </div>

                    {/* ALERT STATUS RESTRUKTURISASI */}
                    {loan.restructure_status === 'pending' && (
                        <div className="mt-5 bg-orange-50 border border-orange-200 p-3 rounded-xl flex gap-3 items-start animate-pulse">
                            <Clock className="text-orange-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-sm font-bold text-orange-800">Menunggu Persetujuan Admin</p>
                                <p className="text-xs text-orange-700 mt-0.5">
                                    Pengajuan perpanjangan tenor menjadi <b>{loan.restructure_req_duration} Bulan</b> sedang ditinjau.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* TOMBOL BESAR AJUKAN PERPANJANGAN */}
                {loan.status === 'active' && loan.restructure_status !== 'pending' && (
                    <div
                        onClick={() => setShowModal(true)}
                        className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:bg-white group-hover:text-blue-500 transition-colors">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Merasa berat membayar?</h4>
                                <p className="text-xs text-gray-500">Ajukan perpanjangan tenor di sini.</p>
                            </div>
                        </div>
                        <button className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-lg group-hover:bg-blue-700">
                            Ajukan
                        </button>
                    </div>
                )}

                {/* LIST CICILAN */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 px-1">
                        <History size={18} /> Jadwal Pembayaran
                    </h3>

                    <div className="space-y-3">
                        {installments.map((item, index) => {
                            const isPaid = item.status === 'paid';
                            const dueDate = new Date(item.due_date);
                            const isOverdue = !isPaid && dueDate < new Date();

                            return (
                                <div key={item.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isPaid ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{formatRupiah(item.amount)}</p>
                                            <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                <Calendar size={10} /> {format(dueDate, 'dd MMM yyyy', { locale: indonesia })}
                                                {isOverdue && <span className="bg-red-100 text-red-600 px-1.5 rounded text-[10px]">LATE</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {isPaid ? (
                                        <div className="flex flex-col items-end">
                                            <CheckCircle className="text-green-500" size={20} />
                                            <span className="text-[10px] text-green-700 font-bold mt-1">LUNAS</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePay(item.id, item.amount)}
                                            className="bg-kkj-blue text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
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
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Ajukan Perpanjangan</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={submitRestructure} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tenor Baru (Total Bulan)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                                    placeholder={`Min: ${loan.duration + 1} Bulan`}
                                    value={newTenor}
                                    onChange={(e) => setNewTenor(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    *Tenor saat ini: {loan.duration} Bulan. Masukkan angka yang lebih besar.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Alasan Perpanjangan</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors h-24 resize-none"
                                    placeholder="Contoh: Sedang ada kebutuhan mendesak..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full bg-kkj-blue text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-800 transition-transform active:scale-95">
                                Kirim Pengajuan
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};