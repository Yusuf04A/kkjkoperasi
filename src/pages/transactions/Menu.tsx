import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PiggyBank, Smartphone,
    ArrowUpRight, ArrowRightLeft, History, PlusCircle,
    Zap, Droplets, Globe, Building, Coins, Gamepad2, CreditCard,
    Wallet
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const TransactionMenu = () => {
    const navigate = useNavigate();

    const menuGroups = [
        {
            title: "Keuangan Utama",
            items: [
                { label: 'Isi Saldo', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/transaksi/topup', desc: 'Isi ulang saldo Tapro' },
                { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik', desc: 'Cairkan saldo Anda' },
                { label: 'Kirim Uang', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim', desc: 'Transfer sesama anggota' },
                { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat', desc: 'Lihat mutasi rekening' },
            ]
        },
        {
            title: "Simpanan & Investasi",
            items: [
                { label: 'Setor Simpanan', icon: PiggyBank, color: 'text-green-700', bg: 'bg-green-50', link: '/transaksi/setor', desc: 'Simpanan wajib, qurban, dll' },
                { label: 'Tabungan Emas', icon: Coins, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/program/tamasa', desc: 'Investasi emas Tamasa' },
                { label: 'Properti', icon: Building, color: 'text-[#136f42]', bg: 'bg-green-50', link: '/program/inflip', desc: 'Investasi properti Inflip' },
                { label: 'Pegadaian', icon: Wallet, color: 'text-[#136f42]', bg: 'bg-green-50', link: '/program/pegadaian', desc: 'Gadai emas syariah' },
            ]
        },
        {
            title: "Pembayaran & Tagihan (PPOB)",
            items: [
                { label: 'Pulsa & Data', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50', link: '/ppob', desc: 'Isi pulsa dan paket data' },
                { label: 'Token Listrik', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/ppob', desc: 'Beli token listrik PLN' },
                { label: 'PDAM', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', link: '/ppob', desc: 'Bayar tagihan air minum' },
                { label: 'Internet', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/ppob', desc: 'Bayar Wifi dan TV kabel' },
                { label: 'E-Money', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/ppob', desc: 'Top up saldo e-wallet' },
                { label: 'Voucher Game', icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-50', link: '/ppob', desc: 'Beli voucher game online' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 leading-none">
                        Pusat Transaksi
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-green-50 flex flex-col h-full hover:shadow-md transition-all">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-2 border-b border-slate-50 pb-4">
                                <span className="w-1.5 h-4 bg-[#136f42] rounded-full shadow-[0_0_8px_rgba(19,111,66,0.4)]"></span>
                                {group.title}
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {group.items.map((item, itemIdx) => (
                                    <button
                                        key={itemIdx}
                                        onClick={() => navigate(item.link)}
                                        className="flex flex-col items-start p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-green-100 hover:shadow-xl hover:shadow-green-900/5 transition-all group active:scale-95 text-left"
                                    >
                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm",
                                            item.bg, item.color
                                        )}>
                                            <item.icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm mb-0.5 tracking-tight group-hover:text-[#136f42] transition-colors">
                                            {item.label}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500 leading-tight line-clamp-2 group-hover:text-slate-600 transition-colors">
                                            {item.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] pt-6">
                    © 2026 Koperasi Pemasaran Karya Kita Jaya
                </p>
            </div>
        </div>
    );
};