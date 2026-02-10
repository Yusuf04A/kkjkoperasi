import React from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Store, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';

export const FinancingMenu = () => {
    const loanTypes = [
        {
            id: 'barang',
            title: 'Kredit Barang',
            desc: 'Cicilan elektronik & furnitur',
            icon: Laptop,
            color: 'bg-blue-100 text-blue-600',
            rate: 'Margin 10% / tahun' // 
        },
        {
            id: 'modal',
            title: 'Modal Usaha',
            desc: 'Pengembangan bisnis anggota',
            icon: Store,
            color: 'bg-green-100 text-green-600',
            rate: 'Margin 10% / tahun' // 
        },
        {
            id: 'pelatihan',
            title: 'Biaya Pelatihan',
            desc: 'Peningkatan skill & sertifikasi',
            icon: BookOpen,
            color: 'bg-orange-100 text-orange-600',
            rate: 'Jasa 0.6% / bulan' // 
        },
        {
            id: 'pendidikan',
            title: 'Biaya Pendidikan',
            desc: 'Biaya sekolah & kuliah anak',
            icon: GraduationCap,
            color: 'bg-purple-100 text-purple-600',
            rate: 'Jasa 0.6% / bulan' // 
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="bg-kkj-blue p-6 rounded-2xl text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">Layanan Pembiayaan</h1>
                <p className="text-blue-100 opacity-90">
                    Solusi keuangan syariah untuk kebutuhan produktif dan konsumtif anggota koperasi.
                </p>
            </div>

            <h2 className="text-lg font-bold text-gray-800">Pilih Jenis Pembiayaan</h2>

            {/* Grid Layout: 1 kolom di HP, 2 kolom di Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loanTypes.map((item) => (
                    <Link
                        key={item.id}
                        to={`/pembiayaan/ajukan?type=${item.id}`}
                        className="flex items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-kkj-gold transition-all group"
                    >
                        <div className={`p-4 rounded-xl ${item.color} mr-4 group-hover:scale-110 transition-transform`}>
                            <item.icon size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{item.title}</h3>
                            <p className="text-xs text-gray-500 mb-1">{item.desc}</p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {item.rate}
                            </span>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-kkj-blue" />
                    </Link>
                ))}
            </div>
        </div>
    );
};