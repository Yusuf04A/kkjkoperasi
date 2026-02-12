import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import {
    Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowRightLeft,
    History, ArrowRight, Wallet, Building, Coins, ShieldCheck,
    Download, Share2, X, Smartphone, PiggyBank,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsCarousel } from '../../components/dashboard/NewsCarousel';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export const Home = () => {
    const { user, checkSession } = useAuthStore(); // Pastikan checkSession tersedia jika dibutuhkan
    const navigate = useNavigate();
    const [showBalance, setShowBalance] = useState(true);
    const [showDetailAssets, setShowDetailAssets] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    if (user?.role === 'admin') return null;

    // --- DATA ANGGOTA ---
    const userData = {
        name: user?.full_name || user?.email?.split('@')[0] || 'Anggota KKJ',
        memberId: user?.member_id || 'MENUNGGU NIAK',
        taproBalance: user?.tapro_balance || 0,
        joinDate: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        validUntil: user?.created_at ? (new Date(user.created_at).getFullYear() + 5).toString() : '2031',
        branch: 'Pusat'
    };

    const otherSavings = [
        { name: 'Simpanan Pokok', val: user?.simpok_balance || 0 },
        { name: 'Simpanan Wajib', val: user?.simwa_balance || 0 },
        { name: 'Simpanan Masa Depan', val: user?.simade_balance || 0 },
        { name: 'Simpanan Pendidikan', val: user?.sipena_balance || 0 },
        { name: 'Simpanan Hari Raya', val: user?.sihara_balance || 0 },
        { name: 'Simpanan Qurban', val: user?.siqurma_balance || 0 },
        { name: 'Simpanan Haji/Umroh', val: user?.siuji_balance || 0 },
        { name: 'Simpanan Walimah', val: user?.siwalima_balance || 0 },
    ];

    const totalOtherAssets = otherSavings.reduce((acc, curr) => acc + curr.val, 0);

    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('Mencetak kartu HD...');
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                windowWidth: 1920,
                windowHeight: 1080
            });
            const link = document.createElement('a');
            link.download = `KARTU-KKJ-${userData.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Kartu berhasil disimpan!', { id: toastId });
        } catch (err) {
            toast.error('Gagal menyimpan kartu', { id: toastId });
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('Membuka menu share...');
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "kartu-anggota.png", { type: "image/png" });
                if (navigator.share) {
                    await navigator.share({
                        title: 'Kartu Anggota Koperasi KKJ',
                        text: `Halo, ini kartu anggota digital saya di Koperasi KKJ a.n ${userData.name}.`,
                        files: [file]
                    });
                    toast.dismiss(toastId);
                } else {
                    toast.error("Browser tidak support share.", { id: toastId });
                }
            });
        } catch (err) {
            toast.error("Gagal membagikan kartu.", { id: toastId });
        }
    };

    const quickActions = [
        { label: 'Top Up', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup' },
        { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik' },
        { label: 'Kirim', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim' },
        { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat' },
    ];

    // --- WARNA PEGADAIAN DISESUAIKAN KE BIRU-EMAS ---
    const featuredPrograms = [
        { name: 'TAMASA', title: 'Tabungan Emas', desc: 'Investasi aman mulai Rp 10rb', icon: Coins, color: 'from-yellow-400 to-yellow-600', text: 'text-yellow-700', bg: 'bg-yellow-50' },
        { name: 'INFLIP', title: 'Investasi Properti', desc: 'Flipping properti profit tinggi', icon: Building, color: 'from-blue-400 to-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
        { name: 'PEGADAIAN', title: 'Gadai Emas Syariah', desc: 'Solusi dana cepat & berkah', icon: Wallet, color: 'from-[#003366] to-[#0055a5]', text: 'text-blue-900', bg: 'bg-blue-50' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* 1. HERO SECTION */}
            <div className="w-full bg-[#003366] relative pb-24 pt-8 lg:pt-12 lg:rounded-b-[3rem] shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>

                <div className="max-w-xl mx-auto px-4 relative z-10">
                    <div
                        ref={cardRef}
                        data-card="member-card"
                        className="w-full bg-gradient-to-br from-[#003366] to-[#0055a5] rounded-xl shadow-2xl overflow-hidden border border-yellow-500/40 relative group aspect-[1.58/1] flex flex-col justify-between"
                    >
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        </div>

                        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-yellow-500/30 relative z-10 bg-black/10 backdrop-blur-sm">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0 border border-yellow-500/50">
                                <ShieldCheck className="text-[#003366]" size={24} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-sm md:text-lg tracking-wide leading-tight drop-shadow-md uppercase">KOPERASI KARYA KITA JAYA</h2>
                                <p className="text-yellow-400 text-[10px] md:text-xs italic font-serif opacity-90 tracking-wide">Berkoperasi Demi Wujud Kesejahteraan Bersama</p>
                            </div>
                        </div>

                        <div className="px-5 py-2 flex justify-between items-center relative z-10 gap-4 flex-1">
                            <div className="space-y-2 flex-1 min-w-0">
                                <h1 className="text-white font-bold text-xl md:text-3xl leading-tight truncate drop-shadow-sm font-sans tracking-tight uppercase">
                                    {userData.name}
                                </h1>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs md:text-sm">
                                        <span className="text-yellow-400 font-semibold w-12 shrink-0">NIAK</span>
                                        <span className="text-white font-mono truncate">: {userData.memberId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs md:text-sm">
                                        <span className="text-yellow-400 font-semibold w-12 shrink-0">STATUS</span>
                                        <span className="text-green-300 font-bold bg-green-900/60 px-2 py-0.5 rounded border border-green-500/30 text-[10px] tracking-wider">AKTIF</span>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-yellow-400/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">Saldo Tapro</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-lg font-mono">
                                        {showBalance ? formatRupiah(userData.taproBalance) : 'Rp •••••••'}
                                    </p>
                                </div>
                            </div>
                            <div className="w-24 h-32 md:w-28 md:h-36 bg-gray-200 rounded-md border-[3px] border-white shadow-lg overflow-hidden flex-shrink-0 relative">
                                <img
                                    src={user?.avatar_url || `https://ui-avatars.com/api/?name=${userData.name}&background=003366&color=fff&size=200&font-size=0.35`}
                                    alt="Foto Member"
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 h-8 md:h-10 flex items-center justify-between px-5 text-[10px] md:text-xs text-blue-900 font-bold uppercase tracking-wider relative z-10 shadow-inner">
                            <span className="truncate">Sejak: {userData.joinDate}</span>
                            <span className="opacity-40">|</span>
                            <span className="truncate hidden sm:inline">Cabang: {userData.branch}</span>
                            <span className="opacity-40 hidden sm:inline">|</span>
                            <span className="truncate">Valid: {userData.validUntil}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-3 px-2">
                        <button onClick={handleDownloadCard} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-blue-50 border border-white/20 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95">
                            <Download size={14} /> Simpan Kartu
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-blue-50 border border-white/20 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95">
                            <Share2 size={14} /> Bagikan
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. TOTAL SIMPANAN OVERLAY */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                    <div onClick={() => setShowDetailAssets(true)} className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6 cursor-pointer group hover:bg-gray-50/50 p-2 rounded-lg transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-xs font-bold tracking-wider uppercase group-hover:text-blue-900 transition-colors">Total Aset (Non-Tapro)</span>
                                <button onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}>
                                    {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                            </div>
                            <div className="bg-blue-50 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                8 JENIS <ArrowRight size={10} />
                            </div>
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {showBalance ? formatRupiah(totalOtherAssets) : 'Rp ••••••••'}
                        </div>
                    </div>

                    <div className="w-full md:w-7/12">
                        <div className="grid grid-cols-5 gap-3">
                            {quickActions.map((action) => (
                                <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-50", action.bg)}>
                                        <action.icon className={cn("w-6 h-6", action.color)} />
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600 group-hover:text-blue-900 text-center leading-tight">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT */}
            <div className="max-w-5xl mx-auto px-4 mt-10 space-y-10">
                <NewsCarousel />
                <div className="pb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Program Unggulan</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Solusi keuangan masa depan</p>
                        </div>
                        <button className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1">Lihat Semua <ArrowRight size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {featuredPrograms.map((program, idx) => (
                            <Link
                                key={idx}
                                to={program.name === 'TAMASA' ? '/program/tamasa' : program.name === 'INFLIP' ? '/program/inflip' : '/program/pegadaian'}
                                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${program.color}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", program.bg)}>
                                        <program.icon className={program.text} size={20} />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-0.5">{program.name}</h4>
                                <p className="text-xs font-medium text-gray-600 mb-1">{program.title}</p>
                                <p className="text-[10px] text-gray-400">{program.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL RINCIAN ASET */}
            {showDetailAssets && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailAssets(false)}></div>
                    <div className="relative bg-white w-full max-w-sm sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-xl text-gray-900">Rincian Aset Koperasi</h3>
                            <button onClick={() => setShowDetailAssets(false)} className="p-2 bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="overflow-y-auto pr-2 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {otherSavings.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                        <span className="text-base font-bold text-gray-900 font-mono">{formatRupiah(item.val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 shrink-0">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
                                <span className="font-bold text-blue-900 uppercase text-xs tracking-wider">Total Aset Lain</span>
                                <span className="font-bold text-xl text-blue-900">{formatRupiah(totalOtherAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};