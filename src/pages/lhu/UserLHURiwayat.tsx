import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    ArrowLeft, TrendingUp, Wallet, ShoppingCart, 
    Zap, Calendar, Info, Award, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const UserLHURiwayat = () => {
    const navigate = useNavigate();
    const { user, checkSession } = useAuthStore();
    const [lhuHistory, setLhuHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (!user) await checkSession();
            fetchUserLHU();
        };
        init();
    }, [user, checkSession]);

    const fetchUserLHU = async () => {
        setLoading(true);
        try {
            // Endpoint Laravel: GET /lhu/history
            // Endpoint ini akan mengembalikan data LHU spesifik user yang login
            const response = await API.get('/lhu/history');
            setLhuHistory(response.data || []);
        } catch (error) {
            console.error("Gagal mengambil data LHU:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPerolehan = lhuHistory.reduce((acc, curr) => acc + (parseFloat(curr.total_received) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
            {/* HEADER PUTIH BERSIH */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Riwayat LHU</h1>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* HERO BANNER CARD IDENTIK PEGADAIAN */}
                <div className="bg-[#0B2B4B] rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10 max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-amber-400" size={18} />
                            <span className="font-bold tracking-widest text-amber-400 text-[10px] uppercase">TOTAL PEROLEHAN ANDA</span>
                        </div>
                        <h2 className="text-2xl lg:text-4xl font-bold mb-2 leading-tight uppercase tracking-tight">
                            {formatRupiah(totalPerolehan)}
                        </h2>
                        <p className="text-blue-100/80 text-[10px] uppercase font-bold tracking-widest leading-relaxed pt-2">
                            AKUMULASI DARI {lhuHistory.length} PERIODE
                        </p>
                    </div>
                    {/* Ikon watermark identik pegadaian */}
                    <Award className="hidden sm:block text-white/5 absolute -right-4 -bottom-4 w-32 h-32 rotate-12" />
                </div>

                {/* LABEL SECTION */}
                <div className="flex items-center gap-2 px-1">
                    <History size={14} className="text-slate-400" />
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Distribusi</h3>
                </div>

                {/* LIST RIWAYAT - LAYOUT HORIZONTAL */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 gap-4 opacity-50">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0B2B4B] rounded-full animate-spin" />
                            <p className="font-bold text-[10px] uppercase tracking-widest">Sinkronisasi...</p>
                        </div>
                    ) : lhuHistory.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                            <Award size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Belum ada riwayat LHU</h3>
                        </div>
                    ) : (
                        lhuHistory.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md group">
                                {/* Baris Atas: Info Periode & Nominal */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-blue-50 group-hover:text-[#003366] transition-colors">
                                            <Calendar size={22} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 uppercase">
                                                {/* Menggunakan optional chaining untuk antisipasi data null dari API */}
                                                PERIODE {item.lhu_distribution?.period_month} / {item.lhu_distribution?.period_year}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                CAIR: {format(new Date(item.created_at), 'dd MMM yyyy', { locale: indonesia }).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[16px] font-bold text-emerald-600">
                                            +{formatRupiah(item.total_received)}
                                        </div>
                                        <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-green-50 text-green-600 border border-green-100 mt-1 inline-block">SUCCESS</span>
                                    </div>
                                </div>

                                {/* Baris Bawah: Breakdown 3 Kolom */}
                                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-50">
                                    <DetailBox icon={<Wallet size={12}/>} label="SIMPANAN" value={item.portion_savings} color="blue" />
                                    <DetailBox icon={<Zap size={12}/>} label="FINANCING" value={item.portion_financing} color="amber" />
                                    <DetailBox icon={<ShoppingCart size={12}/>} label="BELANJA" value={item.portion_shopping} color="purple" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* INFO FOOTER */}
                <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100/50 shadow-sm shadow-amber-900/5">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shadow-inner shrink-0 h-fit">
                        <Info size={16} />
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium italic opacity-80">
                        LHU dibagikan setiap periode berdasarkan partisipasi Anda. Semakin aktif menabung, menggunakan pembiayaan, dan belanja, semakin besar bagi hasil yang Anda terima.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENT BOX RINCIAN PORSI --- */
const DetailBox = ({ icon, label, value, color }: { icon: any, label: string, value: number, color: 'blue' | 'amber' | 'purple' }) => {
    const styles = {
        blue: "bg-blue-50/50 text-blue-600 border-blue-100/30",
        amber: "bg-amber-50/50 text-amber-600 border-amber-100/30",
        purple: "bg-purple-50/50 text-purple-600 border-purple-100/30"
    };

    return (
        <div className={cn("text-center p-3 rounded-xl border transition-all hover:bg-white hover:shadow-md", styles[color])}>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                {icon}
            </div>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-[10px] font-bold tracking-tight">{formatRupiah(value)}</p>
        </div>
    );
};