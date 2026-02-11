import React, { useState, useEffect } from 'react'; // Tambah useEffect
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom'; // Tambah useNavigate
import { formatRupiah, cn } from '../../lib/utils';
import { Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowRightLeft, History, ArrowRight, Wallet, Building, Coins, ShieldCheck, Download, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsCarousel } from '../../components/dashboard/NewsCarousel';




interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: string;
  color: 'blue' | 'yellow' | 'green';
  is_active: boolean;
  created_at: string;
}

export const Home = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate(); // Hook untuk pindah halaman
    const [showBalance, setShowBalance] = useState(true);

    // --- LOGIC BARU: TENDANG ADMIN KE DASHBOARDNYA ---
    useEffect(() => {
        if (user?.role === 'admin') {
            // Kalau yang login ternyata Admin, lempar ke Dashboard Admin
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Jika user adalah admin, jangan render apa-apa dulu (biar gak kedip)
    if (user?.role === 'admin') return null;

    // --- BATAS LOGIC BARU ---

    // Data Dummy
    const userData = {
        // Ambil nama asli dari database. Jika kosong, ambil dari email.
        name: user?.full_name || user?.email?.split('@')[0] || 'Anggota KKJ',

        // Ambil NIAK asli. Jika belum ada, tulis "MENUNGGU NIAK"
        memberId: user?.member_id || 'MENUNGGU NIAK',

        taproBalance: user?.tapro_balance || 0,
        otherAssetsBalance: user?.other_assets_balance || 0,

        // Format tanggal otomatis
        joinDate: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        validUntil: user?.created_at ? (new Date(user.created_at).getFullYear() + 5).toString() : '2031',
        branch: 'Pusat'
    };

    const quickActions = [
        { label: 'Top Up', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup' },
        { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik' },
        { label: 'Kirim', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim' },
        { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat' },
    ];

    const featuredPrograms = [
        { name: 'TAMASA', title: 'Tabungan Emas', desc: 'Investasi aman mulai Rp 10rb', icon: Coins, color: 'from-yellow-400 to-yellow-600', text: 'text-yellow-700', bg: 'bg-yellow-50' },
        { name: 'INFLIP', title: 'Investasi Properti', desc: 'Flipping properti profit tinggi', icon: Building, color: 'from-blue-400 to-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
        { name: 'PEGADAIAN', title: 'Gadai Emas Syariah', desc: 'Solusi dana cepat & berkah', icon: Wallet, color: 'from-green-400 to-green-600', text: 'text-green-700', bg: 'bg-green-50' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* 1. HERO SECTION (Background Biru FULL WIDTH) */}
            <div className="w-full bg-kkj-blue relative pb-24 pt-8 lg:pt-12 lg:rounded-b-[3rem] shadow-xl overflow-hidden">

                {/* Dekorasi Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>

                {/* CONTAINER KARTU (Tetap di tengah / Centered) */}
                <div className="max-w-xl mx-auto px-4 relative z-10">

                    {/* KARTU ID MEMBER */}
                    <div className="w-full bg-gradient-to-br from-[#003366] to-[#0055a5] rounded-xl shadow-2xl overflow-hidden border border-yellow-500/40 relative group transition-transform hover:scale-[1.01] duration-300">

                        {/* Background Effect */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        </div>

                        {/* HEADER KARTU */}
                        <div className="flex items-center gap-3 p-4 border-b border-yellow-500/30 relative z-10 bg-black/10 backdrop-blur-sm">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0 border border-yellow-500/50">
                                <ShieldCheck className="text-kkj-blue" size={24} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-sm tracking-wide leading-tight drop-shadow-md">KOPERASI KARYA KITA JAYA</h2>
                                <p className="text-yellow-400 text-[10px] italic font-serif opacity-90 tracking-wide">Berkoperasi Demi Wujud Kesejahteraan Bersama</p>
                            </div>
                        </div>

                        {/* BODY KARTU */}
                        <div className="p-5 flex justify-between items-center relative z-10 gap-4">
                            {/* Kiri: Info */}
                            <div className="space-y-3 flex-1 min-w-0">
                                <div>
                                    <h1 className="text-white font-bold text-xl md:text-2xl leading-tight truncate drop-shadow-sm font-sans tracking-tight">
                                        {userData.name}
                                    </h1>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-yellow-400 font-semibold w-12 shrink-0">NIAK</span>
                                        <span className="text-white font-mono truncate">: {userData.memberId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-yellow-400 font-semibold w-12 shrink-0">STATUS</span>
                                        <span className="text-green-300 font-bold bg-green-900/60 px-2 py-0.5 rounded border border-green-500/30 text-[10px] tracking-wider">AKTIF</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-widest mb-0.5">Saldo Tapro</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-lg font-mono">
                                        {showBalance ? formatRupiah(userData.taproBalance) : 'Rp •••••••'}
                                    </p>
                                </div>
                            </div>

                            {/* Kanan: Foto */}
                            <div className="w-24 h-32 bg-gray-200 rounded-md border-[3px] border-white shadow-lg overflow-hidden flex-shrink-0 relative">
                                {/* UPDATE: Cek avatar_url terlebih dahulu */}
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="Foto Member"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${userData.name}&background=EF4444&color=fff&size=200&font-size=0.35`}
                                        alt="Foto Placeholder"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>

                        {/* FOOTER KARTU */}
                        <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 h-8 flex items-center justify-between px-5 text-[10px] text-blue-900 font-bold uppercase tracking-wider relative z-10 shadow-inner">
                            <span className="truncate">Sejak: {userData.joinDate}</span>
                            <span className="opacity-40">|</span>
                            <span className="truncate hidden sm:inline">Cabang: {userData.branch}</span>
                            <span className="opacity-40 hidden sm:inline">|</span>
                            <span className="truncate">Valid: {userData.validUntil}</span>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-4 mt-3 px-2 opacity-90">
                        <button className="flex items-center gap-1.5 text-blue-100 hover:text-white text-xs font-medium transition-colors hover:underline">
                            <Download size={14} /> Simpan Kartu
                        </button>
                        <button className="flex items-center gap-1.5 text-blue-100 hover:text-white text-xs font-medium transition-colors hover:underline">
                            <Share2 size={14} /> Bagikan
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. TOTAL SIMPANAN (Floating Overlay) */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-center transform transition-transform hover:-translate-y-1 duration-300">

                    <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-xs font-bold tracking-wider uppercase">Total Aset (Non-Tapro)</span>
                                <button onClick={() => setShowBalance(!showBalance)} className="hover:text-kkj-blue transition-colors">
                                    {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                            </div>
                            <div className="bg-blue-50 text-kkj-blue text-[10px] font-bold px-2 py-0.5 rounded">IDR</div>
                        </div>

                        <div className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                            {showBalance ? formatRupiah(userData.otherAssetsBalance) : 'Rp ••••••••'}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">*Akumulasi dari 8 jenis simpanan lain</p>
                    </div>

                    <div className="w-full md:w-7/12">
                        <div className="grid grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                                <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-50 group-hover:shadow-md",
                                        action.bg
                                    )}>
                                        <action.icon className={cn("w-6 h-6", action.color)} />
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600 group-hover:text-kkj-blue text-center leading-tight">
                                        {action.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            

            {/* 3. MAIN CONTENT (Berita & Program) */}
            <div className="max-w-5xl mx-auto px-4 mt-10 space-y-10">
                <NewsCarousel />
                <div className="pb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Program Unggulan</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Solusi keuangan masa depan</p>
                        </div>
                        <button className="text-xs font-medium text-kkj-blue hover:underline flex items-center gap-1">
                            Lihat Semua <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {featuredPrograms.map((program, idx) => (
                            <div key={idx} className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative overflow-hidden cursor-pointer">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${program.color}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", program.bg)}>
                                        <program.icon className={program.text} size={20} />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-kkj-blue group-hover:text-white transition-colors">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-0.5">{program.name}</h4>
                                <p className="text-xs font-medium text-gray-600 mb-1">{program.title}</p>
                                <p className="text-[10px] text-gray-400">{program.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};