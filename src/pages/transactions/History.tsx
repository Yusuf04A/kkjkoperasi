import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const TransactionHistory = () => {
    const { user, checkSession } = useAuthStore();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            let currentUser = user;
            if (!currentUser) {
                await checkSession();
                const { data } = await supabase.auth.getUser();
                currentUser = data.user as any;
            }

            if (!currentUser) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!error) setTransactions(data || []);
            setLoading(false);
        };

        fetchHistory();
    }, []);

    // Helper untuk menentukan ikon dan warna berdasarkan tipe transaksi
    const getTransactionStyle = (type: string) => {
        switch (type) {
            case 'topup':
                return {
                    icon: <ArrowDownLeft size={20} />,
                    bgColor: 'bg-green-50',
                    textColor: 'text-green-700',
                    label: 'Isi Saldo'
                };
            case 'withdraw':
                return {
                    icon: <ArrowUpRight size={20} />,
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-700',
                    label: 'Tarik Tunai'
                };
            // Nanti untuk fitur transfer
            case 'transfer_in':
                return { icon: <ArrowDownLeft size={20} />, bgColor: 'bg-green-50', textColor: 'text-green-700', label: 'Transfer Masuk' };
            case 'transfer_out':
                return { icon: <ArrowUpRight size={20} />, bgColor: 'bg-red-50', textColor: 'text-red-700', label: 'Transfer Keluar' };
            default:
                return { icon: <ArrowRightLeft size={20} />, bgColor: 'bg-gray-50', textColor: 'text-gray-700', label: type };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header - Tetap Putih Bersih */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-kkj-blue" /> {/* Icon Back jadi Biru KKJ */}
                </button>
                <h1 className="text-lg font-bold text-kkj-blue">Riwayat Transaksi</h1> {/* Judul jadi Biru KKJ */}
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-4">

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kkj-blue mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm font-medium">Memuat data transaksi...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} className="text-gray-300" />
                        </div>
                        <p className="font-medium">Belum ada riwayat transaksi.</p>
                    </div>
                ) : (
                    transactions.map((tx) => {
                        const style = getTransactionStyle(tx.type);
                        const isIncome = tx.type === 'topup' || tx.type === 'transfer_in';

                        return (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    {/* Icon dengan Warna yang Sudah Disesuaikan */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bgColor} ${style.textColor}`}>
                                        {style.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 capitalize text-[15px]">
                                            {style.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                            {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {/* Nominal: Hijau untuk masuk, Merah untuk keluar */}
                                    <p className={`font-mono font-bold text-lg ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                                        {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                                    </p>

                                    {/* Badge Status dengan warna yang konsisten */}
                                    <div className="flex justify-end mt-1.5">
                                        {tx.status === 'pending' && <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full"><Clock size={12} /> Proses</span>}
                                        {tx.status === 'success' && <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full"><CheckCircle size={12} /> Berhasil</span>}
                                        {tx.status === 'failed' && <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full"><XCircle size={12} /> Gagal</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

            </div>
        </div>
    );
};