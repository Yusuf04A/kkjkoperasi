import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRightLeft
} from 'lucide-react';
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

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setTransactions(data || []);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'topup':
        return {
          icon: <ArrowDownLeft size={20} />,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: 'Isi Saldo'
        };
      case 'withdraw':
        return {
          icon: <ArrowUpRight size={20} />,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: 'Tarik Tunai'
        };
      case 'transfer_in':
        return {
          icon: <ArrowDownLeft size={20} />,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: 'Transfer Masuk'
        };
      case 'transfer_out':
        return {
          icon: <ArrowUpRight size={20} />,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: 'Transfer Keluar'
        };
      default:
        return {
          icon: <ArrowRightLeft size={20} />,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: type
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100 transition"
          >
            <ArrowLeft size={20} className="text-slate-900" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">
            Riwayat Transaksi
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">

        {loading ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">
              Memuat data transaksi...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} />
            </div>
            <p className="font-medium">Belum ada riwayat transaksi</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const style = getTransactionStyle(tx.type);
            const isIncome = tx.type === 'topup' || tx.type === 'transfer_in';

            return (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}
                  >
                    {style.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {style.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(
                        new Date(tx.created_at),
                        'dd MMM yyyy, HH:mm',
                        { locale: indonesia }
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-mono font-bold text-lg ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatRupiah(tx.amount)}
                  </p>

                  <div className="flex justify-end mt-1.5">
                    {tx.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                        <Clock size={12} /> Proses
                      </span>
                    )}
                    {tx.status === 'success' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} /> Berhasil
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full">
                        <XCircle size={12} /> Gagal
                      </span>
                    )}
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
