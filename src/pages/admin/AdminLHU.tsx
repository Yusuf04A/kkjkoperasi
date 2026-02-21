import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { ArrowLeft, RefreshCw, Calculator, CheckCircle, X, Save, TrendingUp, Users, Info, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminLHU = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [distributions, setDistributions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🔥 STATE UNTUK CUSTOM POPUP CONFIRMATION 🔥
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, type: 'approve' | 'reject', dist: any }>({
        isOpen: false,
        type: 'approve',
        dist: null
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // 🔥 INPUT MENGGUNAKAN STRING AGAR MUDAH DIISI (TIDAK NYANGKUT DI 0)
    const [grossInput, setGrossInput] = useState('');
    const [opsInput, setOpsInput] = useState('');

    useEffect(() => { fetchDistributions(); }, []);

    const fetchDistributions = async () => {
        setLoading(true);
        const { data } = await supabase.from('lhu_distributions').select('*').order('created_at', { ascending: false });
        setDistributions(data || []);
        setLoading(false);
    };

    // Handler input agar otomatis format titik saat diketik
    const handleCurrencyChange = (val: string, setter: (v: string) => void) => {
        const clean = val.replace(/\D/g, '');
        setter(clean ? parseInt(clean).toLocaleString('id-ID') : '');
    };

    const handleGenerateLHU = async (e: React.FormEvent) => {
        e.preventDefault();
        const gross = parseInt(grossInput.replace(/\./g, '')) || 0;
        const ops = parseInt(opsInput.replace(/\./g, '')) || 0;

        if (gross <= 0) return toast.error("Laba kotor harus diisi!");

        const toastId = toast.loading("Mengkalkulasi LHU...");
        try {
            const pph = gross * 0.005;
            const shuNet = (gross - pph) - ops;
            const lhuMember = shuNet * 0.5;

            const { data: dist, error: distErr } = await supabase
                .from('lhu_distributions')
                .insert({
                    period_month: new Date().getMonth() + 1,
                    period_year: new Date().getFullYear(),
                    gross_profit: gross,
                    pph_amount: pph,
                    operational_cost: ops,
                    shu_net: shuNet,
                    total_lhu_member: lhuMember,
                    status: 'waiting'
                }).select().single();

            if (distErr) throw distErr;

            await supabase.rpc('generate_lhu_estimate', { dist_id: dist.id, total_lhu_member: lhuMember });

            toast.success("Estimasi berhasil dibuat!", { id: toastId });
            setIsModalOpen(false);
            setGrossInput('');
            setOpsInput('');
            fetchDistributions();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    // 🔥 EKSEKUSI PEMBAGIAN SALDO (APPROVE) 🔥
    const executeAllocation = async () => {
        const dist = confirmModal.dist;
        setIsProcessing(true);
        const toastId = toast.loading("Mencairkan LHU ke seluruh anggota...");

        try {
            const { data: recipients } = await supabase.from('lhu_member_details').select('*').eq('lhu_id', dist.id);
            if (recipients) {
                for (const item of recipients) {
                    const { data: p } = await supabase.from('profiles').select('tapro_balance').eq('id', item.user_id).single();
                    await supabase.from('profiles').update({ tapro_balance: (p?.tapro_balance || 0) + item.total_received }).eq('id', item.user_id);
                    await supabase.from('transactions').insert({
                        user_id: item.user_id, type: 'topup', amount: item.total_received, status: 'success',
                        description: `Pembagian LHU periode ${dist.period_month}/${dist.period_year}`
                    });
                }
            }
            await supabase.from('lhu_distributions').update({ status: 'approved' }).eq('id', dist.id);
            toast.success("LHU berhasil dibagikan!", { id: toastId });
            setConfirmModal({ isOpen: false, type: 'approve', dist: null });
            fetchDistributions();
        } catch (err: any) { toast.error("Gagal: " + err.message, { id: toastId }); }
        finally { setIsProcessing(false); }
    };

    // 🔥 EKSEKUSI PENGHAPUSAN (REJECT/REVISI) 🔥
    const executeDelete = async () => {
        const dist = confirmModal.dist;
        setIsProcessing(true);
        const toastId = toast.loading("Menghapus estimasi...");

        try {
            await supabase.from('lhu_member_details').delete().eq('lhu_id', dist.id);
            const { error } = await supabase.from('lhu_distributions').delete().eq('id', dist.id);
            if (error) throw error;

            toast.success("Estimasi berhasil dihapus", { id: toastId });
            setConfirmModal({ isOpen: false, type: 'reject', dist: null });
            fetchDistributions();
        } catch (err: any) { toast.error("Gagal hapus: " + err.message, { id: toastId }); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] mb-4 w-fit transition-all text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight lowercase leading-none mb-1">Manajemen LHU</h1>
                        <p className="text-sm text-gray-500 lowercase">Verifikasi & distribusi lebihan hasil usaha anggota</p>
                    </div>
                    <button onClick={() => { setGrossInput(''); setOpsInput(''); setIsModalOpen(true); }} className="bg-[#136f42] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#0f5c35] shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                        <Calculator size={18} /> Generate estimasi LHU
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-[#136f42]" /></div>
                ) : distributions.map((dist) => (
                    <div key={dist.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 hover:shadow-md transition-shadow">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-50 text-[#136f42] rounded-2xl flex items-center justify-center border border-green-100"><TrendingUp size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">Periode {dist.period_month} / {dist.period_year}</h3>
                                    <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border mt-1 inline-block", 
                                        dist.status === 'waiting' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100')}>
                                        {dist.status === 'waiting' ? 'Menunggu verifikasi' : 'Sudah dibagikan'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                                <div><p className="text-[9px] text-slate-400 font-black uppercase mb-1">Laba kotor</p><p className="text-sm font-black text-slate-800">{formatRupiah(dist.gross_profit)}</p></div>
                                <div><p className="text-[9px] text-slate-400 font-black uppercase mb-1">PPH (0.5%)</p><p className="text-sm font-black text-rose-500">-{formatRupiah(dist.pph_amount)}</p></div>
                                <div><p className="text-[9px] text-slate-400 font-black uppercase mb-1">Operasional</p><p className="text-sm font-black text-slate-800">{formatRupiah(dist.operational_cost)}</p></div>
                                <div><p className="text-[9px] text-slate-400 font-black uppercase mb-1">LHU anggota</p><p className="text-lg font-black text-[#136f42] tracking-tighter">{formatRupiah(dist.total_lhu_member)}</p></div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8 border-slate-100 min-w-[220px]">
                            {dist.status === 'waiting' ? (
                                <>
                                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'approve', dist })} className="w-full py-4 bg-[#136f42] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle size={18} /> Setujui & cairkan</button>
                                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', dist })} className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"><X size={18} /> Tolak / revisi</button>
                                </>
                            ) : (
                                <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100 opacity-80"><CheckCircle size={32} className="text-green-500 mx-auto mb-2" /><p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-tight">Sukses<br/>dibagikan</p></div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL GENERATE ESTIMASI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleGenerateLHU} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 border border-white/20">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Generate LHU</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Laba kotor bulan ini (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                    <input type="text" required value={grossInput} onChange={(e) => handleCurrencyChange(e.target.value, setGrossInput)} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-xl font-black text-2xl text-[#136f42] outline-none transition-all focus:bg-white focus:border-[#136f42]" placeholder="0" autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Total biaya operasional (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                    <input type="text" required value={opsInput} onChange={(e) => handleCurrencyChange(e.target.value, setOpsInput)} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-xl font-black text-2xl text-rose-500 outline-none transition-all focus:bg-white focus:border-rose-500" placeholder="0" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-[#136f42] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all">Simpan estimasi</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 border border-slate-100 rounded-2xl font-black text-slate-300 text-[10px] uppercase">Batal</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🔥 CUSTOM POPUP CONFIRMATION (APPROVE / REJECT) 🔥 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", confirmModal.type === 'approve' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600')}>
                            {confirmModal.type === 'approve' ? <Info size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{confirmModal.type === 'approve' ? 'Eksekusi LHU' : 'Hapus estimasi'}</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 px-4">
                            {confirmModal.type === 'approve' 
                                ? `Bagikan saldo LHU periode ${confirmModal.dist?.period_month}/${confirmModal.dist?.period_year} ke seluruh anggota? Tindakan ini tidak dapat dibatalkan.` 
                                : `Batalkan estimasi LHU ini? Data detail pembagian anggota juga akan ikut terhapus dari sistem.`
                            }
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, type: 'approve', dist: null })} className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95">Batal</button>
                            <button onClick={confirmModal.type === 'approve' ? executeAllocation : executeDelete} disabled={isProcessing} className={cn("py-3.5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95", confirmModal.type === 'approve' ? 'bg-[#136f42] shadow-green-900/20' : 'bg-rose-600 shadow-rose-900/20')}>
                                {isProcessing ? 'Proses...' : `Ya, ${confirmModal.type === 'approve' ? 'Bagikan' : 'Hapus'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};