import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, ShieldCheck, Wallet, ChevronRight, Info, AlertCircle, Loader2, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { supabase } from "../../lib/supabase";
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Tamasa = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();

  // --- STATE ---
  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [goldPrice, setGoldPrice] = useState(2947000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalanceGram, setUserBalanceGram] = useState<number>(0);

  // State Loading
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // State Modal PIN
  const [showPinModal, setShowPinModal] = useState(false);

  // --- 1. PROSES RE-AUTH SAAT REFRESH ---
  useEffect(() => {
    const initPage = async () => {
      if (!user) {
        await checkSession();
      }
      setIsAuthChecking(false);
    };
    initPage();
  }, [user, checkSession]);

  // --- 2. PROTEKSI HALAMAN ---
  useEffect(() => {
    if (!isAuthChecking && !user) {
      toast.error("Silakan login terlebih dahulu.");
      navigate('/login');
    }
  }, [isAuthChecking, user, navigate]);

  // --- 3. FETCH SALDO ---
  const fetchBalance = useCallback(async () => {
    if (!user) return;

    setIsDataLoading(true);
    try {
      const { data } = await supabase
        .from("tamasa_balances")
        .select("total_gram")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setUserBalanceGram(data.total_gram);
      } else {
        setUserBalanceGram(0);
      }
    } catch (err) {
      console.error("Error balance:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  // --- LOGIC HITUNGAN ---
  const cleanAmount = monthlyAmount ? parseInt(monthlyAmount.replace(/\D/g, '')) : 0;
  const cleanDuration = duration ? parseInt(duration) : 0;

  // Total simulasi (Hanya visual)
  const simulationTotal = cleanAmount * cleanDuration;

  // Yang dibayar SAAT INI (Hanya 1x setoran)
  const amountToPay = cleanAmount;
  const gramToGet = amountToPay > 0 ? amountToPay / goldPrice : 0;

  // --- VALIDASI ---
  const handleInitialSubmit = () => {
    if (cleanAmount < 10000) {
      toast.error("Minimal pembelian Rp 10.000");
      return;
    }
    // Cek saldo Rupiah User
    if (amountToPay > (user?.tapro_balance || 0)) {
      toast.error("Saldo Tapro Anda tidak mencukupi!");
      return;
    }

    // Jika valid, buka PIN
    setShowPinModal(true);
  };

  // --- EKSEKUSI TRANSAKSI ---
  const executeTransaction = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Memproses pembelian...");

    try {
      // 1. Catat Transaksi Emas (Pending)
      const { error: errTamasa } = await supabase
        .from("tamasa_transactions")
        .insert([
          {
            user_id: user?.id,
            setoran: amountToPay,
            harga_per_gram: goldPrice,
            estimasi_gram: gramToGet,
            status: "pending"
          }
        ]);

      if (errTamasa) throw errTamasa;

      // 2. Potong Saldo Rupiah (Tapro)
      const { error: errUpdate } = await supabase
        .from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - amountToPay })
        .eq('id', user?.id);

      if (errUpdate) throw errUpdate;

      // 3. Catat di Riwayat Transaksi Umum (transaction type: tamasa_buy)
      const { error: errTrx } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type: 'tamasa_buy',
          amount: amountToPay,
          status: 'success', // Karena saldo rupiah sudah terpotong
          description: `Beli Emas ${gramToGet.toFixed(4)} gr`
        }]);

      if (errTrx) throw errTrx;

      // Sukses
      toast.success("Berhasil! Menunggu verifikasi admin.", { id: toastId });

      // Reset Form
      setMonthlyAmount('');
      setDuration('');

      // Refresh Data Saldo & User
      await checkSession(); // Update saldo rupiah di state
      fetchBalance(); // Update saldo emas (kalau misal ada)

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setMonthlyAmount('');
    } else {
      setMonthlyAmount(parseInt(raw).toLocaleString('id-ID'));
    }
  };

  // Loading Screen Awal
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#003366] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Memuat data emas...</p>
      </div>
    );
  }

  // Safety check
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">

      {/* HEADER STICKY - RATA KIRI */}
<div className="sticky top-0 z-30 bg-white border-b border-gray-200">
  <div className="px-4 py-4 flex items-center gap-3">
    <button
      onClick={() => navigate(-1)}
      className="p-2 rounded-full hover:bg-gray-100 text-[#003366] transition-colors"
    >
      <ArrowLeft size={20} strokeWidth={2.5} />
    </button>
    <h1 className="text-base font-semibold text-[#003366] leading-none">
      TAMASA (Tabungan Emas)
    </h1>
  </div>
</div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* --- KOLOM KIRI: INFO & SALDO --- */}
          <div className="space-y-6">

            {/* KOTAK SALDO EMAS */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Wallet size={18} />
                  </div>
                  <span className="text-xs lg:text-sm font-bold tracking-widest uppercase">Saldo Emas Anda</span>
                </div>

                {/* Loading State Saldo */}
                {isDataLoading ? (
                  <div className="h-10 w-40 bg-white/30 rounded animate-pulse mb-2"></div>
                ) : (
                  <h2 className="text-4xl lg:text-5xl font-extrabold mb-2 tracking-tight">
                    {userBalanceGram.toFixed(4)} <span className="text-xl lg:text-2xl font-medium">gram</span>
                  </h2>
                )}

                <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm mt-1">
                  <span className="text-[10px] lg:text-xs text-yellow-100 uppercase font-bold">Estimasi Rupiah:</span>
                  <span className="text-sm lg:text-lg font-bold text-white tracking-wide">
                    {formatRupiah(userBalanceGram * goldPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* HERO INFO */}
            <div className="hidden lg:block bg-white rounded-3xl p-6 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-[#003366]">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-[#003366] text-lg mb-2">Investasi Aman & Syariah</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Emas adalah pelindung nilai aset terbaik terhadap inflasi. Program TAMASA dikelola secara transparan oleh Koperasi KKJ.
                  </p>
                </div>
              </div>
            </div>

            {/* GUIDES */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
              <h4 className="font-bold text-[#003366] mb-3 flex items-center gap-2 text-sm lg:text-base">
                <Info size={18} /> Cara Menabung
              </h4>
              <ul className="space-y-3 text-xs lg:text-sm text-gray-600 ml-1">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500 bg-white w-6 h-6 rounded-full flex items-center justify-center border border-blue-100 shadow-sm shrink-0">1</span>
                  <span>Masukkan nominal uang yang ingin dibelikan emas.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500 bg-white w-6 h-6 rounded-full flex items-center justify-center border border-blue-100 shadow-sm shrink-0">2</span>
                  <span>Input Durasi (opsional) untuk melihat simulasi target.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500 bg-white w-6 h-6 rounded-full flex items-center justify-center border border-blue-100 shadow-sm shrink-0">3</span>
                  <span>Klik "Beli Emas". Saldo Tapro akan terpotong <b>1x transaksi</b>.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* --- KOLOM KANAN: FORM PEMBELIAN --- */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden lg:sticky lg:top-28">
            <div className="bg-gray-50 px-6 lg:px-8 py-6 border-b border-gray-100">
              <h2 className="font-bold text-[#003366] text-lg lg:text-xl flex items-center gap-2">
                <TrendingUp size={24} className="text-green-600" />
                Beli Emas
              </h2>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">Pembelian akan memotong Saldo Tapro Anda.</p>
            </div>

            <div className="p-6 lg:p-8 space-y-6">

              {/* Input Rupiah */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nominal Pembelian</label>
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                    Saldo Tapro: {formatRupiah(user?.tapro_balance || 0)}
                  </span>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-[#003366] transition-colors">Rp</span>
                  <input
                    type="text"
                    value={monthlyAmount}
                    onChange={handleAmountChange}
                    placeholder="Min 10.000"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xl text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-[#003366] outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Input Durasi (Simulasi) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    Target <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-500">Simulasi</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Contoh: 12"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-gray-300"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Bulan</span>
                  </div>
                </div>
                {/* Harga Emas */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Emas/gr</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500 text-sm flex items-center h-[50px]">
                    {formatRupiah(goldPrice)}
                  </div>
                </div>
              </div>

              {/* Ringkasan Pembayaran */}
              <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Yang Harus Dibayar</span>
                  <span className="font-bold text-gray-900 text-lg">{formatRupiah(amountToPay)}</span>
                </div>
                <div className="h-px bg-yellow-200/50"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Perkiraan Dapat Emas</span>
                  <span className="font-bold text-yellow-700 bg-white px-3 py-1 rounded-lg border border-yellow-200 shadow-sm">
                    {gramToGet.toFixed(4)} gr
                  </span>
                </div>

                {/* Info Simulasi jika Durasi diisi */}
                {cleanDuration > 1 && (
                  <div className="bg-white/50 p-2 rounded-lg mt-2 flex items-start gap-2">
                    <Calculator size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-yellow-700 leading-relaxed">
                      <b>Simulasi:</b> Jika Anda konsisten menabung {formatRupiah(amountToPay)} selama {cleanDuration} bulan, total tabungan Anda mencapai <b>± {formatRupiah(simulationTotal)}</b>.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleInitialSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#002244] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Memproses...
                  </>
                ) : (
                  <>
                    Beli Emas Sekarang <ChevronRight size={20} />
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                <AlertCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Harga emas dapat berubah sewaktu-waktu. Saldo emas akan bertambah setelah diverifikasi Admin.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MODAL PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeTransaction}
        title="Konfirmasi Pembelian Emas"
      />

    </div>
  );
};