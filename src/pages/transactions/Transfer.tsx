import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Phone, Send, Search, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const Transfer = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Fungsi Cek Nama Penerima (Biar user yakin mau kirim ke siapa)
    const checkRecipient = async () => {
        if (phone.length < 10) return;
        setIsChecking(true);

        // Cari user berdasarkan no hp
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('phone', phone)
            .single();

        if (data) {
            setRecipientName(data.full_name);
            toast.success(`Penerima ditemukan: ${data.full_name}`);
        } else {
            setRecipientName(null);
            toast.error('Nomor belum terdaftar di aplikasi.');
        }
        setIsChecking(false);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\D/g, ''));

        if (!recipientName) {
            toast.error('Pastikan nomor tujuan benar (Cek dulu).');
            return;
        }

        const confirm = window.confirm(`Yakin kirim Rp ${formatRupiah(nominal)} ke ${recipientName}?`);
        if (!confirm) return;

        setIsLoading(true);
        const toastId = toast.loading('Memproses transfer...');

        try {
            // Panggil fungsi SQL yang kita buat tadi
            const { error } = await supabase.rpc('transfer_balance', {
                recipient_phone: phone,
                amount: nominal
            });

            if (error) throw error;

            toast.success('Transfer Berhasil!', { id: toastId });
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
                <h1 className="text-lg font-bold text-gray-900">Kirim Saldo</h1>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">

                {/* Info Saldo */}
                <div className="bg-kkj-blue p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <p className="text-sm opacity-90 mb-1">Saldo Anda</p>
                    <h2 className="text-3xl font-bold">{formatRupiah(user?.tapro_balance || 0)}</h2>
                </div>

                <form onSubmit={handleTransfer} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">

                    {/* Input No WA */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nomor WhatsApp Tujuan</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <Input
                                    type="text"
                                    placeholder="08xxxxxxxxxx"
                                    className="pl-12"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setRecipientName(null); // Reset nama kalau no hp berubah
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={checkRecipient}
                                disabled={isChecking || phone.length < 10}
                                className="bg-blue-50 text-kkj-blue p-3 rounded-xl border border-blue-100 hover:bg-blue-100 disabled:opacity-50"
                            >
                                {isChecking ? <div className="animate-spin w-5 h-5 border-2 border-kkj-blue border-t-transparent rounded-full"></div> : <Search size={20} />}
                            </button>
                        </div>

                        {/* Hasil Cek Penerima */}
                        {recipientName && (
                            <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-green-100 animate-in slide-in-from-top-2">
                                <UserCheck size={18} />
                                Penerima: {recipientName}
                            </div>
                        )}
                    </div>

                    {/* Input Nominal */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nominal Transfer</label>
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
                        <p className="text-xs text-gray-400 mt-1">Minimal Rp 10.000</p>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={!recipientName || isLoading} // Gabisa kirim kalau belum cek nama
                        className="w-full bg-kkj-blue py-6 text-lg rounded-xl shadow-lg shadow-blue-900/20"
                    >
                        <Send className="mr-2" /> Kirim Sekarang
                    </Button>

                </form>

            </div>
        </div>
    );
};