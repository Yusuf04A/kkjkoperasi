import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import { formatRupiah, cn } from '../../lib/utils';
import { ArrowLeft, RefreshCw, Calculator, CheckCircle, X, Save, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminLHU = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [distributions, setDistributions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        try {
            // Endpoint Laravel: GET /admin/lhu
            const response = await API.get('/admin/lhu');
            setDistributions(response.data || []);
        } catch (error) {
            toast.error("Gagal memuat riwayat LHU");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLHU = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Mengkalkulasi estimasi LHU...");
        
        try {
            // Endpoint Laravel: POST /admin/lhu/generate
            // Backend akan menghitung PPH, SHU Net, dan membagi porsi tiap anggota secara otomatis
            await API.post('/admin/lhu/generate', calcData);

            toast.success("Estimasi berhasil dibuat!", { id: toastId });
            setIsModalOpen(false);
            fetchDistributions();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal kalkulasi";
            toast.error("Gagal: " + msg, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExecuteLHU = async (dist: any) => {
        if (!window.confirm("Eksekusi pembagian saldo ke seluruh anggota? Tindakan ini tidak dapat dibatalkan.")) return;
        const toastId = toast.loading("Mencairkan saldo LHU ke anggota...");

        try {
            // Endpoint Laravel: POST /admin/lhu/{id}/execute
            // Backend menangani: Looping anggota, update Tapro, dan catat transaksi log dalam satu Database Transaction
            await API.post(`/admin/lhu/${dist.id}/execute`);

            toast.success("LHU Berhasil Dibagikan!", { id: toastId });
            fetchDistributions();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal distribusi LHU";
            toast.error("Error: " + msg, { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#003366] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen LHU</h1>
                        <p className="text-sm text-gray-500">Verifikasi & Distribusi Lebihan Hasil Usaha Anggota</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="bg-[#003366] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 shadow-lg active:scale-95 transition-all"
                    >
                        <Calculator size={18} /> Generate Estimasi LHU
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#003366] mb-2" size={32} />
                        <span className="text-gray-400 text-sm">Menghubungkan ke server...</span>
                    </div>
                ) : distributions.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Belum ada riwayat distribusi LHU.</p>
                    </div>
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
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border", 
                                            dist.status === 'waiting' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-100 text-green-600 border-green-200')}>
                                            {dist.status === 'waiting' ? 'Menunggu Verifikasi' : 'Sudah Dibagikan'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Laba Kotor</p><p className="text-sm font-bold text-gray-900">{formatRupiah(dist.gross_profit)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">PPH Final (0.5%)</p><p className="text-sm font-bold text-red-500">-{formatRupiah(dist.pph_amount)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Operasional</p><p className="text-sm font-bold text-gray-900">{formatRupiah(dist.operational_cost)}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total LHU Anggota</p><p className="text-lg font-black text-[#003366]">{formatRupiah(dist.total_lhu_member)}</p></div>
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
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Sukses<br/>Dibagikan</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL GENERATE ESTIMASI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-900">Generate Estimasi LHU</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleGenerateLHU} className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Total Laba Kotor (Bulan Ini)</p>
                                <input 
                                    type="number" 
                                    required 
                                    value={calcData.gross_profit || ''} 
                                    onChange={(e) => setCalcData({...calcData, gross_profit: Number(e.target.value)})} 
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold text-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all" 
                                    placeholder="Rp 0"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Total Biaya Operasional</p>
                                <input 
                                    type="number" 
                                    required 
                                    value={calcData.operational_cost || ''} 
                                    onChange={(e) => setCalcData({...calcData, operational_cost: Number(e.target.value)})} 
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold text-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all" 
                                    placeholder="Rp 0"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" disabled={isSaving} className="flex-1 bg-[#003366] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Simpan Estimasi</>}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 border border-gray-200 rounded-xl font-bold text-gray-400 text-xs uppercase hover:bg-gray-50 transition-colors">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};