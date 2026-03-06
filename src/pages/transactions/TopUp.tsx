import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UploadCloud, Copy, CheckCircle, Wallet, Lock, Eye, EyeOff, X, AlertCircle, QrCode, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal';
import imageCompression from 'browser-image-compression';

export const TopUp = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [isPinSuccess, setIsPinSuccess] = useState(false);
    const [isPinError, setIsPinError] = useState(false);
    // 🔥 State Baru: Deteksi PIN belum diatur
    const [isPinNotSet, setIsPinNotSet] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const bankAccounts = [
        { name: 'Bank Mandiri', number: '1360031033316', holder: 'Koperasi Karya Kita Jaya' },
        { name: 'Bank BRI', number: '032501003161306', holder: 'Koperasi Karya Kita Jaya' },
    ];

    const playSuccessSound = () => {
        try {
            const audio = new Audio('/sounds/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.warn("Autoplay blocked", err));
        } catch (e) { console.error("Audio file not found"); }
    };

    useEffect(() => {
        if (!isPinModalOpen) {
            setPin('');
            setShowPin(false);
            setIsPinSuccess(false);
            setIsPinError(false);
            setIsPinNotSet(false);
        }
    }, [isPinModalOpen]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        if (rawValue) {
            setAmount(parseInt(rawValue).toLocaleString('id-ID'));
        } else {
            setAmount('');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Nomor rekening disalin!');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const toastId = toast.loading('Mengompres gambar...');
            try {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
                const compressedFile = await imageCompression(file, options);
                setProofFile(compressedFile);
                setPreviewUrl(URL.createObjectURL(compressedFile));
                toast.success('Gambar siap!', { id: toastId });
            } catch (error) {
                toast.error('Gagal kompres', { id: toastId });
                setProofFile(file);
                setPreviewUrl(URL.createObjectURL(file));
            }
        }
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\./g, ''));
        if (!nominal || nominal < 10000) return toast.error('Minimal Top Up Rp 10.000');
        if (!proofFile) return toast.error('Wajib upload bukti transfer!');
        setIsPinModalOpen(true);
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);

        try {
            // 🔥 PERBAIKAN UTAMA: Fetch PIN terbaru langsung dari database
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('pin')
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            const dbPin = profile?.pin;

            // 1. Cek jika PIN memang belum dibuat
            if (!dbPin || dbPin.trim() === '') {
                playSuccessSound();
                setIsPinNotSet(true);
                setIsLoading(false);
                return;
            }

            // 2. Validasi kecocokan PIN
            if (pin !== dbPin) {
                playSuccessSound();
                setIsPinError(true);
                setTimeout(() => {
                    setIsPinError(false);
                    setPin('');
                    setIsLoading(false);
                }, 1500);
                return;
            }

            // 3. Proses Transaksi jika PIN Benar
            playSuccessSound();
            setIsPinSuccess(true);

            const fileName = `topup-${user?.id}-${Date.now()}.jpg`;
            if (proofFile) await supabase.storage.from('transaction-proofs').upload(fileName, proofFile);
            const { data: { publicUrl } } = supabase.storage.from('transaction-proofs').getPublicUrl(fileName);

            await supabase.from('transactions').insert({
                user_id: user?.id,
                type: 'topup',
                amount: parseInt(amount.replace(/\./g, '')),
                status: 'pending',
                description: 'Top Up Saldo Tapro',
                proof_url: publicUrl
            });

            setTimeout(() => {
                setIsPinModalOpen(false);
                setIsSuccessModalOpen(true);
            }, 1500);

        } catch (error: any) {
            toast.error('Gagal: ' + error.message);
            setIsLoading(false);
            setIsPinSuccess(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900 text-left">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition">
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 first-letter:uppercase">top up saldo tapro</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">
                {/* INFO REKENING */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#136f42] tracking-wider pl-1">Transfer ke Rekening Resmi</h2>
                    {bankAccounts.map((bank, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-[#136f42] bg-green-50 w-fit px-2 py-0.5 rounded mb-1 tracking-wide">{bank.name}</p>
                                <p className="font-mono text-lg font-bold text-gray-900 tracking-tight">{bank.number}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-medium italic">a.n {bank.holder}</p>
                            </div>
                            <button onClick={() => handleCopy(bank.number)} className="p-2.5 text-gray-400 hover:text-[#136f42] hover:bg-green-50 rounded-xl transition-all"><Copy size={20} /></button>
                        </div>
                    ))}

                    <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-inner"><QrCode size={24} /></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-[#136f42] tracking-wide">QRIS</p>
                            <p className="text-xs font-bold text-gray-900">an. Top Up Saldo TaPro</p>
                        </div>
                        <button onClick={() => setIsQrModalOpen(true)} className="text-[10px] font-black text-white bg-[#136f42] px-4 py-2 rounded-lg hover:bg-[#0b4d2e] shadow-sm transition-all">Buka QR</button>
                    </div>
                </div>

                {/* FORM INPUT */}
                <form onSubmit={handlePreSubmit} className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-left">Nominal Top Up</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#136f42] font-bold">Rp</span>
                            <Input
                                type="text"
                                placeholder="0"
                                className="pl-12 text-lg font-bold focus:ring-2 focus:ring-[#136f42] border-green-200 bg-green-50/30"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 text-left">Upload Bukti Transfer</label>
                            <span className="text-[9px] font-bold text-[#136f42] bg-green-50 px-2 py-0.5 rounded-full">Auto-Compress 1MB</span>
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${previewUrl ? 'border-[#136f42] bg-green-50' : 'border-green-200 hover:bg-green-50'}`}>
                            {previewUrl ? (
                                <img src={previewUrl} className="h-40 mx-auto rounded-lg object-contain shadow-md" alt="Preview" />
                            ) : (
                                <div className="text-center text-gray-400 py-2">
                                    <UploadCloud size={24} className="mx-auto mb-3 text-[#136f42]" />
                                    <p className="text-sm font-bold text-gray-600">Upload foto / screenshot</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#136f42] py-6 text-lg rounded-xl font-bold tracking-wider">
                        <Wallet className="mr-2" size={20} /> konfirmasi top up
                    </Button>
                </form>
            </div>

            {/* MODAL QRIS */}
            {isQrModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative animate-in zoom-in-95">
                        <button onClick={() => setIsQrModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        <div className="text-center space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Scan QRIS</h2>
                                <p className="text-xs text-slate-400 font-medium">an. Top Up Saldo TaPro</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-200">
                                <img src="/src/assets/qris-tapro.png" alt="QRIS KKJ" className="w-full aspect-square object-contain rounded-xl" />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed italic px-4">silakan screenshot dan scan menggunakan aplikasi bank atau dompet digital anda.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PIN */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 border border-white/20 text-center">

                        {/* 🔥 TAMPILAN JIKA PIN BELUM DIATUR */}
                        {isPinNotSet ? (
                            <div className="py-4 space-y-6">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
                                    <ShieldAlert size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-800">PIN Belum Diatur</h3>
                                    <p className="text-[11px] text-slate-400 font-medium px-4 leading-relaxed">
                                        segera atur pin untuk mengaktifkan fitur transfer dan penarikan saldo.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigate('/profile')}
                                    className="w-full bg-amber-500 hover:bg-amber-600 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-lg"
                                >
                                    Atur PIN Sekarang
                                </Button>
                            </div>
                        ) : isPinSuccess ? (
                            <div className="py-4"><CheckCircle size={48} className="mx-auto text-[#136f42] mb-4" /><h3 className="text-lg font-black text-slate-800">PIN Benar</h3></div>
                        ) : isPinError ? (
                            <div className="py-4"><AlertCircle size={48} className="mx-auto text-rose-600 mb-4 animate-bounce" /><h3 className="text-lg font-black text-rose-600">PIN Salah!</h3></div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3"><Lock size={20} className="text-[#136f42]" /><h2 className="text-lg font-black text-slate-800">Verifikasi Pin</h2></div>
                                    <button onClick={() => setIsPinModalOpen(false)}><X size={20} /></button>
                                </div>

                                <div className="relative group">
                                    <input
                                        type={showPin ? "text" : "password"}
                                        maxLength={6}
                                        placeholder="******"
                                        inputMode="numeric"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all text-center text-slate-800 shadow-inner"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2 transition-colors"
                                    >
                                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                <Button
                                    onClick={handleFinalSubmit}
                                    isLoading={isLoading}
                                    disabled={pin.length < 6}
                                    className="w-full bg-[#136f42] py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    konfirmasi & kirim
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => { setIsSuccessModalOpen(false); navigate('/transaksi/riwayat'); }}
                title="Top Up Berhasil Diajukan!"
                message="pengajuan anda sedang diproses. saldo akan bertambah otomatis setelah admin melakukan verifikasi."
            />
        </div>
    );
};