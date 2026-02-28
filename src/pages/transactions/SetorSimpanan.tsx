import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import { ArrowLeft, Wallet, Loader2, Download, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';
import { SuccessModal } from '../../components/SuccessModal';
import html2canvas from 'html2canvas';

export const SetorSimpanan = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef<HTMLDivElement>(null);

    const [showPinModal, setShowPinModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [depositForm, setDepositForm] = useState({
        simpok: 250000,
        simwa: 50000,
        donasi: 10000,
        simade: 0,
        sipena: 0,
        sihara: 0,
        siqurma: 0,
        siuji: 0,
        siwalima: 0
    });

    const isSimwaLunas = (user?.simwa_balance || 0) >= 1200000;

    useEffect(() => {
        const init = async () => {
            if (!user) await checkSession();
            setLoading(false);
        };
        init();
    }, []);

    const handleInputChange = (name: string, value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0;
        setDepositForm(prev => ({ ...prev, [name]: numValue }));
    };

    const totalSetoran = Object.values(depositForm).reduce((a, b) => a + b, 0);

    const generateDescription = () => {
        const activeItems = Object.entries(depositForm)
            .filter(([_, val]) => val > 0)
            .map(([key, val]) => {
                const label = key.replace('sim', 'Simpanan ').replace('simade', 'Masa Depan');
                return `${label}: ${val.toLocaleString('id-ID')}`;
            });
        return activeItems.join(', ');
    };

    const handleInitialSubmit = () => {
        if (totalSetoran > (user?.tapro_balance || 0)) return toast.error("Saldo Tapro tidak mencukupi!");
        if (depositForm.simwa > 0 && depositForm.simwa % 50000 !== 0) return toast.error("Simpanan Wajib harus kelipatan Rp 50.000");
        if (depositForm.donasi < 10000 && depositForm.donasi > 0) return toast.error("Minimal Donasi Rp 10.000");
        setShowPinModal(true);
    };

    const executeDeposit = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading("Memproses...");
        try {
            const { error: errUpdate } = await supabase.from('profiles').update({
                tapro_balance: (user?.tapro_balance || 0) - totalSetoran,
                simpok_balance: (user?.simpok_balance || 0) + depositForm.simpok,
                simwa_balance: (user?.simwa_balance || 0) + depositForm.simwa,
                simade_balance: (user?.simade_balance || 0) + depositForm.simade,
                sipena_balance: (user?.sipena_balance || 0) + depositForm.sipena,
                sihara_balance: (user?.sihara_balance || 0) + depositForm.sihara,
                siqurma_balance: (user?.siqurma_balance || 0) + depositForm.siqurma,
                siuji_balance: (user?.siuji_balance || 0) + depositForm.siuji,
                siwalima_balance: (user?.siwalima_balance || 0) + depositForm.siwalima,
            }).eq('id', user?.id);

            if (errUpdate) throw errUpdate;

            const { error: errTx } = await supabase.from('transactions').insert({
                user_id: user?.id,
                type: 'topup',
                amount: totalSetoran,
                status: 'success',
                description: `[SETOR SIMPANAN] ${generateDescription()}`,
            });
            if (errTx) console.warn('Catat transaksi gagal:', errTx.message);

            await checkSession();
            toast.dismiss(toastId);
            setShowPinModal(false);
            setTimeout(() => { setShowSuccessModal(true); }, 200);
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;
        const canvas = await html2canvas(receiptRef.current, { scale: 2 });
        const link = document.createElement('a');
        link.download = `STRUK-SETOR-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const formatRpUpper = (amount: number) => formatRupiah(amount).replace('rp', 'RP');

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#136f42]" size={32} /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
            {/* HEADER - MENGIKUTI STYLE DETAIL PINJAMAN */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm px-4 py-5 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"><ArrowLeft size={24} strokeWidth={2.5} /></button>
                <div className="text-left">
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Setor Simpanan Multi</h1>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Layanan Keuangan Anggota</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* KARTU SALDO - MENGIKUTI STYLE TOTAL PINJAMAN */}
                <div className="bg-[#136f42] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden text-left border border-white/10">
                    <div className="relative z-10">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">Saldo Tersedia</p>
                        <h2 className="text-4xl font-black tracking-tight">{formatRpUpper(user?.tapro_balance || 0)}</h2>
                    </div>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10"><Wallet size={120} /></div>
                </div>

                {/* FORM CONTAINER */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 text-left">
                    {/* INPUT UTAMA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Simpanan Pokok</label>
                            <input type="text" value={depositForm.simpok.toLocaleString('id-ID')} onChange={(e) => handleInputChange('simpok', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-bold text-xl text-slate-800 focus:border-[#136f42] focus:bg-white outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Simpanan Wajib</label>
                            <input disabled={isSimwaLunas} type="text" value={isSimwaLunas ? "LUNAS" : depositForm.simwa.toLocaleString('id-ID')} onChange={(e) => handleInputChange('simwa', e.target.value)} className={cn("w-full border-2 rounded-2xl p-5 font-bold text-xl outline-none transition-all", isSimwaLunas ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 border-slate-100 text-slate-800 focus:border-[#136f42] focus:bg-white")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-orange-400 tracking-widest ml-1">Donasi Kebersamaan</label>
                            <input type="text" value={depositForm.donasi.toLocaleString('id-ID')} onChange={(e) => handleInputChange('donasi', e.target.value)} className="w-full bg-orange-50/30 border-2 border-orange-100 rounded-2xl p-5 font-bold text-xl text-orange-700 focus:border-orange-400 focus:bg-white outline-none transition-all" />
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-8">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Simpanan Sukarela Lainnya</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            {[
                                { id: 'simade', label: 'Masa Depan' }, { id: 'sipena', label: 'Pendidikan' },
                                { id: 'sihara', label: 'Hari Raya' }, { id: 'siqurma', label: 'Qurban' },
                                { id: 'siuji', label: 'Haji / Umroh' }, { id: 'siwalima', label: 'Walimah' }
                            ].map((item) => (
                                <div key={item.id} className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">{item.label}</label>
                                    <input type="text" placeholder="Rp 0" value={depositForm[item.id as keyof typeof depositForm] === 0 ? '' : depositForm[item.id as keyof typeof depositForm].toLocaleString('id-ID')} onChange={(e) => handleInputChange(item.id, e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-slate-700 focus:border-[#136f42] outline-none transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TOTAL & SUBMIT */}
                    <div className="pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-8 px-2 font-black uppercase">
                            <span className="text-slate-400 text-sm tracking-widest">Total Setoran</span>
                            <span className="text-3xl text-[#136f42] tracking-tighter">{formatRpUpper(totalSetoran)}</span>
                        </div>
                        <button onClick={handleInitialSubmit} className="w-full bg-[#136f42] text-white py-6 rounded-3xl font-bold text-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Konfirmasi Setoran"}
                        </button>
                    </div>
                </div>
            </div>

            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={executeDeposit} title="Verifikasi Transaksi" />
            <SuccessModal isOpen={showSuccessModal} onClose={() => navigate('/dashboard')} title="Berhasil Disetor!" message={`Setoran sejumlah ${formatRpUpper(totalSetoran)} telah berhasil masuk ke rincian simpanan Anda.`} actionLabel="Unduh Struk" onAction={handleDownloadReceipt} />

            {/* HIDDEN RECEIPT */}
            <div className="fixed -left-[9999px] top-0">
                <div ref={receiptRef} className="w-[500px] p-12 bg-white text-slate-900 font-mono text-base border-8 border-double border-slate-800">
                    <div className="text-center border-b-4 border-dashed border-slate-300 pb-6 mb-8">
                        <h2 className="font-black text-2xl uppercase">Koperasi KKJ</h2>
                        <p className="text-xs uppercase mt-1">Bukti Transaksi (Salinan Sah)</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between uppercase"><span>Anggota :</span> <span className="font-bold">{user?.full_name}</span></div>
                        <div className="flex justify-between uppercase"><span>Tanggal :</span> <span>{new Date().toLocaleString('id-ID')}</span></div>
                        <div className="border-y border-slate-200 py-6 my-6 space-y-2">
                            {Object.entries(depositForm).map(([key, val]) => val > 0 && (
                                <div key={key} className="flex justify-between uppercase text-sm">
                                    <span>{key.replace('sim', 'SIMPANAN ').replace('simade', 'MASA DEPAN')}:</span>
                                    <span className="font-bold">{val.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between font-black text-2xl pt-4 border-t-4 border-slate-900"><span>TOTAL</span><span>{formatRpUpper(totalSetoran)}</span></div>
                    </div>
                    <div className="mt-12 text-center opacity-50 text-[10px]">ID: {user?.id?.substring(0, 12)}-{Date.now()}</div>
                </div>
            </div>
        </div>
    );
};