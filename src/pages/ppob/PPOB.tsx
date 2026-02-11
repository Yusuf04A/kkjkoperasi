import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Zap, Wifi, Droplets, Gamepad2, CreditCard, Construction, Clock, ChevronRight } from 'lucide-react';

export const PPOB = () => {
    const navigate = useNavigate();

    // Daftar layanan yang akan datang
    const upcomingServices = [
        { name: 'Pulsa & Data', icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Token Listrik', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { name: 'Internet', icon: Wifi, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'PDAM', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { name: 'Voucher Game', icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'E-Money', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* HEADER STICKY */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-base font-bold text-gray-900">
                        Layanan PPOB
                    </h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 lg:p-10">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                    {/* KOLOM KIRI: HERO INFO (Lebih besar di Desktop) */}
                    <div className="bg-white rounded-[2rem] p-8 lg:p-12 border border-gray-100 shadow-xl text-center lg:text-left relative overflow-hidden group">
                        {/* Dekorasi Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-50 rounded-full blur-3xl -ml-10 -mb-10 opacity-60"></div>

                        <div className="relative z-10 flex flex-col items-center lg:items-start">
                            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-blue-50/80 rounded-full flex items-center justify-center mb-6 relative border-4 border-white shadow-sm">
                                <Construction size={48} className="text-kkj-blue w-12 h-12 lg:w-16 lg:h-16" />
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 lg:p-3 rounded-full border-4 border-white shadow-sm">
                                    <Clock size={20} className="text-white lg:w-6 lg:h-6" />
                                </div>
                            </div>

                            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">
                                Fitur Segera Hadir!
                            </h2>
                            <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-8 max-w-md">
                                Kami sedang menyiapkan sistem PPOB yang terintegrasi penuh. Bayar tagihan, beli pulsa, dan top up e-money jadi lebih mudah lewat satu aplikasi.
                            </p>

                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3.5 bg-kkj-blue text-white rounded-xl font-bold text-sm lg:text-base hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2 group-hover:gap-3"
                            >
                                Kembali ke Dashboard <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* KOLOM KANAN: PREVIEW LAYANAN (Grid) */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                                Layanan Mendatang
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 lg:gap-6">
                                {upcomingServices.map((service, idx) => (
                                    <div key={idx} className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed hover:shadow-md hover:-translate-y-1">
                                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center ${service.bg}`}>
                                            <service.icon size={24} className={`${service.color} lg:w-7 lg:h-7`} />
                                        </div>
                                        <span className="text-xs lg:text-sm font-medium text-gray-600 text-center leading-tight">
                                            {service.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INFO BOX */}
                        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                            <div className="p-2 bg-yellow-100 rounded-full shrink-0 text-yellow-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-800 text-sm mb-1">Nantikan Update Selanjutnya</h4>
                                <p className="text-xs lg:text-sm text-yellow-700/80 leading-relaxed">
                                    Anda akan mendapatkan notifikasi otomatis saat fitur ini siap digunakan. Pastikan aplikasi Anda selalu dalam versi terbaru.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};