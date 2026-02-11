import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../lib/utils";
import { ArrowLeft, Check, X, RefreshCw, Clock, Coins, FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminTamasa = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Tab: 'pending' (Perlu Aksi) vs 'history' (Selesai)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  const fetchTransactions = async () => {
    setLoading(true);

    // Query Dasar
    let query = supabase
      .from("tamasa_transactions")
      .select(`*, profiles!fk_final_tamasa_trx (full_name, member_id)`)
      .order("created_at", { ascending: false });

    // Filter berdasarkan Tab
    if (activeTab === 'pending') {
      query = query.eq('status', 'pending');
    } else {
      // Ambil yang approved ATAU rejected
      query = query.neq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      toast.error(`Gagal: ${error.message}`);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (tx: any) => {
    const confirm = window.confirm(`Setujui pembelian emas ${tx.estimasi_gram.toFixed(4)} gram?`);
    if (!confirm) return;
    const toastId = toast.loading("Memproses...");

    try {
      // 1. Update/Insert Saldo Emas User
      const { data: balance } = await supabase.from("tamasa_balances").select("*").eq("user_id", tx.user_id).maybeSingle();

      if (balance) {
        await supabase.from("tamasa_balances").update({ total_gram: balance.total_gram + tx.estimasi_gram }).eq("user_id", tx.user_id);
      } else {
        await supabase.from("tamasa_balances").insert({ user_id: tx.user_id, total_gram: tx.estimasi_gram });
      }

      // 2. Update Status Transaksi jadi Approved
      await supabase.from("tamasa_transactions").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", tx.id);

      // 3. Notifikasi
      await supabase.from("notifications").insert({ user_id: tx.user_id, title: "TAMASA Disetujui", message: `Pembelian emas ${tx.estimasi_gram.toFixed(4)} gr sukses.`, type: "success" });

      toast.success("Disetujui!", { id: toastId });
      fetchTransactions();
    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    }
  };

  const handleReject = async (tx: any) => {
    if (!window.confirm("Tolak dan kembalikan saldo user?")) return;
    const toastId = toast.loading("Menolak...");
    try {
      // 1. Update Status jadi Rejected
      await supabase.from("tamasa_transactions").update({ status: "rejected", approved_at: new Date().toISOString() }).eq("id", tx.id);

      // 2. KEMBALIKAN SALDO TAPRO USER (REFUND)
      const { data: user } = await supabase.from('profiles').select('tapro_balance').eq('id', tx.user_id).single();
      if (user) {
        await supabase.from('profiles').update({ tapro_balance: user.tapro_balance + tx.setoran }).eq('id', tx.user_id);

        // Catat Refund di History Transaksi Umum
        await supabase.from('transactions').insert({
          user_id: tx.user_id,
          type: 'topup', // Dianggap topup (uang masuk kembali)
          amount: tx.setoran,
          status: 'success',
          description: 'Refund TAMASA Ditolak Admin'
        });
      }

      toast.success("Ditolak & Dana Dikembalikan", { id: toastId });
      fetchTransactions();
    } catch (err) {
      toast.error("Gagal menolak", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen TAMASA</h1>
              <p className="text-sm text-gray-500">Verifikasi pembelian emas anggota</p>
            </div>
          </div>
          <button onClick={fetchTransactions} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Refresh">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'pending' ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Menunggu Konfirmasi
            {activeTab === 'pending' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'history' ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Riwayat (Selesai)
            {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600 rounded-t-full"></span>}
          </button>
        </div>

        {/* LIST DATA */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Memuat data transaksi...</div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300"><FileText size={32} /></div>
            <p className="text-gray-500 font-medium">Tidak ada data {activeTab === 'pending' ? 'pending' : 'riwayat'} saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'approved' ? 'bg-green-100 text-green-600' :
                        tx.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                      }`}>
                      <Coins size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm md:text-base">{tx.profiles?.full_name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{tx.profiles?.member_id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${tx.status === 'approved' ? 'bg-green-100 text-green-700' :
                      tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {tx.status}
                  </span>
                </div>

                {/* Detail */}
                <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Setoran</p>
                    <p className="font-bold text-gray-900 text-sm">{formatRupiah(tx.setoran)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Emas (Gram)</p>
                    <p className="font-bold text-yellow-600 text-lg">{tx.estimasi_gram.toFixed(4)} <span className="text-xs text-gray-400">gr</span></p>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <Clock size={12} /> {format(new Date(tx.created_at), "dd MMM, HH:mm", { locale: indonesia })}
                  </div>
                  {tx.approved_at && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} /> Selesai: {format(new Date(tx.approved_at), "dd MMM")}
                    </div>
                  )}
                </div>

                {/* Action Buttons (Hanya jika Pending) */}
                {activeTab === 'pending' && (
                  <div className="flex gap-3 mt-4 pt-0">
                    <button onClick={() => handleReject(tx)} className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                      <X size={16} /> Tolak
                    </button>
                    <button onClick={() => handleApprove(tx)} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2">
                      <Check size={16} /> Setujui
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};