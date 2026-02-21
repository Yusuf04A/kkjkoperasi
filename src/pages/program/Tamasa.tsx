import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, ShieldCheck, Wallet, ChevronRight, Info, AlertCircle, Loader2, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { supabase } from "../../lib/supabase";
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';
import { SuccessModal } from '../../components/SuccessModal';

export const Tamasa = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();

    // --- STATE FORM ---
    const [monthlyAmount, setMonthlyAmount] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [goldPrice, setGoldPrice] = useState(0); 

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userBalanceGram, setUserBalanceGram] = useState<number>(0);

    // State Loading
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);

    // State Modal PIN & Success
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // 🔥 TAMBAHAN: State untuk mengunci pesan sukses agar tidak berubah jadi 0 saat form direset
    const [successMessage, setSuccessMessage] = useState('');

    // --- 1. FETCH HARGA EMAS TERBARU ---
    const fetchGoldPrice = async () => {
        try {
            const { data, error } = await supabase
                .from('gold_prices')
                .select('buy_price')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (data) {
                setGoldPrice(data.buy_price);
            } else {
                setGoldPrice(1300000); 
            }
        } catch (err) {
            console.error("Error fetching gold price:", err);
            setGoldPrice(1300000); 
        }
    };

    // --- 2. INITIAL LOAD ---
    useEffect(() => {
        const initPage = async () => {
            if (!user) {
                await checkSession();
            }
            await fetchGoldPrice(); 
            setIsAuthChecking(false);
        };
        initPage();
    }, [user, checkSession]);

    // --- 3. PROTEKSI LOGIN ---
    useEffect(() => {
        if (!isAuthChecking && !user) {
            toast.error("Silakan login terlebih dahulu.");
            navigate('/login');
        }
    }, [isAuthChecking, user, navigate]);

    // --- 4. FETCH SALDO EMAS USER ---
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

    // --- LOGIC PERHITUNGAN ---
    const cleanAmount = monthlyAmount ? parseInt(monthlyAmount.replace(/\D/g, '')) : 0;
    const cleanDuration = duration ? parseInt(duration) : 0;
    const simulationTotal = cleanAmount * cleanDuration;
    const amountToPay = cleanAmount;
    const gramToGet = amountToPay > 0 && goldPrice > 0 ? amountToPay / goldPrice : 0;

    // --- HANDLERS ---
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (raw === '') {
            setMonthlyAmount('');
        } else {
            setMonthlyAmount(parseInt(raw).toLocaleString('id-ID'));
        }
    };

    const handleInitialSubmit = () => {
        if (goldPrice <= 0) {
            toast.error("Gagal memuat harga emas. Silakan refresh halaman.");
            return;
        }
        if (cleanAmount < 10000) {
            toast.error("Minimal pembelian Rp 10.000");
            return;
        }
        if (amountToPay > (user?.tapro_balance || 0)) {
            toast.error("Saldo Tapro Anda tidak mencukupi!");
            return;
        }
        setShowPinModal(true);
    };

    // 🔥 LOGIKA EKSEKUSI TRANSAKSI YANG SUDAH DIPERBAIKI TRANSISINYA 🔥
    const executeTransaction = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading("Memproses pembelian...");
        
        // Simpan nilai gram akhir sebelum form di reset
        const finalGram = gramToGet.toFixed(4);

        try {
            // 1. Insert ke tabel TAMASA
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

            // 2. Update Saldo Tapro
            const { error: errUpdate } = await supabase
                .from('profiles')
                .update({ tapro_balance: (user?.tapro_balance || 0) - amountToPay })
                .eq('id', user?.id);

            if (errUpdate) throw errUpdate;

            // 3. Catat di tabel riwayat transaksi umum
            const { error: errTrx } = await supabase
                .from('transactions')
                .insert([{
                    user_id: user?.id,
                    type: 'tamasa_buy',
                    amount: amountToPay,
                    status: 'success', 
                    description: `Beli Emas TAMASA ${finalGram} gr`
                }]);

            if (errTrx) throw errTrx;

            toast.dismiss(toastId);
            setShowPinModal(false);
            
            // Kunci pesan ke dalam state agar aman
            setSuccessMessage(`Pembelian emas sebesar ${finalGram} gram telah berhasil diajukan. Saldo emas Anda akan bertambah otomatis setelah verifikasi admin.`);
            
            // Beri jeda halus agar modal PIN tertutup sempurna sebelum Success Modal muncul
            setTimeout(() => {
                setShowSuccessModal(true);
            }, 300);

            // Refresh data terbaru di background
            await checkSession(); 
            fetchBalance(); 

        } catch (err: any) {
            console.error(err);
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthChecking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-900">
                <Loader2 className="w-10 h-10 text-[#136f42] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Memuat data emas...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
            
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 leading-none tracking-tight">TAMASA (Tabungan emas)</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

                    {/* KOLOM KIRI: INFO SALDO */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 opacity-90">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <Wallet size={18} />
                                    </div>
                                    <span className="text-xs lg:text-sm font-bold tracking-widest uppercase">Saldo emas anda</span>
                                </div>

                                {isDataLoading ? (
                                    <div className="h-10 w-40 bg-white/30 rounded animate-pulse mb-2"></div>
                                ) : (
                                    <h2 className="text-4xl lg:text-5xl font-extrabold mb-2 tracking-tight">
                                        {userBalanceGram.toFixed(4)} <span className="text-xl lg:text-2xl font-medium">gram</span>
                                    </h2>
                                )}

                                <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm mt-1">
                                    <span className="text-[10px] lg:text-xs text-yellow-100 uppercase font-bold">Estimasi rupiah:</span>
                                    <span className="text-sm lg:text-lg font-bold text-white tracking-wide">
                                        {formatRupiah(userBalanceGram * goldPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100">
                            <h4 className="font-bold text-[#136f42] mb-3 flex items-center gap-2 text-sm lg:text-base">
                                <Info size={18} /> Cara menabung
                            </h4>
                            <ul className="space-y-3 text-xs lg:text-sm text-gray-600 ml-1">
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#136f42] bg-white w-6 h-6 rounded-full flex items-center justify-center border border-green-100 shadow-sm shrink-0">1</span>
                                    <span>Input nominal uang yang ingin dikonversi ke emas.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#136f42] bg-white w-6 h-6 rounded-full flex items-center justify-center border border-green-100 shadow-sm shrink-0">2</span>
                                    <span>Input target durasi untuk melihat simulasi tabungan di masa depan.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#136f42] bg-white w-6 h-6 rounded-full flex items-center justify-center border border-green-100 shadow-sm shrink-0">3</span>
                                    <span>Selesaikan pembayaran. admin akan memverifikasi dalam 1x24 jam.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* KOLOM KANAN: FORM BELI */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-28">
                        <div className="bg-gray-50 px-6 lg:px-8 py-6 border-b border-gray-100">
                            <h2 className="font-bold text-[#136f42] text-lg lg:text-xl flex items-center gap-2">
                                <TrendingUp size={24} className="text-green-600" /> Beli emas
                            </h2>
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">Pembelian menggunakan saldo tapro anda.</p>
                        </div>

                        <div className="p-6 lg:p-8 space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nominal pembelian</label>
                                    <span className="text-[10px] text-[#136f42] font-bold bg-green-50 px-2 py-0.5 rounded">
                                        TAPRO: {formatRupiah(user?.tapro_balance || 0)}
                                    </span>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-[#136f42]">Rp</span>
                                    <input
                                        type="text"
                                        value={monthlyAmount}
                                        onChange={handleAmountChange}
                                        placeholder="Min 10.000"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xl text-gray-900 focus:ring-2 focus:ring-green-100 focus:border-[#136f42] outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target (bulan)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="Contoh: 12"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Harga/gr hari ini</label>
                                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-[#136f42] text-sm flex items-center h-[50px] shadow-inner">
                                        {formatRupiah(goldPrice)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">Total pembayaran</span>
                                    <span className="font-bold text-gray-900 text-lg">{formatRupiah(amountToPay)}</span>
                                </div>
                                <div className="h-px bg-yellow-200/50"></div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">Perkiraan emas</span>
                                    <span className="font-bold text-yellow-700 bg-white px-3 py-1 rounded-lg border border-yellow-200 shadow-sm">
                                        {gramToGet.toFixed(4)} gr
                                    </span>
                                </div>

                                {cleanDuration > 1 && cleanAmount > 0 && (
                                    <div className="bg-white/60 p-2.5 rounded-xl border border-yellow-200 mt-2 flex gap-2">
                                        <Calculator size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-yellow-800 leading-relaxed font-medium">
                                            Simulasi: menabung {formatRupiah(cleanAmount)} selama {cleanDuration} bulan = <b>± {formatRupiah(simulationTotal)}</b>.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleInitialSubmit}
                                disabled={isSubmitting || goldPrice === 0 || cleanAmount < 10000}
                                className="w-full bg-[#136f42] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0f5c35] transition-all shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Beli emas sekarang <ChevronRight size={20} /></>}
                            </button>

                            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                <AlertCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                    Data harga diperbarui oleh admin secara berkala. transaksi diproses di hari kerja.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={executeTransaction}
                title="Konfirmasi pembelian emas"
            />

            {/* 🔥 SUCCESS MODAL POPUP 🔥 */}
            <SuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    // Hanya reset input saat tombol tutup diklik
                    setMonthlyAmount('');
                    setDuration('');
                    setShowSuccessModal(false);
                    navigate('/transaksi/riwayat');
                }}
                title="BELI EMAS DIAJUKAN!"
                message={successMessage}
            />
        </div>
    );
};