import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UploadCloud, Copy, CheckCircle, Wallet, Lock, Eye, EyeOff, X, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal'; 
// 🔥 IMPORT LIBRARY KOMPRESI
import imageCompression from 'browser-image-compression'; 

export const TopUp = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // --- STATE PIN ---
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [isPinSuccess, setIsPinSuccess] = useState(false); 
    const [isPinError, setIsPinError] = useState(false); // 🔥 State untuk popup gagal merah di tengah

    // --- STATE SUCCESS MODAL ---
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const bankAccounts = [
        { name: 'BCA', number: '1234567890', holder: 'KOPERASI KKJ PUSAT' },
        { name: 'MANDIRI', number: '0987654321', holder: 'KOPERASI KKJ PUSAT' },
    ];

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

    // Reset state PIN saat modal ditutup/buka
    useEffect(() => {
        if (!isPinModalOpen) {
            setPin('');
            setShowPin(false);
            setIsPinSuccess(false);
            setIsPinError(false);
        }
    }, [isPinModalOpen]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); 
        if (rawValue) {
            const formattedValue = parseInt(rawValue).toLocaleString('id-ID');
            setAmount(formattedValue);
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
            
            // Validasi ukuran sebelum kompresi (Opsional, misal max 10MB sebelum kompres)
            if (file.size > 10 * 1024 * 1024) {
                return toast.error('Ukuran file terlalu besar (maksimal 10MB)');
            }

            const toastId = toast.loading('Mengompres gambar...');
            try {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
                const compressedFile = await imageCompression(file, options);
                setProofFile(compressedFile);
                setPreviewUrl(URL.createObjectURL(compressedFile));
                toast.success('Gambar siap diunggah!', { id: toastId });
            } catch (error) {
                toast.error('Gagal mengompres gambar', { id: toastId });
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
        const userPin = (user as any)?.pin;

        if (pin !== userPin) {
            playSuccessSound(); 
            setIsPinError(true);
            setTimeout(() => {
                setIsPinError(false);
                setPin('');
            }, 1500);
            return;
        }

        playSuccessSound();
        setIsPinSuccess(true);
        setIsLoading(true);

        const toastId = toast.loading('Mengirim data transaksi...');

        try {
            const fileExt = proofFile?.name.split('.').pop() || 'jpg';
            const fileName = `topup-${user?.id}-${Date.now()}.${fileExt}`;

            if (proofFile) {
                await supabase.storage.from('transaction-proofs').upload(fileName, proofFile);
            }

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
                toast.dismiss(toastId);
                setIsPinModalOpen(false);
                setIsSuccessModalOpen(true); 
            }, 1500);

        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
            setIsLoading(false);
            setIsPinSuccess(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900 text-left lowercase">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition shrink-0 uppercase">
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 leading-none first-letter:uppercase">isi saldo (top up)</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8">
                {/* INFO REKENING */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#136f42] uppercase tracking-wider pl-1">transfer ke rekening</h2>
                    {bankAccounts.map((bank, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex justify-between items-center group hover:border-[#136f42] transition-colors">
                            <div>
                                <p className="text-[10px] font-black text-[#136f42] bg-green-50 w-fit px-2 py-1 rounded mb-1 uppercase tracking-wide">{bank.name}</p>
                                <p className="font-mono text-lg font-bold text-gray-900 tracking-tight">{bank.number}</p>
                                <p className="text-xs text-gray-400 mt-1 font-medium lowercase">a.n {bank.holder}</p>
                            </div>
                            <button onClick={() => handleCopy(bank.number)} className="p-2 text-gray-400 hover:text-[#136f42] hover:bg-green-50 rounded-xl transition-all active:scale-95 uppercase"><Copy size={20} /></button>
                        </div>
                    ))}
                </div>

                {/* FORM */}
                <form onSubmit={handlePreSubmit} className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 first-letter:uppercase">nominal top up</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#136f42] font-bold uppercase">rp</span>
                            <Input
                                type="text"
                                placeholder="0"
                                className="pl-12 text-lg font-bold focus:ring-2 focus:ring-[#136f42] border-green-200 bg-green-50/30"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium lowercase">*minimal transfer rp 10.000</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 first-letter:uppercase">bukti transfer</label>
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-tight">Maks 10MB</span>
                        </div>
                        
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${previewUrl ? 'border-[#136f42] bg-green-50' : 'border-green-200 hover:bg-green-50 hover:border-[#136f42]'}`}>
                            {previewUrl ? (
                                <div className="relative">
                                    <img src={previewUrl} className="h-40 mx-auto rounded-lg object-contain shadow-md" alt="Preview Bukti" />
                                    <p className="text-center text-xs text-[#136f42] font-bold mt-2 lowercase">klik untuk ganti gambar</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} className="text-[#136f42]" /></div>
                                    <p className="text-sm font-bold text-gray-600 first-letter:uppercase">upload foto / screenshot</p>
                                    <div className="mt-2 flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center justify-center gap-1">
                                            <Info size={10} /> format: jpg, png, webp
                                        </p>
                                        <p className="text-[10px] font-black text-[#136f42] uppercase tracking-tighter">ukuran akan dikompres otomatis ke 1MB</p>
                                    </div>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-6 text-lg rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all uppercase">
                        <Wallet className="mr-2" size={20} /> konfirmasi top up
                    </Button>
                </form>

                <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-[#136f42] text-sm shadow-sm lowercase">
                    <p className="font-bold flex items-center gap-2 mb-2 first-letter:uppercase"><CheckCircle size={18} /> informasi penting</p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs font-medium opacity-90 ml-1 leading-relaxed">
                        <li>admin memverifikasi maksimal 1x24 jam kerja.</li>
                        <li>pastikan nominal transfer sesuai dengan yang diinput.</li>
                        <li>file bukti transfer akan dikompres otomatis untuk menghemat kuota anda.</li>
                    </ul>
                </div>
            </div>

            {/* --- MODAL PIN --- */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 border border-white/20 text-center">
                        
                        {isPinSuccess ? (
                            <div className="py-4 animate-in fade-in">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#136f42] shadow-inner animate-in zoom-in duration-500">
                                    <CheckCircle size={48} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">pin benar</h3>
                                <p className="text-xs text-slate-400 font-medium lowercase">memproses pengajuan anda...</p>
                            </div>
                        ) : isPinError ? (
                            <div className="py-4 animate-in fade-in">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner animate-bounce">
                                    <AlertCircle size={48} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-black text-rose-600 uppercase tracking-tight mb-1">pin salah!</h3>
                                <p className="text-xs text-slate-400 font-medium lowercase">silakan masukkan pin yang benar.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-left uppercase">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-sm"><Lock size={20}/></div>
                                        <h2 className="text-lg font-black text-slate-800 tracking-tight">verifikasi pin</h2>
                                    </div>
                                    <button onClick={() => setIsPinModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors uppercase"><X size={20}/></button>
                                </div>

                                <div className="space-y-4 text-left lowercase">
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed px-1">masukkan 6 digit pin transaksi anda untuk mengonfirmasi pengajuan top up ini.</p>
                                    
                                    <div className="relative group text-left">
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
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2 transition-colors uppercase"
                                        >
                                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleFinalSubmit}
                                        isLoading={isLoading}
                                        disabled={pin.length < 6}
                                        className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-900/20 active:scale-95"
                                    >
                                        konfirmasi & kirim
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL POPUP */}
            <SuccessModal 
                isOpen={isSuccessModalOpen}
                onClose={() => {
                    setIsSuccessModalOpen(false);
                    navigate('/transaksi/riwayat');
                }}
                title="Top Up Berhasil Diajukan!"
                message="pengajuan anda sedang diproses. saldo akan bertambah otomatis setelah admin melakukan verifikasi dalam maksimal 1x24 jam."
            />
        </div>
    );
};