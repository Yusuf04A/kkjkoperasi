import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UploadCloud, Copy, CheckCircle, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export const TopUp = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const bankAccounts = [
        { name: 'BCA', number: '1234567890', holder: 'KOPERASI KKJ PUSAT' },
        { name: 'MANDIRI', number: '0987654321', holder: 'KOPERASI KKJ PUSAT' },
    ];

    // --- FUNGSI FORMAT RUPIAH (OTOMATIS TITIK) ---
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Hapus semua selain angka
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Bersihkan titik sebelum kirim ke database
        const nominal = parseInt(amount.replace(/\./g, ''));
        
        if (!nominal || nominal < 10000) {
            toast.error('Minimal Top Up Rp 10.000');
            return;
        }
        if (!proofFile) {
            toast.error('Wajib upload bukti transfer!');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Mengirim data transaksi...');

        try {
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `topup-${user?.id}-${Date.now()}.${fileExt}`;

            await supabase.storage
                .from('transaction-proofs')
                .upload(fileName, proofFile);

            const { data: { publicUrl } } = supabase.storage
                .from('transaction-proofs')
                .getPublicUrl(fileName);

            await supabase.from('transactions').insert({
                user_id: user?.id,
                type: 'topup',
                amount: nominal,
                status: 'pending',
                description: 'Top Up Saldo Tapro',
                proof_url: publicUrl
            });

            toast.success('Top Up Berhasil Diajukan!', { id: toastId });
            navigate('/transaksi/riwayat');

        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-green-50 rounded-full transition"
                    >
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">
                        Isi Saldo (Top Up)
                    </h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8">

                {/* INFO REKENING */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#136f42] uppercase tracking-wider pl-1">
                        Transfer ke Rekening
                    </h2>

                    {bankAccounts.map((bank, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex justify-between items-center group hover:border-[#136f42] transition-colors"
                        >
                            <div>
                                <p className="text-[10px] font-black text-[#136f42] bg-green-50 w-fit px-2 py-1 rounded mb-1 uppercase tracking-wide">
                                    {bank.name}
                                </p>
                                <p className="font-mono text-lg font-bold text-gray-900 tracking-tight">
                                    {bank.number}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                    a.n {bank.holder}
                                </p>
                            </div>

                            <button
                                onClick={() => handleCopy(bank.number)}
                                className="p-2 text-gray-400 hover:text-[#136f42] hover:bg-green-50 rounded-xl transition-all active:scale-95"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-6"
                >
                    {/* NOMINAL DENGAN FORMAT TITIK */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Nominal Top Up
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#136f42] font-bold">
                                Rp
                            </span>
                            <Input
                                type="text"
                                placeholder="0"
                                className="pl-12 text-lg font-bold focus:ring-2 focus:ring-[#136f42] border-green-200 bg-green-50/30"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            *Minimal transfer Rp 10.000
                        </p>
                    </div>

                    {/* UPLOAD */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Bukti Transfer
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
                            ${previewUrl
                                ? 'border-[#136f42] bg-green-50'
                                : 'border-green-200 hover:bg-green-50 hover:border-[#136f42]'
                            }`}
                        >
                            {previewUrl ? (
                                <div className="relative">
                                    <img src={previewUrl} className="h-40 mx-auto rounded-lg object-contain shadow-md" />
                                    <p className="text-center text-xs text-[#136f42] font-bold mt-2">Klik untuk ganti gambar</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <UploadCloud size={24} className="text-[#136f42]" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-600">
                                        Upload Foto / Screenshot
                                    </p>
                                    <p className="text-xs mt-1">JPG / PNG (Max 2MB)</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* BUTTON */}
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-6 text-lg rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                    >
                        <Wallet className="mr-2" size={20} /> Konfirmasi Top Up
                    </Button>
                </form>

                {/* INFO */}
                <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-[#136f42] text-sm shadow-sm">
                    <p className="font-bold flex items-center gap-2 mb-2">
                        <CheckCircle size={18} />
                        Informasi Penting
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs font-medium opacity-90 ml-1">
                        <li>Admin memverifikasi maksimal 1x24 jam kerja.</li>
                        <li>Pastikan nominal transfer sesuai hingga 3 digit terakhir.</li>
                        <li>Simpan bukti transfer jika sewaktu-waktu dibutuhkan.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
};