import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Package
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
  
  // State untuk melacak ID transaksi mana yang sedang dibuka detailnya
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      // Ambil transaksi
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Ambil detail pesanan toko untuk dicocokkan dengan transaksi belanja
      const { data: orderData } = await supabase
        .from('shop_orders')
        .select(`
            id,
            shop_order_items(
                quantity,
                price_at_purchase,
                shop_products(name)
            )
        `)
        .eq('user_id', currentUser.id);

      // Gabungkan detail barang ke dalam transaksi belanja
      const enrichedTransactions = txData?.map(tx => {
        if (tx.type === 'shop_payment') {
            // Ambil ID pesanan dari description (format: "Belanja Toko: [id]")
            const orderIdPrefix = tx.description?.split(': ')[1]?.trim();
            
            // Cari data order yang cocok
            const relatedOrder = orderData?.find(o => o.id.startsWith(orderIdPrefix));
            
            if (relatedOrder) {
                return { ...tx, order_details: relatedOrder.shop_order_items };
            }
        }
        return tx;
      });

      setTransactions(enrichedTransactions || []);
      setLoading(false);
    };

    fetchHistory();
  }, [user, checkSession]);

  const toggleExpand = (id: string) => {
      if (expandedId === id) {
          setExpandedId(null);
      } else {
          setExpandedId(id);
      }
  };

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
          label: displayLabel || 'Bagi Hasil Lhu'
        };
      case 'shop_payment':
        return {
            icon: <ShoppingBag size={20} />,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            label: displayLabel || 'Belanja Koperasi'
        };
      default:
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
            const isIncome = ['topup', 'transfer_in', 'lhu'].includes(tx.type);
            const isShopOrder = tx.type === 'shop_payment';
            const isExpanded = expandedId === tx.id;

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Bagian Utama Card (Bisa diklik jika itu belanjaan) */}
                <div 
                    onClick={() => isShopOrder && toggleExpand(tx.id)}
                    className={cn(
                        "p-4 flex justify-between items-center transition-colors", 
                        isShopOrder && "cursor-pointer hover:bg-slate-50 active:bg-slate-100"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0",
                            style.bg,
                            style.text
                            )}
                        >
                            {style.icon}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight tracking-tight flex items-center gap-1.5">
                                {style.label}
                                {isShopOrder && (
                                    isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />
                                )}
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

                {/* Bagian Detail Belanjaan (Expandable) */}
                {isShopOrder && isExpanded && tx.order_details && (
                    <div className="bg-slate-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Package size={12} /> Daftar Barang Dipesan
                        </h4>
                        <div className="space-y-2">
                            {tx.order_details.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">{item.quantity}x</span>
                                        <span className="font-semibold text-slate-700">{item.shop_products?.name || 'Produk dihapus'}</span>
                                    </div>
                                    <span className="font-bold text-slate-500 font-mono">
                                        {formatRupiah(item.price_at_purchase * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};