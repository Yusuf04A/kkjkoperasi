import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UploadCloud, Copy, CheckCircle, Wallet, Lock, Eye, EyeOff, X } from 'lucide-react';
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

    // --- STATE SUCCESS MODAL ---
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const bankAccounts = [
        { name: 'BCA', number: '1234567890', holder: 'KOPERASI KKJ PUSAT' },
        { name: 'MANDIRI', number: '0987654321', holder: 'KOPERASI KKJ PUSAT' },
    ];

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

    // --- 🔥 FUNGSI UPLOAD DENGAN KOMPRESI OTOMATIS 🔥 ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            const toastId = toast.loading('Mengompres gambar...');
            try {
                // Konfigurasi kompresi
                const options = {
                    maxSizeMB: 1,           // Ukuran maksimal 1MB
                    maxWidthOrHeight: 1024, // Resolusi maksimal 1024px
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(file, options);
                setProofFile(compressedFile);
                setPreviewUrl(URL.createObjectURL(compressedFile));
                toast.success('Gambar siap diunggah!', { id: toastId });
            } catch (error) {
                toast.error('Gagal mengompres gambar', { id: toastId });
                // Fallback jika gagal kompres, gunakan file asli
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
        if (pin !== user?.pin) return toast.error("PIN Transaksi Salah!");

        setIsLoading(true);
        const toastId = toast.loading('Mengirim data transaksi...');

        try {
            const fileExt = proofFile?.name.split('.').pop() || 'jpg';
            const fileName = `topup-${user?.id}-${Date.now()}.${fileExt}`;

            // Upload file yang sudah dikompres
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

            toast.dismiss(toastId);
            setIsPinModalOpen(false);
            setIsSuccessModalOpen(true); 

        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition">
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 leading-none">Isi Saldo (Top Up)</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8">
                {/* INFO REKENING */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#136f42] uppercase tracking-wider pl-1">Transfer ke Rekening</h2>
                    {bankAccounts.map((bank, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex justify-between items-center group hover:border-[#136f42] transition-colors">
                            <div>
                                <p className="text-[10px] font-black text-[#136f42] bg-green-50 w-fit px-2 py-1 rounded mb-1 uppercase tracking-wide">{bank.name}</p>
                                <p className="font-mono text-lg font-bold text-gray-900 tracking-tight">{bank.number}</p>
                                <p className="text-xs text-gray-400 mt-1 font-medium">a.n {bank.holder}</p>
                            </div>
                            <button onClick={() => handleCopy(bank.number)} className="p-2 text-gray-400 hover:text-[#136f42] hover:bg-green-50 rounded-xl transition-all active:scale-95"><Copy size={20} /></button>
                        </div>
                    ))}
                </div>

                {/* FORM */}
                <form onSubmit={handlePreSubmit} className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Top Up</label>
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
                        <p className="text-xs text-gray-400 mt-2 font-medium">*Minimal transfer Rp 10.000</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bukti Transfer (Otomatis Kompres)</label>
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${previewUrl ? 'border-[#136f42] bg-green-50' : 'border-green-200 hover:bg-green-50 hover:border-[#136f42]'}`}>
                            {previewUrl ? (
                                <div className="relative">
                                    <img src={previewUrl} className="h-40 mx-auto rounded-lg object-contain shadow-md" alt="Preview Bukti" />
                                    <p className="text-center text-xs text-[#136f42] font-bold mt-2 lowercase">Klik untuk ganti gambar</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} className="text-[#136f42]" /></div>
                                    <p className="text-sm font-bold text-gray-600">Upload Foto / Screenshot</p>
                                    <p className="text-[10px] mt-1 uppercase font-bold tracking-tighter text-slate-300">Ukuran akan dikompres otomatis</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-6 text-lg rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                        <Wallet className="mr-2" size={20} /> Konfirmasi Top Up
                    </Button>
                </form>

                <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-[#136f42] text-sm shadow-sm">
                    <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle size={18} /> Informasi Penting</p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs font-medium opacity-90 ml-1 leading-relaxed">
                        <li>Admin memverifikasi maksimal 1x24 jam kerja.</li>
                        <li>Pastikan nominal transfer sesuai dengan yang diinput.</li>
                    </ul>
                </div>
            </div>

            {/* --- MODAL PIN --- */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 border border-white/20">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-sm"><Lock size={20}/></div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Verifikasi PIN</h2>
                            </div>
                            <button onClick={() => setIsPinModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 font-medium leading-relaxed px-1">Masukkan 6 digit PIN transaksi Anda untuk mengonfirmasi pengajuan Top Up ini.</p>
                            
                            <div className="relative group">
                                <input
                                    type={showPin ? "text" : "password"} 
                                    maxLength={6}
                                    placeholder="******"
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
                                className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-900/20 active:scale-95"
                            >
                                Konfirmasi & Kirim
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 SUCCESS MODAL POPUP 🔥 */}
            <SuccessModal 
                isOpen={isSuccessModalOpen}
                onClose={() => {
                    setIsSuccessModalOpen(false);
                    navigate('/transaksi/riwayat');
                }}
                title="Top Up Berhasil Diajukan!"
                message="Pengajuan Anda sedang diproses. Saldo akan bertambah otomatis setelah admin melakukan verifikasi dalam maksimal 1x24 jam."
            />
        </div>
    );
};