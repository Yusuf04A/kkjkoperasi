import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
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

    // Fungsi ambil data
    const fetchData = async () => {
        setLoading(true);
        // 1. Ambil Data Pinjaman
        const { data: loanData } = await supabase
            .from('loans')
            .select('*')
            .eq('id', id)
            .single();

        setLoan(loanData);

        // 2. Ambil Jadwal Cicilan
        if (loanData) {
            const { data: instData } = await supabase
                .from('installments')
                .select('*')
                .eq('loan_id', id)
                .order('due_date', { ascending: true });
            setInstallments(instData || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Logic Bayar
    const handlePay = async (instId: string, amount: number) => {
        const confirm = window.confirm(`Bayar tagihan sebesar ${formatRupiah(amount)}?\nSaldo Tapro akan terpotong.`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses pembayaran...');

        try {
            const { error } = await supabase.rpc('pay_installment', { installment_id_param: instId });

            if (error) throw error;

            toast.success('Pembayaran Berhasil!', { id: toastId });

            // Refresh data & saldo user
            fetchData();
            checkSession();

        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat detail pinjaman...</div>;
    if (!loan) return <div className="p-10 text-center text-red-500">Data tidak ditemukan</div>;

    // Hitung Progress Pembayaran
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = (paidCount / installments.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate('/pembiayaan')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Detail Pinjaman</h1>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* INFO UTAMA */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Pinjaman</p>
                            <h2 className="text-2xl font-bold text-gray-900">{formatRupiah(loan.amount)}</h2>
                            <p className="text-sm text-gray-500 mt-1">{loan.type}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${loan.status === 'paid' ? 'bg-green-100 text-green-700' :
                                loan.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {loan.status === 'paid' ? 'Lunas' : loan.status === 'active' ? 'Berjalan' : loan.status}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div className="bg-kkj-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-right text-gray-500 font-medium">
                        {paidCount} dari {installments.length} angsuran lunas
                    </p>
                </div>

                {/* LIST CICILAN */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={18} /> Jadwal Pembayaran
                    </h3>

                    {installments.map((item, index) => {
                        const isPaid = item.status === 'paid';
                        const dueDate = new Date(item.due_date);
                        const isOverdue = !isPaid && dueDate < new Date();

                        return (
                            <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between ${isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Angsuran ke-{index + 1}</p>
                                    <p className="font-bold text-gray-900">{formatRupiah(item.amount)}</p>
                                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                        Jatuh Tempo: {format(dueDate, 'dd MMMM yyyy', { locale: indonesia })}
                                    </p>
                                </div>

                                <div>
                                    {isPaid ? (
                                        <div className="flex flex-col items-end text-green-600">
                                            <CheckCircle size={24} />
                                            <span className="text-[10px] font-bold mt-1">LUNAS</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePay(item.id, item.amount)}
                                            className="bg-kkj-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Wallet size={16} /> Bayar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Saldo User */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg md:relative md:border md:rounded-xl md:shadow-none md:mt-6">
                    <div className="max-w-xl mx-auto flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400">Saldo Tapro Anda</p>
                            <p className="font-bold text-gray-900">{formatRupiah(user?.tapro_balance || 0)}</p>
                        </div>
                        {!installments.every(i => i.status === 'paid') && loan.status === 'active' && (
                            <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 flex gap-1 items-center">
                                <AlertCircle size={12} /> Pastikan saldo cukup
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};