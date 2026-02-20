import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock,
  ArrowRightLeft, Coins, TrendingUp, Filter,
  ShoppingBag, ChevronDown, ChevronUp, Package, X,
  Building, Scale, Wallet, Landmark, Calendar,
  FileText, Info, Hash, Tag
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
  
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
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

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      const { data: orderData } = await supabase
        .from('shop_orders')
        .select(`id, shop_order_items(quantity, price_at_purchase, shop_products(name))`)
        .eq('user_id', currentUser.id);

      const enrichedTransactions = txData?.map(tx => {
        if (tx.type === 'shop_payment') {
            const orderIdPrefix = tx.description?.split(': ')[1]?.trim();
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

  const categories = [
    { id: 'all', label: 'Semua', icon: <Clock size={12}/> },
    { id: 'topup', label: 'Isi saldo', icon: <ArrowDownLeft size={12}/> },
    { id: 'transfer_out', label: 'Kirim saldo', icon: <ArrowUpRight size={12}/> },
    { id: 'transfer_in', label: 'Terima saldo', icon: <ArrowDownLeft size={12}/> },
    { id: 'withdraw', label: 'Tarik tunai', icon: <Landmark size={12}/> },
    { id: 'shop_payment', label: 'Belanja toko', icon: <ShoppingBag size={12}/> },
    { id: 'loan_payment', label: 'Bayar angsuran', icon: <Calendar size={12}/> },
    { id: 'pawn_payment', label: 'Pegadaian', icon: <Scale size={12}/> },
    { id: 'inflip_invest', label: 'Inflip (Properti)', icon: <Building size={12}/> },
    { id: 'tamasa_buy', label: 'Emas tamasa', icon: <Coins size={12}/> },
    { id: 'lhu', label: 'Bagi hasil', icon: <TrendingUp size={12}/> },
  ];

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter(tx => tx.type === activeFilter);
  }, [transactions, activeFilter]);

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const getTransactionStyle = (tx: any) => {
    const type = tx.type;
    const label = tx.description || '';

    const styles: any = {
      topup: { icon: <ArrowDownLeft />, bg: 'bg-emerald-50', text: 'text-emerald-600', name: 'Isi saldo' },
      withdraw: { icon: <ArrowUpRight />, bg: 'bg-rose-50', text: 'text-rose-600', name: 'Tarik tunai' },
      transfer_out: { icon: <ArrowUpRight />, bg: 'bg-blue-50', text: 'text-blue-600', name: 'Kirim saldo' },
      transfer_in: { icon: <ArrowDownLeft />, bg: 'bg-emerald-50', text: 'text-emerald-600', name: 'Terima saldo' },
      shop_payment: { icon: <ShoppingBag />, bg: 'bg-indigo-50', text: 'text-indigo-600', name: 'Belanja koperasi' },
      loan_payment: { icon: <Calendar />, bg: 'bg-amber-50', text: 'text-amber-600', name: 'Angsuran pinjaman' },
      pawn_payment: { icon: <Scale />, bg: 'bg-slate-50', text: 'text-slate-600', name: 'Pembayaran gadai' },
      inflip_invest: { icon: <Building />, bg: 'bg-cyan-50', text: 'text-cyan-600', name: 'Investasi Inflip' },
      tamasa_buy: { icon: <Coins />, bg: 'bg-yellow-50', text: 'text-yellow-600', name: 'Beli emas' },
      lhu: { icon: <TrendingUp />, bg: 'bg-green-50', text: 'text-green-600', name: 'Bagi hasil LHU' },
    };

    return styles[type] || { icon: <ArrowRightLeft />, bg: 'bg-slate-50', text: 'text-slate-500', name: label || type };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 shrink-0">
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              Riwayat transaksi
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {activeFilter !== 'all' && (
                <button 
                    onClick={() => setActiveFilter('all')}
                    className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-all active:scale-95"
                >
                    Reset
                </button>
            )}
            <button 
                onClick={() => setShowFilter(!showFilter)}
                className={cn(
                    "p-2.5 rounded-xl transition-all border",
                    showFilter ? "bg-[#136f42] text-white border-[#136f42]" : "bg-white text-slate-400 border-slate-200 hover:border-[#136f42] hover:text-[#136f42]"
                )}
            >
                <Filter size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* HORIZONTAL CHIP FILTER */}
        {showFilter && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveFilter(cat.id); setShowFilter(false); }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap shrink-0",
                                activeFilter === cat.id 
                                ? "bg-[#136f42] text-white border-[#136f42] shadow-lg shadow-green-900/20" 
                                : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                            )}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-3">
        {/* PETUNJUK KATEGORI AKTIF */}
        {activeFilter !== 'all' && !loading && (
            <div className="flex items-center gap-2 px-1 mb-2 animate-in fade-in slide-in-from-left-2">
                <div className="h-4 w-1 bg-[#136f42] rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Kategori: <span className="text-[#136f42]">{categories.find(c => c.id === activeFilter)?.label}</span>
                </p>
            </div>
        )}

        {loading ? (
          <div className="text-center py-24 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#136f42] rounded-full animate-spin"></div>
            <p className="text-xs font-medium uppercase tracking-widest">Sinkronisasi data...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center bg-white rounded-[2rem] border border-slate-100 shadow-sm mx-4">
            <X size={32} className="text-slate-200 mb-2" />
            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">Kosong</p>
            <p className="text-xs font-medium text-slate-400 mt-1 italic leading-relaxed px-10">
                Belum ada transaksi di kategori <span className="font-bold text-slate-600">{categories.find(c => c.id === activeFilter)?.label}</span>.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const style = getTransactionStyle(tx);
            const isIncome = ['topup', 'transfer_in', 'lhu'].includes(tx.type);
            const isShopOrder = tx.type === 'shop_payment';
            const isExpanded = expandedId === tx.id;

            return (
              <div key={tx.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div 
                    onClick={() => toggleExpand(tx.id)}
                    className="p-4 flex justify-between items-center transition-colors cursor-pointer hover:bg-slate-50"
                >
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0", style.bg, style.text)}>
                            {React.cloneElement(style.icon as React.ReactElement, { size: 22 })}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 capitalize">
                                {style.name}
                                {isExpanded ? <ChevronUp size={14} className="text-[#136f42]" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className={cn("font-mono font-bold text-base tracking-tighter", isIncome ? 'text-emerald-600' : 'text-rose-500')}>
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                        </p>
                        <div className="flex justify-end mt-0.5">
                            <span className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-lg border",
                                tx.status === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                tx.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-rose-50 text-rose-700 border-rose-100"
                            )}>
                                {tx.status === 'success' ? 'Berhasil' : tx.status === 'pending' ? 'Proses' : 'Gagal'}
                            </span>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-4 animate-in slide-in-from-top-2 duration-200">
                        {isShopOrder && tx.order_details ? (
                            <>
                                <p className="text-[10px] font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <Package size={12} /> Daftar Barang Belanja
                                </p>
                                <div className="space-y-2">
                                    {tx.order_details.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#136f42] bg-white border border-slate-100 px-2 py-1 rounded text-[10px]">{item.quantity}x</span>
                                                <span className="font-medium text-slate-700 capitalize">{item.shop_products?.name || 'Item'}</span>
                                            </div>
                                            <span className="font-bold text-slate-500 font-mono italic text-[11px]">
                                                {formatRupiah(item.price_at_purchase * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                                        <FileText size={12} /> Rincian transaksi
                                    </p>
                                    <span className="text-[9px] font-black text-[#136f42] bg-green-50 px-2 py-1 rounded border border-green-100 uppercase tracking-tighter flex items-center gap-1">
                                        <Tag size={10}/> {style.name}
                                    </span>
                                </div>
                                
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {tx.description || `Transaksi ${style.name} via Saldo Tapro.`}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <Hash size={10} className="text-slate-300" />
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID Ref</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{tx.id.slice(0, 18)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                                    <Info size={12} className="text-blue-600 shrink-0" />
                                    <p className="text-[10px] text-blue-800 font-medium leading-tight italic">
                                        Data tercatat otomatis di sistem Koperasi KKJ.
                                    </p>
                                </div>
                            </div>
                        )}
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