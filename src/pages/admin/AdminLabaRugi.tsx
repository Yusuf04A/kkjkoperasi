import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import { formatRupiah, cn } from '../../lib/utils';
import { 
    ArrowLeft, RefreshCw, TrendingUp, TrendingDown, 
    PieChart, BarChart3, Wallet, ShoppingBag, Landmark,
    Loader2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const AdminLabaRugi = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_income: 0,
        toko_income: 0,
        tamasa_margin: 0,
        gadai_fees: 0,
        operational_costs: 0
    });

    useEffect(() => { fetchRealtimeStats(); }, []);

    const fetchRealtimeStats = async () => {
        setLoading(true);
        try {
            /** * Panggil API Laravel: GET /admin/financial/profit-loss
             * Backend akan melakukan kalkulasi SUM dari:
             * 1. shop_orders (status: selesai)
             * 2. tamasa_transactions (setoran * 0.05)
             * 3. pawn_transactions (count * 10000)
             * 4. lhu_distributions (operational_cost terakhir)
             */
            const response = await API.get('/admin/financial/profit-loss');
            const data = response.data;

            setStats({
                toko_income: data.toko_income || 0,
                tamasa_margin: data.tamasa_margin || 0,
                gadai_fees: data.gadai_fees || 0,
                total_income: data.total_income || 0,
                operational_costs: data.operational_costs || 0
            });
        } catch (err: any) {
            console.error("Gagal memuat statistik laba rugi:", err);
        } finally {
            setLoading(false);
        }
    };

    const netProfit = stats.total_income - stats.operational_costs;

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* Header Konsisten */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Laba Rugi</h1>
                        <p className="text-sm text-gray-500">Analisis Keuangan Real-time Koperasi Karya Kita Jaya</p>
                    </div>
                    <button onClick={fetchRealtimeStats} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            {/* Widget Utama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan Kotor</p>
                    <p className="text-2xl font-[1000] text-[#003366]">{formatRupiah(stats.total_income)}</p>
                    <div className="mt-3 flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-tighter">
                        <TrendingUp size={12} /> Akumulasi Real-time
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Beban Operasional</p>
                    <p className="text-2xl font-[1000] text-rose-500">{formatRupiah(stats.operational_costs)}</p>
                    <div className="mt-3 flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                        <Landmark size={12} /> Biaya Sesuai LHU Terakhir
                    </div>
                </div>

                <div className={cn("p-6 rounded-2xl shadow-lg border transition-colors", netProfit >= 0 ? "bg-[#003366] text-white border-blue-900" : "bg-rose-600 text-white border-rose-900")}>
                    <p className="text-[11px] font-black text-blue-100 uppercase tracking-widest mb-1 text-opacity-80">Estimasi Laba Bersih</p>
                    <p className="text-3xl font-[1000] tracking-tighter">{formatRupiah(netProfit)}</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                        {netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
                        {netProfit >= 0 ? "Surplus Keuangan" : "Defisit Keuangan"}
                    </div>
                </div>
            </div>

            {/* Rincian Unit Usaha */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <BarChart3 size={18} className="text-[#003366]" /> Rincian Pendapatan Per Unit
                    </h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="p-20 text-center"><Loader2 className="animate-spin inline text-[#003366]" /></div>
                    ) : (
                        <>
                            <UnitItem icon={<ShoppingBag size={20}/>} label="Unit Toko Koperasi" value={stats.toko_income} color="text-blue-600" />
                            <UnitItem icon={<PieChart size={20}/>} label="Margin TAMASA (Tabungan Emas)" value={stats.tamasa_margin} color="text-yellow-600" />
                            <UnitItem icon={<Wallet size={20}/>} label="Jasa Gadai Emas Syariah" value={stats.gadai_fees} color="text-emerald-600" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const UnitItem = ({ icon, label, value, color }: any) => (
    <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Unit Aktif</p>
            </div>
        </div>
        <p className={cn("text-lg font-[1000] tracking-tighter", color)}>{formatRupiah(value)}</p>
    </div>
);