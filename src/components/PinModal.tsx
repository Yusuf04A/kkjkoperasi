import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react'; 
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom'; 

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = "Masukkan PIN Transaksi" }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate(); 
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    // 🔥 STATE BARU: Deteksi jika PIN memang belum dibuat di database
    const [isNotSet, setIsNotSet] = useState(false);

    const playSuccessSound = () => {
        const audio = new Audio('/sounds/pop.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.log("Gagal putar suara:", err));
    };

    // Reset state setiap kali modal dibuka/ditutup
    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setShowPin(false);
            setIsSuccess(false);
            setIsError(false);
            setIsNotSet(false); 
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 🔥 PERBAIKAN UTAMA: Ambil data PIN terbaru langsung dari database
            // Hal ini untuk menghindari error "PIN SALAH" saat data lokal belum tersinkronisasi
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('pin')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            const dbPin = profile?.pin;

            // 1. CEK APAKAH PIN BELUM DIATUR (NULL/KOSONG)
            if (!dbPin || dbPin.trim() === '') {
                playSuccessSound();
                setIsNotSet(true); // Memunculkan UI "PIN BELUM DIATUR"
                setLoading(false);
                return;
            }

            // 2. VALIDASI KECOCOKAN PIN JIKA SUDAH ADA
            if (pin === dbPin) {
                playSuccessSound();
                setIsSuccess(true);
                setIsError(false);
                
                setTimeout(() => {
                    onSuccess(); 
                    onClose();   
                }, 1500);

            } else {
                playSuccessSound();
                setIsError(true); // Popup merah "PIN SALAH!"
                
                setTimeout(() => {
                    setIsError(false);
                    setPin('');
                    setLoading(false);
                }, 1500);
            }
        } catch (err: any) {
            console.error("Gagal verifikasi pin:", err.message);
            setLoading(false);
        }
    };

    // =========================================================================
    // 🔥 TAMPILAN JIKA PIN BELUM DIATUR (MENGGANTIKAN POPUP PIN SALAH)
    // =========================================================================
    if (isNotSet) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-500 shadow-inner">
                        <ShieldAlert size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tight mb-2">PIN BELUM DIATUR</h3>
                    <p className="text-[11px] text-gray-500 font-normal leading-relaxed mb-6 capitalize">
                        Segera atur pin untuk mengaktifkan fitur transfer dan penarikan saldo.
                    </p>
                    <button 
                        onClick={() => {
                            onClose();
                            navigate('/profile'); // Arahkan ke halaman keamanan akun
                        }}
                        className="w-full bg-amber-500 text-white font-medium py-3.5 rounded-xl uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-sm"
                    >
                        Atur pin sekarang
                    </button>
                </div>
            </div>
        );
    }

    // Tampilan Berhasil
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-[#136f42] shadow-inner animate-in zoom-in duration-500">
                        <CheckCircle size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tight mb-2">PIN BENAR</h3>
                    <p className="text-[11px] text-gray-500 font-normal leading-relaxed">Verifikasi keamanan berhasil...</p>
                </div>
            </div>
        );
    }

    // Tampilan PIN Salah
    if (isError) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-500 shadow-inner animate-bounce">
                        <AlertCircle size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-rose-600 uppercase tracking-tight mb-2">PIN SALAH!</h3>
                    <p className="text-[11px] text-gray-500 font-normal leading-relaxed lowercase">silakan masukkan pin yang benar.</p>
                </div>
            </div>
        );
    }

    // Form Input Normal
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
                <button 
                    onClick={() => {
                        setPin('');
                        setShowPin(false);
                        onClose();
                    }} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors bg-gray-50 hover:bg-rose-50 p-1.5 rounded-lg"
                >
                    <X size={18} />
                </button>

                <div className="text-center mb-6 mt-2">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#136f42] shadow-sm">
                        <Lock size={20} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 lowercase">{title}</h3>
                    <p className="text-[10px] text-gray-400 font-normal mt-1 leading-relaxed text-center capitalize">
                        Demi keamanan transaksi, masukkan 6 digit pin anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <input
                            type={showPin ? "text" : "password"} 
                            inputMode="numeric"
                            maxLength={6}
                            className="w-full text-center text-2xl tracking-[0.5em] font-semibold py-3.5 bg-gray-50 border border-gray-200 focus:border-[#136f42] outline-none transition-all rounded-xl text-gray-700 focus:ring-4 focus:ring-green-50"
                            placeholder="••••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            autoFocus
                        />
                        
                        <button 
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#136f42] p-1.5 transition-colors bg-white rounded-lg shadow-sm border border-gray-100"
                        >
                            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || pin.length < 6}
                        className="w-full bg-[#136f42] text-white font-medium py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f5c35] transition-all shadow-sm active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Konfirmasi Pin'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed text-center">
                        Lupa pin transaksi? <br/> Hubungi admin koperasi.
                    </p>
                </div>
            </div>
        </div>
    );
};