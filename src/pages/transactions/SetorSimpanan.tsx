import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah } from '../../lib/utils';
import {
    ArrowLeft, Wallet, CheckCircle, Save,
    PiggyBank, School, Heart, Plane, Gift,
    Loader2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const SetorSimpanan = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();
    const [loading, setLoading] = useState(true); // Tambahkan state loading

    const [selectedSimpanan, setSelectedSimpanan] = useState<any>(null);
    const [amount, setAmount] = useState<string>('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const simpananOptions = [
        { id: 'simwa', name: 'Simpanan Wajib', col: 'simwa_balance', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Kewajiban rutin anggota' },
        { id: 'simpok', name: 'Simpanan Pokok', col: 'simpok_balance', icon: Save, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Simpanan dasar keanggotaan' },
        { id: 'simade', name: 'Masa Depan', col: 'simade_balance', icon: PiggyBank, color: 'text-green-600', bg: 'bg-green-50', desc: 'Tabungan jangka panjang' },
        { id: 'sipena', name: 'Pendidikan', col: 'sipena_balance', icon: School, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Persiapan biaya sekolah' },
        { id: 'sihara', name: 'Hari Raya', col: 'sihara_balance', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Tunjangan hari raya mandiri' },
        { id: 'siqurma', name: 'Qurban', col: 'siqurma_balance', icon: Heart, color: 'text-red-600', bg: 'bg-red-50', desc: 'Tabungan ibadah qurban' },
        { id: 'siuji', name: 'Haji / Umroh', col: 'siuji_balance', icon: Plane, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Simpanan tanah suci' },
        { id: 'siwalima', name: 'Walimah', col: 'siwalima_balance', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Persiapan biaya pernikahan' },
    ];

    useEffect(() => {
        const init = async () => {
            if (!user) await checkSession();
            setLoading(false); // Matikan loading setelah sesi dicek
        };
        init();
    }, []);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
    };

    const handleInitialSubmit = () => {
        const cleanAmount = amount ? parseInt(amount.replace(/\./g, '')) : 0;
        if (!selectedSimpanan) return toast.error("Pilih jenis simpanan tujuan dulu");
        if (cleanAmount < 10000) return toast.error("Minimal setor Rp 10.000");
        if (cleanAmount > (user?.tapro_balance || 0)) return toast.error("Saldo Tapro tidak mencukupi!");
        setShowPinModal(true);
    };

    const executeTransfer = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading("Memproses pemindahan saldo...");
        const cleanAmount = parseInt(amount.replace(/\./g, ''));

        try {
            // Update Saldo (Sequential)
            const { error: errTapro } = await supabase.from('profiles').update({ tapro_balance: (user?.tapro_balance || 0) - cleanAmount }).eq('id', user?.id);
            if (errTapro) throw errTapro;

            const { data: currentProfile } = await supabase.from('profiles').select(selectedSimpanan.col).eq('id', user?.id).single();
            const currentDestBalance = currentProfile ? currentProfile[selectedSimpanan.col] : 0;

            const { error: errDest } = await supabase.from('profiles').update({ [selectedSimpanan.col]: (Number(currentDestBalance) || 0) + cleanAmount }).eq('id', user?.id);
            if (errDest) throw errDest;

            await supabase.from('transactions').insert({
                user_id: user?.id, type: 'transfer_out', amount: cleanAmount, status: 'success', description: `Setor ke ${selectedSimpanan.name}`
            });

            toast.success("Saldo berhasil dipindahkan!", { id: toastId });
            setAmount('');
            setSelectedSimpanan(null);
            await checkSession();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
                    <h1 className="text-base font-bold text-gray-900">Setor Simpanan</h1>
                </div>
            </div>
            <div className="max-w-xl mx-auto p-4 space-y-6">
                {/* SUMBER DANA */}
                <div className="bg-[#0B2B4B] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Sumber Dana</p>
                        <div className="flex items-center gap-2 mb-2"><Wallet size={18} className="text-blue-300" /><span className="font-bold">Saldo TAPRO</span></div>
                        <h2 className="text-3xl font-bold font-mono tracking-tight">{user ? formatRupiah(user.tapro_balance) : 'Rp 0'}</h2>
                        <p className="text-xs text-blue-300 mt-2">*Saldo ini akan digunakan untuk membayar simpanan.</p>
                    </div>
                </div>
                {/* PILIH TUJUAN */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Pilih Tujuan Simpanan</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {simpananOptions.map((item) => (
                            <button key={item.id} onClick={() => setSelectedSimpanan(item)} className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${selectedSimpanan?.id === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.bg} ${item.color}`}><item.icon size={20} /></div>
                                <h4 className={`font-bold text-sm mb-1 ${selectedSimpanan?.id === item.id ? 'text-blue-800' : 'text-gray-900'}`}>{item.name}</h4>
                                <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{item.desc}</p>
                                {selectedSimpanan?.id === item.id && <div className="absolute top-2 right-2 text-blue-600"><CheckCircle size={16} fill="currentColor" className="text-white" /></div>}
                            </button>
                        ))}
                    </div>
                </div>
                {/* INPUT NOMINAL */}
                {selectedSimpanan && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4"><span className="text-sm font-bold text-gray-500">Nominal Setoran</span><span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Ke: {selectedSimpanan.name}</span></div>
                        <div className="relative group mb-6">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-blue-600 transition-colors">Rp</span>
                            <input type="text" value={amount} onChange={handleAmountChange} placeholder="0" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-2xl text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-300" autoFocus />
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg flex gap-3 items-start border border-yellow-100 mb-6"><AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" /><p className="text-xs text-yellow-800 leading-relaxed">Pastikan pilihan simpanan sudah benar. Saldo Tapro akan langsung terpotong setelah konfirmasi PIN.</p></div>
                        <button onClick={handleInitialSubmit} disabled={isSubmitting} className="w-full bg-[#0B2B4B] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" /> : "Lanjut Konfirmasi"}</button>
                    </div>
                )}
            </div>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={executeTransfer} title="Konfirmasi Setoran" />
        </div>
    );
};