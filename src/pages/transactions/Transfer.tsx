import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Phone, Send, Search, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { PinModal } from '../../components/PinModal';

export const Transfer = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // --- FUNGSI FORMAT RUPIAH OTOMATIS ---
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Ambil angka saja
        if (rawValue) {
            const formattedValue = parseInt(rawValue).toLocaleString('id-ID');
            setAmount(formattedValue);
        } else {
            setAmount('');
        }
    };

    const checkRecipient = async () => {
        if (phone.length < 10) return;
        setIsChecking(true);

        const { data } = await supabase
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

    const executeTransfer = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Memproses transfer...');
        
        // Bersihkan titik sebelum kirim ke RPC/Database
        const nominal = parseInt(amount.replace(/\./g, ''));

        try {
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
            setShowPinModal(false);
        }
    };

    const handleTransferClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\./g, ''));

        if (!recipientName) {
            toast.error('Pastikan nomor tujuan benar.');
            return;
        }
        if (!nominal || nominal < 10000) {
            toast.error('Minimal transfer Rp 10.000');
            return;
        }
        if (nominal > (user?.tapro_balance || 0)) {
            toast.error('Saldo tidak mencukupi.');
            return;
        }

        setShowPinModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-blue-200">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-blue-50 transition">
                        <ArrowLeft size={20} className="text-blue-900" />
                    </button>
                    <h1 className="text-base font-semibold text-blue-900">Kirim Saldo</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-8">
                {/* INFO SALDO */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Saldo Anda</p>
                    <h2 className="text-3xl font-bold">
                        {formatRupiah(user?.tapro_balance || 0)}
                    </h2>
                </div>

                {/* FORM */}
                <form onSubmit={handleTransferClick} className="bg-white p-6 rounded-2xl border border-blue-200 space-y-6">
                    {/* NOMOR TUJUAN */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Nomor WhatsApp Tujuan</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <Input
                                    type="text"
                                    placeholder="08xxxxxxxxxx"
                                    className="pl-12 focus:ring-2 focus:ring-blue-900"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setRecipientName(null);
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={checkRecipient}
                                disabled={isChecking || phone.length < 10}
                                className="bg-blue-50 text-blue-900 p-3 rounded-xl border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                            >
                                {isChecking ? <div className="animate-spin w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full" /> : <Search size={20} />}
                            </button>
                        </div>
                        {recipientName && (
                            <div className="mt-3 bg-blue-50 text-blue-900 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border border-blue-200">
                                <UserCheck size={18} /> Penerima: {recipientName}
                            </div>
                        )}
                    </div>

                    {/* NOMINAL DENGAN FORMAT TITIK */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Nominal Transfer</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">Rp</span>
                            <Input
                                type="text"
                                placeholder="0"
                                className="pl-12 text-lg font-bold focus:ring-2 focus:ring-blue-900"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Minimal Rp 10.000</p>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={!recipientName || isLoading}
                        className="w-full bg-blue-900 hover:bg-blue-800 py-6 text-lg rounded-xl shadow-lg shadow-blue-900/20"
                    >
                        <Send className="mr-2" /> Kirim Sekarang
                    </Button>
                </form>
            </div>

            {/* MODAL PIN */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={executeTransfer}
                title="Konfirmasi Transfer"
            />
        </div>
    );
};