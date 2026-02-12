import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah } from '../../lib/utils';
import {
    ArrowLeft, Wallet, PiggyBank, Smartphone,
    ArrowUpRight, ArrowRightLeft, History, PlusCircle,
    Zap, Droplets, Globe, Building, Coins, Gamepad2, CreditCard
} from 'lucide-react';

export const TransactionMenu = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const menuGroups = [
        {
            title: "Keuangan Utama",
            items: [
                { label: 'Isi Saldo', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup', desc: 'Top Up Tapro' },
                { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik', desc: 'Cairkan Saldo' },
                { label: 'Kirim Uang', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim', desc: 'Transfer' },
                { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat', desc: 'Mutasi Rekening' },
            ]
        },
        {
            title: "Simpanan & Investasi",
            items: [
                { label: 'Setor Simpanan', icon: PiggyBank, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/transaksi/setor', desc: 'Wajib, Qurban, dll' },
                { label: 'Tabungan Emas', icon: Coins, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/program/tamasa', desc: 'Program TAMASA' },
                { label: 'Properti', icon: Building, color: 'text-blue-600', bg: 'bg-blue-50', link: '/program/inflip', desc: 'Program INFLIP' },
            ]
        },
        {
            title: "Pembayaran & Tagihan (PPOB)",
            items: [
                { label: 'Pulsa & Data', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50', link: '/ppob', desc: 'Beli Pulsa' },
                { label: 'Token Listrik', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/ppob', desc: 'Token PLN' },
                { label: 'PDAM', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', link: '/ppob', desc: 'Tagihan Air' },
                { label: 'Internet', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/ppob', desc: 'Wifi/TV Kabel' },
                { label: 'E-Money', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/ppob', desc: 'Top Up Wallet' },
                { label: 'Voucher Game', icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-50', link: '/ppob', desc: 'Game Online' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* HEADER STICKY */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-base font-bold text-gray-900">Pusat Transaksi</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">

                {/* INFO SALDO (BANNER WIDE) */}
                <div className="bg-gradient-to-r from-[#0B2B4B] to-[#1a4d7a] rounded-3xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Dekorasi Background */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <Wallet size={20} className="text-blue-300" />
                            <span className="text-sm font-medium tracking-wider uppercase">Saldo Tapro Aktif</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold font-mono tracking-tight">
                            {formatRupiah(user?.tapro_balance || 0)}
                        </h2>
                        <p className="text-sm text-blue-200 mt-2 opacity-80">
                            Gunakan saldo ini untuk semua transaksi di Koperasi KKJ.
                        </p>
                    </div>

                    <div className="relative z-10 flex gap-3">
                        <button
                            onClick={() => navigate('/transaksi/topup')}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                        >
                            <PlusCircle size={18} /> Isi Saldo
                        </button>
                        <button
                            onClick={() => navigate('/transaksi/riwayat')}
                            className="bg-white text-[#0B2B4B] hover:bg-blue-50 border border-transparent px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                        >
                            <History size={18} /> Riwayat
                        </button>
                    </div>
                </div>

                {/* GRID LAYOUT UNTUK MENU */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:border-blue-200 transition-colors">
                            <h3 className="font-bold text-gray-800 mb-5 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                <span className="w-1.5 h-4 bg-kkj-blue rounded-full"></span>
                                {group.title}
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {group.items.map((item, itemIdx) => (
                                    <button
                                        key={itemIdx}
                                        onClick={() => navigate(item.link)}
                                        className="flex flex-col items-start p-3.5 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 text-left group active:scale-95"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <item.icon size={22} />
                                        </div>
                                        <span className="font-bold text-gray-900 text-sm mb-0.5">{item.label}</span>
                                        <span className="text-[11px] text-gray-400 leading-tight line-clamp-2">{item.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};