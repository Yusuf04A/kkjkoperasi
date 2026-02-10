import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Fingerprint, Globe } from 'lucide-react';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        // CONTAINER UTAMA (FULL SCREEN GRADIENT)
        <div className="min-h-screen w-full bg-gradient-to-br from-[#003366] via-[#004080] to-[#0055a5] relative overflow-hidden flex items-center justify-center">

            {/* --- DEKORASI BACKGROUND (Abstrak) --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Cahaya Glow Kiri Atas */}
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-400/10 blur-[100px] rounded-full"></div>
                {/* Cahaya Glow Kanan Bawah */}
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-yellow-500/5 blur-[100px] rounded-full"></div>

                {/* Gelombang Halus Desktop (Opsional) */}
                <div className="hidden lg:block absolute top-0 right-0 w-[50vw] h-full bg-gradient-to-l from-black/10 to-transparent"></div>
            </div>

            {/* --- CONTENT WRAPPER --- */}
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center h-full py-10 relative z-10">

                {/* === BAGIAN KIRI (BRANDING) === */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8">

                    {/* Logo Wrapper */}
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] border-4 border-white/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-200"></div>
                        <ShieldCheck className="text-[#003366] relative z-10 w-12 h-12 lg:w-16 lg:h-16 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute bottom-0 w-full h-1.5 bg-red-600"></div>
                    </div>

                    {/* Teks Judul */}
                    <div>
                        <h1 className="text-3xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl">
                            KOPERASI<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">KARYA KITA JAYA</span>
                        </h1>
                        <p className="text-blue-100/80 text-sm lg:text-xl mt-4 font-medium max-w-md mx-auto lg:mx-0 leading-relaxed tracking-wide">
                            Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang amanah.
                        </p>
                    </div>
                </div>

                {/* === BAGIAN KANAN (TOMBOL AKSI - TANPA KOTAK) === */}
                <div className="w-full max-w-md mx-auto lg:ml-auto flex flex-col justify-center">

                    {/* Wrapper Tombol Langsung (Tanpa Background Box) */}
                    <div className="space-y-6 w-full">

                        {/* Tombol LOGIN (Emas Premium) */}
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 lg:py-5 rounded-2xl bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 text-[#003366] font-extrabold text-lg lg:text-xl shadow-[0_4px_25px_rgba(234,179,8,0.5)] border-t border-yellow-200 hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                        >
                            LOGIN
                        </button>

                        {/* Tombol DAFTAR (Biru Glass Modern) */}
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full py-4 lg:py-5 rounded-2xl bg-gradient-to-b from-blue-600/80 to-blue-800/80 backdrop-blur-md text-white font-bold text-lg lg:text-xl shadow-lg border border-blue-400/40 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                        >
                            DAFTAR ANGGOTA
                        </button>
                    </div>

                    {/* Fingerprint & Language */}
                    <div className="mt-10 lg:mt-12 flex flex-col items-center gap-6">

                        {/* Fingerprint Icon */}
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className="w-20 h-20 rounded-full border-2 border-blue-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-gradient-to-b from-blue-500/10 to-blue-900/20 backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
                                <Fingerprint size={40} className="text-blue-300 group-hover:text-white transition-colors animate-pulse" />
                            </div>
                            <p className="text-blue-200 text-xs lg:text-sm font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                                Masuk dengan sidik jari
                            </p>
                        </div>

                        {/* Garis Pemisah Kecil */}
                        <div className="w-12 h-1 bg-white/10 rounded-full"></div>

                        {/* Language Selector */}
                        <div className="flex items-center gap-3 text-xs lg:text-sm text-blue-200/60 font-medium">
                            <Globe size={14} />
                            <span className="text-white cursor-pointer hover:underline">Bahasa Indonesia</span>
                            <span>|</span>
                            <span className="cursor-pointer hover:text-white transition-colors">English</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Copyright Footer (Desktop Only) */}
            <div className="hidden lg:block absolute bottom-6 text-center w-full text-blue-300/30 text-xs font-light tracking-widest">
                &copy; 2026 KOPERASI PEMASARAN KARYA KITA JAYA. ALL RIGHTS RESERVED.
            </div>

        </div>
    );
};