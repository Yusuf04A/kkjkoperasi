import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const TransactionHistory = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error) setTransactions(data || []);
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h1>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-4">

                {loading ? (
                    <p className="text-center text-gray-400 py-10">Memuat data...</p>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p>Belum ada riwayat transaksi.</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {/* Icon Berdasarkan Tipe */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'topup' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {tx.type === 'topup' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 capitalize">
                                        {tx.type === 'topup' ? 'Isi Saldo' : tx.type}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className={`font-mono font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {tx.type === 'topup' ? '+' : '-'}{formatRupiah(tx.amount)}
                                </p>

                                {/* Badge Status */}
                                <div className="flex justify-end mt-1">
                                    {tx.status === 'pending' && <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full"><Clock size={10} /> Proses</span>}
                                    {tx.status === 'success' && <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Berhasil</span>}
                                    {tx.status === 'failed' && <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><XCircle size={10} /> Gagal</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};