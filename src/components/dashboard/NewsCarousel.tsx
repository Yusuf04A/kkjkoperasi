import React from 'react';
import { ArrowRight } from 'lucide-react';

export const NewsCarousel = () => {
    const news = [
        {
            id: 1,
            title: "Promo Spesial Kredit Barang",
            desc: "Bunga ringan 10% per tahun untuk elektronik.",
            color: "bg-blue-600"
        },
        {
            id: 2,
            title: "RAT Tahun Buku 2025",
            desc: "Undangan Rapat Anggota Tahunan.",
            color: "bg-kkj-gold"
        },
        {
            id: 3,
            title: "Investasi Emas",
            desc: "Mulai menabung emas sekarang di TAMASA.",
            color: "bg-green-600"
        }
    ];

    return (
        <div className="py-6 px-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Kabar KKJ Hari Ini</h3>
                <button className="text-xs text-kkj-blue flex items-center gap-1 font-medium hover:underline">
                    Lihat Semua <ArrowRight size={12} />
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {news.map((item) => (
                    <div
                        key={item.id}
                        className="min-w-[280px] snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Image Placeholder */}
                        <div className={`h-32 w-full ${item.color} flex items-center justify-center text-white font-bold text-2xl relative`}>
                            <div className="absolute inset-0 bg-black/10"></div>
                            <span className="relative z-10">PROMO</span>
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};