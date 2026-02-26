import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { 
    ArrowLeft, CreditCard, Banknote, AlertCircle, 
    Wallet, PiggyBank, CheckCircle, Loader2, Landmark,
    Save, School, Gift, Heart, Plane
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah, cn } from '../../lib/utils';
import { PinModal } from '../../components/PinModal';
import { SuccessModal } from '../../components/SuccessModal'; 

export const Withdraw = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();

    // STATE UTAMA
    const [sourceType, setSourceType] = useState<'tapro' | 'simpanan'>('tapro');
    const [selectedSimpanan, setSelectedSimpanan] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // STATE MODAL
    const [showPinModal, setShowPinModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false); 

    // 🔥 FUNGSI PEMUTAR SUARA (pop.mp3)
    const playSuccessSound = () => {
        try {
            const audio = new Audio('/sounds/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.warn("Autoplay dicegah browser", err));
        } catch (e) {
            console.error("Audio file not found");
        }
    };

    // DAFTAR OPSI SIMPANAN YANG BISA DITARIK SAJA
    // Simpanan Pokok, Wajib, dan Donasi Kebersamaan telah dihapus dari list ini
    const simpananOptions = [
        { id: 'simade', name: 'Masa Depan', col: 'simade_balance', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'sipena', name: 'Pendidikan', col: 'sipena_balance', icon: School, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'sihara', name: 'Hari Raya', col: 'sihara_balance', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'siqurma', name: 'Qurban', col: 'siqurma_balance', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'siuji', name: 'Haji / Umroh', col: 'siuji_balance', icon: Plane, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'siwalima', name: 'Walimah', col: 'siwalima_balance', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    ];

    useEffect(() => {
        if (!user) checkSession();
    }, [user, checkSession]);

    const getActiveBalance = () => {
        if (sourceType === 'tapro') return user?.tapro_balance || 0;
        if (selectedSimpanan) return user?.[selectedSimpanan.col] || 0;
        return 0;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
    };

    const handleWithdrawClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\D/g, ''));

        if (sourceType === 'simpanan' && !selectedSimpanan) {
            return toast.error('pilih jenis simpanan dulu!');
        }
        if (!nominal || nominal < 50000) {
            return toast.error('minimal penarikan rp 50.000');
        }
        if (nominal > getActiveBalance()) {
            return toast.error('saldo tidak mencukupi!');
        }
        if (!bankName.trim() || !accountNumber.trim()) {
            return toast.error('info rekening wajib diisi!');
        }

        setShowPinModal(true);
    };

    const executeWithdraw = async () => {
        setIsLoading(true);
        const nominal = parseInt(amount.replace(/\D/g, ''));

        try {
            const { error } = await supabase.from('savings_withdrawals').insert({
                user_id: user?.id,
                type: sourceType === 'tapro' ? 'tapro' : selectedSimpanan.id,
                amount: nominal,
                bank_name: bankName,
                account_number: accountNumber,
                status: 'pending'
            });

            if (error) throw error;

            playSuccessSound();
            setShowSuccessModal(true); 

        } catch (error: any) {
            toast.error('gagal: ' + error.message);
        } finally {
            setIsLoading(false);
            setShowPinModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900 text-left lowercase">
            
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 transition shrink-0 uppercase">
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight first-letter:uppercase">tarik tunai</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
                
                {/* 1. KATEGORI SUMBER DANA */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => { setSourceType('tapro'); setSelectedSimpanan(null); }}
                        className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                            sourceType === 'tapro' ? "bg-[#136f42] border-[#136f42] text-white shadow-lg" : "bg-white border-gray-200 text-gray-500"
                        )}
                    >
                        <Wallet size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">saldo tapro</span>
                    </button>
                    <button 
                        onClick={() => setSourceType('simpanan')}
                        className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                            sourceType === 'simpanan' ? "bg-[#136f42] border-[#136f42] text-white shadow-lg" : "bg-white border-gray-200 text-gray-500"
                        )}
                    >
                        <PiggyBank size={24} />
                        {/* REVISI: Label Diganti dari NON-TAPRO ke SIMPANAN */}
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">simpanan</span>
                    </button>
                </div>

                {/* 2. SALDO CARD */}
                <div className="rounded-3xl bg-[#136f42] p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#136f42] to-[#0f5c35] opacity-90 z-0"></div>
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-[#aeea00] uppercase tracking-[0.2em] mb-1">
                            {sourceType === 'tapro' ? 'saldo dompet tapro' : selectedSimpanan ? selectedSimpanan.name : 'pilih jenis simpanan'}
                        </p>
                        <h2 className="text-3xl font-black tracking-tight uppercase">
                            {formatRupiah(getActiveBalance())}
                        </h2>

                        {sourceType === 'simpanan' && (
                            <div className="mt-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {simpananOptions.map((opt) => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setSelectedSimpanan(opt)}
                                        className={cn(
                                            "w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all text-xs font-bold",
                                            selectedSimpanan?.id === opt.id 
                                                ? "bg-white text-[#136f42] border-white shadow-lg" 
                                                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <opt.icon size={14} />
                                            <span className="first-letter:uppercase">{opt.name}</span>
                                        </div>
                                        <span className="opacity-80 font-mono uppercase">{formatRupiah(user?.[opt.col] || 0)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. FORM INPUT */}
                <form onSubmit={handleWithdrawClick} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">nominal penarikan</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-focus-within:text-[#136f42] transition-colors uppercase">rp</span>
                            <input
                                type="text"
                                placeholder="0"
                                className="w-full pl-12 h-14 text-xl font-black bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all uppercase"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">rekening tujuan</label>
                        <div className="relative">
                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="nama bank (bca, mandiri, dll)"
                                className="w-full pl-12 h-12 text-sm font-bold bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#136f42] outline-none first-letter:uppercase"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="nomor rekening"
                                className="w-full pl-12 h-12 text-sm font-bold bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#136f42] outline-none first-letter:uppercase"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || (parseInt(amount.replace(/\D/g, '')) > getActiveBalance())}
                        className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-[#136f42] text-white hover:bg-[#0f5c35] shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : <><Banknote size={18} className="inline mr-2 uppercase" /> ajukan penarikan</>}
                    </button>
                </form>

                {/* INFO */}
                <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 lowercase">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                        permintaan penarikan akan diverifikasi admin dalam waktu 1x24 jam kerja.
                    </p>
                </div>
            </div>

            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={executeWithdraw}
                title="konfirmasi penarikan"
            />

            <SuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/transaksi/riwayat');
                }}
                title="Penarikan Diajukan!"
                message={`permintaan penarikan sebesar rp ${amount} telah berhasil dikirim ke admin untuk verifikasi.`}
            />
        </div>
    );
};