import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { ArrowLeft, RefreshCw, Calculator, CheckCircle, X, Save, TrendingUp, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminLHU = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [distributions, setDistributions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form input untuk hitung laba kotor
    const [calcData, setCalcData] = useState({
        gross_profit: 0,
        operational_cost: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => { fetchDistributions(); }, []);

    const fetchDistributions = async () => {
        setLoading(true);
        const { data } = await supabase.from('lhu_distributions').select('*').order('created_at', { ascending: false });
        setDistributions(data || []);
        setLoading(false);
    };

    const handleGenerateLHU = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Mengkalkulasi LHU...");
        try {
            // 1. Hitung PPH (0.5%) dan SHU Bersih
            const pph = calcData.gross_profit * 0.005;
            const shuNet = (calcData.gross_profit - pph) - calcData.operational_cost;
            const lhuMember = shuNet * 0.5; // 50% untuk anggota

            // 2. Simpan Laporan Induk
            const { data: dist, error: distErr } = await supabase
                .from('lhu_distributions')
                .insert({
                    period_month: calcData.month,
                    period_year: calcData.year,
                    gross_profit: calcData.gross_profit,
                    pph_amount: pph,
                    operational_cost: calcData.operational_cost,
                    shu_net: shuNet,
                    total_lhu_member: lhuMember,
                    status: 'waiting'
                }).select().single();

            if (distErr) throw distErr;

            // 3. Jalankan SQL Function untuk hitung porsi tiap anggota
            await supabase.rpc('generate_lhu_estimate', { dist_id: dist.id, total_lhu_member: lhuMember });

            toast.success("Estimasi berhasil dibuat!", { id: toastId });
            setIsModalOpen(false);
            fetchDistributions();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    const handleExecuteLHU = async (dist: any) => {
        if (!window.confirm("Eksekusi pembagian saldo ke seluruh anggota? Tindakan ini tidak dapat dibatalkan.")) return;
        const toastId = toast.loading("Mencairkan saldo LHU...");

        try {
            // Tarik semua detail penerima
            const { data: recipients } = await supabase
                .from('lhu_member_details')
                .select('*')
                .eq('lhu_id', dist.id);

            if (recipients) {
                for (const item of recipients) {
                    // Update Saldo Tapro
                    const { data: p } = await supabase.from('profiles').select('tapro_balance').eq('id', item.user_id).single();
                    await supabase.from('profiles').update({ tapro_balance: (p?.tapro_balance || 0) + item.total_received }).eq('id', item.user_id);

                    // Catat Riwayat
                    await supabase.from('transactions').insert({
                        user_id: item.user_id,
                        type: 'topup',
                        amount: item.total_received,
                        status: 'success',
                        description: `Pembagian LHU Periode ${dist.period_month}/${dist.period_year}`
                    });
                }
            }

            await supabase.from('lhu_distributions').update({ status: 'approved' }).eq('id', dist.id);
            toast.success("LHU Berhasil Dibagikan!", { id: toastId });
            fetchDistributions();
        } catch (err: any) {
            toast.error("Error: " + err.message, { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* Header Konsisten TAMASA */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen LHU</h1>
                        <p className="text-sm text-gray-500">Verifikasi & Distribusi Lebihan Hasil Usaha Anggota</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-kkj-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 shadow-lg active:scale-95 transition-all">
                        <Calculator size={18} /> Generate Estimasi LHU
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : distributions.map((dist) => (
                    <div key={dist.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 hover:shadow-md transition-all">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Periode {dist.period_month} / {dist.period_year}</h3>
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", 
                                            dist.status === 'waiting' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600')}>
                                            {dist.status === 'waiting' ? 'Menunggu Verifikasi' : 'Sudah Dibagikan'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Laba Kotor</p><p className="text-sm font-bold text-gray-900">{formatRupiah(dist.gross_profit)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase">PPH Final (0.5%)</p><p className="text-sm font-bold text-red-500">-{formatRupiah(dist.pph_amount)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Operasional</p><p className="text-sm font-bold text-gray-900">{formatRupiah(dist.operational_cost)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Total LHU Anggota</p><p className="text-lg font-black text-kkj-blue">{formatRupiah(dist.total_lhu_member)}</p></div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8 border-gray-100 min-w-[200px]">
                            {dist.status === 'waiting' ? (
                                <>
                                    <button onClick={() => handleExecuteLHU(dist)} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-900/10 flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95">
                                        <CheckCircle size={18} /> Setujui & Cairkan
                                    </button>
                                    <button className="w-full py-3 bg-white text-gray-400 border border-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                                        <X size={18} /> Tolak / Revisi
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                    <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-green-600 uppercase">Sukses<br/>Dibagikan</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL GENERATE ESTIMASI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleGenerateLHU} className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Generate Estimasi LHU</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Laba Kotor (Bulan Ini)</p>
                                <input type="number" required value={calcData.gross_profit} onChange={(e) => setCalcData({...calcData, gross_profit: Number(e.target.value)})} className="w-full bg-gray-50 border p-3 rounded-lg font-bold text-lg" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Biaya Operasional</p>
                                <input type="number" required value={calcData.operational_cost} onChange={(e) => setCalcData({...calcData, operational_cost: Number(e.target.value)})} className="w-full bg-gray-50 border p-3 rounded-lg font-bold text-lg" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-kkj-blue text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2"><Save size={18} /> Simpan Estimasi</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 border border-gray-200 rounded-xl font-bold text-gray-400 text-xs uppercase">Batal</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};