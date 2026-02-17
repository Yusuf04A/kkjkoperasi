import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios menggantikan Supabase
import { useAuthStore } from '../../store/useAuthStore';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowRightLeft,
  Coins,
  TrendingUp,
  Filter,
  PiggyBank
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const TransactionHistory = () => {
  const { user, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // 1. Pastikan session user aktif
        if (!user) {
          await checkSession();
        }

        // 2. Ambil data dari Route::get('/balance') di Laravel
        // Endpoint ini mengembalikan data dari tabel balance_transactions MySQL
        const response = await API.get('/balance');
        setTransactions(response.data || []);
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, checkSession]);

  const getTransactionStyle = (tx: any) => {
    const type = tx.type;
    const displayLabel = tx.description || '';

    switch (type) {
      case 'topup':
        return {
          icon: <ArrowDownLeft size={20} />,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: displayLabel || 'Isi Saldo'
        };
      case 'withdraw':
        return {
          icon: <ArrowUpRight size={20} />,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: displayLabel || 'Tarik Tunai'
        };
      case 'transfer_in':
        return {
          icon: <ArrowDownLeft size={20} />,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: displayLabel || 'Transfer Masuk'
        };
      case 'transfer_out':
        return {
          icon: <ArrowUpRight size={20} />,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: displayLabel || 'Transfer Keluar'
        };
      case 'tamasa_buy':
        return {
          icon: <Coins size={20} />,
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          label: displayLabel || 'Beli Emas Tamasa'
        };
      case 'lhu':
        return {
          icon: <TrendingUp size={20} />,
          bg: 'bg-green-50',
          text: 'text-green-700',
          label: displayLabel || 'Bagi Hasil LHU'
        };
      default:
        // Handle setoran simpanan (misal: deposit_simwa)
        if (type.startsWith('deposit_')) {
             return {
                icon: <PiggyBank size={20} />,
                bg: 'bg-indigo-50',
                text: 'text-indigo-700',
                label: displayLabel || 'Setor Simpanan'
             };
        }
        return {
          icon: <ArrowRightLeft size={20} />,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: displayLabel || type
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-green-50 transition text-[#136f42]"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              Riwayat Transaksi
            </h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-[#136f42] transition">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">

        {loading ? (
          <div className="text-center py-24 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#136f42] border-t-transparent"></div>
            <p className="text-sm text-slate-500 font-medium">
              Memuat data...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center text-slate-400">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
              <Clock size={32} className="text-[#136f42]/30" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Belum ada transaksi
            </p>
          </div>
        ) : (
          transactions.map((tx) => {
            const style = getTransactionStyle(tx);
            // Tentukan apakah ini pemasukan atau pengeluaran
            // 'deposit_' dianggap pengeluaran dari Tapro (walau masuk ke simpanan lain), 
            // tapi jika ingin ditampilkan sebagai mutasi simpanan, sesuaikan.
            // Di sini kita anggap 'deposit_' = pengeluaran dari Tapro
            const isIncome = ['topup', 'transfer_in', 'lhu'].includes(tx.type);

            return (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      style.bg,
                      style.text
                    )}
                  >
                    {style.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight tracking-tight">
                      {style.label}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
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
                    className={cn(
                      "font-mono font-black text-base tracking-tighter",
                      isIncome ? 'text-emerald-600' : 'text-rose-500'
                    )}
                  >
                    {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                  </p>

                  <div className="flex justify-end mt-1">
                    <span className={cn(
                        "flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border shadow-sm",
                        tx.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        tx.status === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                    )}>
                        {tx.status === 'success' ? 'Berhasil' : tx.status === 'pending' ? 'Proses' : 'Gagal'}
                    </span>
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