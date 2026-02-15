import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Globe } from 'lucide-react';
// Pastikan path ini benar sesuai lokasi file Anda
import logoKKJ from '/src/assets/Logo-kkj.png';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        // CONTAINER UTAMA (HIJAU HUTAN DALAM)
        <div className="min-h-screen w-full bg-gradient-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden flex items-center justify-center font-sans">

            {/* --- DEKORASI BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-green-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-lime-400/5 blur-[100px] rounded-full"></div>
            </div>

            {/* --- CONTENT WRAPPER --- */}
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center h-full py-10 relative z-10">

                {/* === BAGIAN KIRI (BRANDING & LOGO) === */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8">

                    {/* Logo Wrapper */}
                    <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] border-4 border-white/20 relative overflow-hidden group p-3">
                        {/* Gambar Logo dengan Trik CSS */}
                        <img 
                            src={logoKKJ} 
                            alt="Logo Koperasi KKJ" 
                            // PERBAIKAN DI SINI: Menambahkan class 'mix-blend-multiply'
                            // Class ini membuat latar belakang putih pada gambar JPEG menjadi transparan
                            className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                        />
                        {/* Garis bawah hijau lime */}
                        <div className="absolute bottom-0 w-full h-1.5 bg-lime-500"></div>
                    </div>

                    {/* Teks Judul */}
                    <div>
                        <h1 className="text-3xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl">
                            KOPERASI<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-yellow-300 to-lime-300">KARYA KITA JAYA</span>
                        </h1>
                        <p className="text-green-100/80 text-sm lg:text-xl mt-4 font-medium max-w-md mx-auto lg:mx-0 leading-relaxed tracking-wide">
                            Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang amanah.
                        </p>
                    </div>
                </div>

                {/* === BAGIAN KANAN (TOMBOL AKSI) === */}
                <div className="w-full max-w-md mx-auto lg:ml-auto flex flex-col justify-center">

                    <div className="space-y-6 w-full">
                        {/* Tombol LOGIN */}
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 lg:py-5 rounded-2xl bg-gradient-to-b from-lime-400 to-green-600 text-white font-extrabold text-lg lg:text-xl shadow-[0_4px_25px_rgba(132,204,22,0.5)] border-t border-lime-300 hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                        >
                            LOGIN
                        </button>

                        {/* Tombol DAFTAR */}
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full py-4 lg:py-5 rounded-2xl bg-white/10 backdrop-blur-md text-white font-bold text-lg lg:text-xl shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                        >
                            DAFTAR ANGGOTA
                        </button>
                    </div>

                    {/* Fingerprint & Language */}
                    <div className="mt-10 lg:mt-12 flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className="w-20 h-20 rounded-full border-2 border-green-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(74,222,128,0.2)] bg-gradient-to-b from-green-500/10 to-green-900/20 backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
                                <Fingerprint size={40} className="text-green-300 group-hover:text-white transition-colors animate-pulse" />
                            </div>
                            <p className="text-green-200 text-xs lg:text-sm font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                                Masuk dengan sidik jari
                            </p>
                        </div>

                        <div className="w-12 h-1 bg-white/10 rounded-full"></div>

                        <div className="flex items-center gap-3 text-xs lg:text-sm text-green-200/60 font-medium">
                            <Globe size={14} />
                            <span className="text-white cursor-pointer hover:underline">Bahasa Indonesia</span>
                            <span>|</span>
                            <span className="cursor-pointer hover:text-white transition-colors">English</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Copyright */}
            <div className="hidden lg:block absolute bottom-6 text-center w-full text-green-300/30 text-xs font-light tracking-widest">
                &copy; 2026 KOPERASI PEMASARAN KARYA KITA JAYA. ALL RIGHTS RESERVED.
            </div>

        </div>
    );
};