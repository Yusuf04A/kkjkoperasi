import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { PinModal } from '../../components/PinModal'; // Pastikan path benar

export const Withdraw = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [bankInfo, setBankInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(0);

    // STATE MODAL PIN
    const [showPinModal, setShowPinModal] = useState(false);

    useEffect(() => {
        if (user) {
            setCurrentBalance(user.tapro_balance || 0);
        }
    }, [user]);

    // --- EXECUTE WITHDRAW (Dipanggil setelah PIN Sukses) ---
    const executeWithdraw = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Mengajukan penarikan...');
        const nominal = parseInt(amount.replace(/\D/g, ''));

        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user?.id,
                type: 'withdraw',
                amount: nominal,
                status: 'pending',
                description: `Penarikan ke: ${bankInfo}`,
                proof_url: null
            });

            if (error) throw error;

            toast.success('Pengajuan berhasil dikirim!', { id: toastId });
            navigate('/transaksi/riwayat');
        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // --- HANDLE CLICK (Validasi & Buka Modal) ---
    const handleWithdrawClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\D/g, ''));

        // 1. Validasi
        if (!nominal || nominal < 50000) {
            toast.error('Minimal penarikan Rp 50.000');
            return;
        }
        if (nominal > currentBalance) {
            toast.error('Saldo tidak mencukupi!');
            return;
        }
        if (!bankInfo.trim()) {
            toast.error('Info rekening tujuan wajib diisi!');
            return;
        }

        // 2. Buka Modal PIN
        setShowPinModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-blue-200">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-blue-100 transition"
                    >
                        <ArrowLeft size={20} className="text-blue-900" />
                    </button>

                    <h1 className="text-base font-semibold text-blue-900">
                        Tarik Tunai
                    </h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">

                {/* SALDO CARD */}
                <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6 text-white shadow-xl shadow-blue-300">
                    <p className="text-sm opacity-90 mb-1">
                        Saldo Bisa Ditarik
                    </p>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                        {formatRupiah(currentBalance)}
                    </h2>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleWithdrawClick} // Ganti handler
                    className="bg-white rounded-3xl border border-blue-200 shadow-md p-6 space-y-6"
                >

                    {/* NOMINAL */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-blue-900">
                            Nominal Penarikan
                        </label>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-blue-700">
                                Rp
                            </span>
                            <Input
                                type="number"
                                placeholder="0"
                                className="pl-12 h-14 text-lg font-bold border-blue-300 focus:border-blue-700 focus:ring-blue-700"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-blue-600">
                                Minimal Rp 50.000
                            </span>
                            {parseInt(amount) > currentBalance && (
                                <span className="text-red-600 font-semibold">
                                    Saldo tidak mencukupi
                                </span>
                            )}
                        </div>
                    </div>

                    {/* REKENING */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-blue-900">
                            Rekening Tujuan
                        </label>

                        <div className="relative">
                            <CreditCard
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Contoh: BCA 12345678 a.n Rizki"
                                className="pl-12 h-14 border-blue-300 focus:border-blue-700 focus:ring-blue-700"
                                value={bankInfo}
                                onChange={(e) => setBankInfo(e.target.value)}
                                required
                            />
                        </div>

                        <p className="text-xs text-blue-600">
                            Pastikan nama pemilik rekening sesuai dengan akun
                        </p>
                    </div>

                    {/* SUBMIT */}
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading || (parseInt(amount) > currentBalance)}
                        className="w-full h-14 text-base font-bold rounded-2xl bg-blue-900 hover:bg-blue-800 shadow-lg shadow-blue-300"
                    >
                        <Banknote className="mr-2" />
                        Ajukan Penarikan
                    </Button>
                </form>

                {/* INFO */}
                <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p>
                        Penarikan akan diproses Admin dalam waktu
                        <b> 1×24 jam kerja</b>. Pastikan data rekening benar.
                    </p>
                </div>

            </div>

            {/* MODAL PIN */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={executeWithdraw}
                title="Konfirmasi Penarikan"
            />
        </div>
    );
};