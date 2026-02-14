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
        <div className="min-h-screen bg-gray-50 pb-24">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-blue-200">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-blue-50 rounded-full transition"
                    >
                        <ArrowLeft size={20} className="text-blue-900" />
                    </button>
                    <h1 className="text-base font-semibold text-blue-900">
                        Isi Saldo (Top Up)
                    </h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8">

                {/* INFO REKENING */}
                <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        Transfer ke Rekening
                    </h2>

                    {bankAccounts.map((bank, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex justify-between items-center"
                        >
                            <div>
                                <p className="text-xs font-bold text-blue-900 bg-blue-100 w-fit px-2 py-0.5 rounded mb-1">
                                    {bank.name}
                                </p>
                                <p className="font-mono text-lg font-bold text-gray-900">
                                    {bank.number}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    a.n {bank.holder}
                                </p>
                            </div>

                            <button
                                onClick={() => handleCopy(bank.number)}
                                className="p-2 text-gray-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl border border-blue-200 space-y-6"
                >
                    {/* NOMINAL DENGAN FORMAT TITIK */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Nominal Top Up
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">
                                Rp
                            </span>
                            <Input
                                type="text"
                                placeholder="0"
                                className="pl-12 text-lg font-bold focus:ring-2 focus:ring-blue-900"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Minimal Rp 10.000
                        </p>
                    </div>

                    {/* UPLOAD */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Bukti Transfer
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 cursor-pointer
                            ${previewUrl
                                ? 'border-blue-900 bg-blue-50'
                                : 'border-blue-200 hover:bg-blue-50'
                            }`}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} className="h-32 mx-auto rounded-lg" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <UploadCloud size={32} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium">
                                        Upload Foto / Screenshot
                                    </p>
                                    <p className="text-xs">JPG / PNG (Max 2MB)</p>
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
                        className="w-full bg-blue-900 hover:bg-blue-800 py-6 text-lg rounded-xl"
                    >
                        <Wallet className="mr-2" /> Konfirmasi Top Up
                    </Button>
                </form>

                {/* INFO */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-900 text-sm">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle size={16} />
                        Informasi
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Admin memverifikasi maksimal 1x24 jam</li>
                        <li>Pastikan nominal transfer sesuai</li>
                        <li>Simpan bukti transfer</li>
                    </ul>
                </div>

            </div>
        </div>
    );
};