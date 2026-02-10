import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const Withdraw = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore(); // checkSession untuk refresh saldo terbaru

    const [amount, setAmount] = useState('');
    const [bankInfo, setBankInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(0);

    // Ambil saldo terbaru saat halaman dibuka
    useEffect(() => {
        if (user) {
            setCurrentBalance(user.tapro_balance || 0);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nominal = parseInt(amount.replace(/\D/g, ''));

        // Validasi Client Side
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

        setIsLoading(true);
        const toastId = toast.loading('Mengajukan penarikan...');

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    type: 'withdraw', // Tipe Withdraw
                    amount: nominal,
                    status: 'pending',
                    description: `Penarikan ke: ${bankInfo}`,
                    proof_url: null // Withdraw tidak butuh upload bukti di awal
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Tarik Tunai</h1>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* Info Saldo */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-200">
                    <p className="text-sm opacity-90 mb-1">Saldo Bisa Ditarik</p>
                    <h2 className="text-3xl font-bold">{formatRupiah(currentBalance)}</h2>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">

                    {/* Input Nominal */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Penarikan</label>
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
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-gray-400">Minimal Rp 50.000</p>
                            {parseInt(amount) > currentBalance && (
                                <p className="text-xs text-red-500 font-bold">Saldo kurang!</p>
                            )}
                        </div>
                    </div>

                    {/* Input Rekening Tujuan */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Rekening Tujuan</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <Input
                                type="text"
                                placeholder="Contoh: BCA 12345678 a.n Rizki"
                                className="pl-12"
                                value={bankInfo}
                                onChange={(e) => setBankInfo(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Pastikan nama pemilik rekening sama dengan akun.</p>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading || (parseInt(amount) > currentBalance)}
                        className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg rounded-xl shadow-lg shadow-orange-100"
                    >
                        <Banknote className="mr-2" /> Ajukan Penarikan
                    </Button>

                </form>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm flex gap-3 items-start">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p>Penarikan akan diproses Admin dalam waktu 1x24 jam kerja. Pastikan data rekening benar.</p>
                </div>

            </div>
        </div>
    );
};