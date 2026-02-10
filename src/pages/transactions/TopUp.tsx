import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UploadCloud, Copy, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export const TopUp = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Data Rekening Statis (Nanti bisa diganti)
    const bankAccounts = [
        { name: 'BCA', number: '1234567890', holder: 'KOPERASI KKJ PUSAT' },
        { name: 'MANDIRI', number: '0987654321', holder: 'KOPERASI KKJ PUSAT' },
    ];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Nomor rekening disalin!');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Buat preview gambar
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi Input
        const nominal = parseInt(amount.replace(/\D/g, '')); // Hapus titik/koma
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
            // 1. Upload Bukti ke Storage 'transaction-proofs'
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `topup-${user?.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('transaction-proofs')
                .upload(fileName, proofFile);

            if (uploadError) throw uploadError;

            // 2. Ambil URL Bukti
            const { data: { publicUrl } } = supabase.storage
                .from('transaction-proofs')
                .getPublicUrl(fileName);

            // 3. Simpan ke Tabel Transactions
            const { error: insertError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    type: 'topup',
                    amount: nominal,
                    status: 'pending', // Wajib pending dulu
                    description: 'Top Up Saldo Tapro',
                    proof_url: publicUrl
                });

            if (insertError) throw insertError;

            toast.success('Top Up Berhasil Diajukan!', { id: toastId });
            navigate('/transaksi/riwayat'); // Arahkan ke riwayat (nanti kita buat)

        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Isi Saldo (Top Up)</h1>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* Info Rekening */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Transfer Ke Rekening</h2>
                    {bankAccounts.map((bank, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-kkj-blue bg-blue-50 w-fit px-2 py-0.5 rounded mb-1">{bank.name}</p>
                                <p className="font-mono text-lg font-bold text-gray-800 tracking-wide">{bank.number}</p>
                                <p className="text-xs text-gray-400 mt-1">a.n {bank.holder}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(bank.number)}
                                className="p-2 text-gray-400 hover:text-kkj-blue hover:bg-blue-50 rounded-lg transition-colors"
                                title="Salin Nomor"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">

                    {/* Input Nominal */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Top Up</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">Rp</span>
                            <Input
                                type="number"
                                placeholder="0"
                                className="pl-12 text-lg font-bold"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">Minimal Rp 10.000</p>
                    </div>

                    {/* Upload Bukti */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bukti Transfer</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${previewUrl ? 'border-kkj-blue bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                            {previewUrl ? (
                                <div className="text-center">
                                    <img src={previewUrl} alt="Preview" className="h-32 object-contain mx-auto mb-2 rounded-lg" />
                                    <p className="text-xs text-kkj-blue font-bold">Klik untuk ganti foto</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <UploadCloud size={32} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium">Upload Foto / Screenshot</p>
                                    <p className="text-xs mt-1">JPG, PNG (Max 2MB)</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Tombol Submit */}
                    <Button type="submit" isLoading={isLoading} className="w-full bg-kkj-blue py-6 text-lg rounded-xl shadow-lg shadow-blue-900/20">
                        <Wallet className="mr-2" /> Konfirmasi Top Up
                    </Button>

                </form>

                {/* Instruksi */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm space-y-2">
                    <p className="font-bold flex items-center gap-2"><CheckCircle size={16} /> Penting:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                        <li>Pastikan nominal transfer sesuai hingga 3 digit terakhir.</li>
                        <li>Admin akan memverifikasi dalam waktu maks 1x24 jam.</li>
                        <li>Simpan bukti transfer asli anda.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
};