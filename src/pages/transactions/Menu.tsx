import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Send, History, ArrowLeft, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah } from '../../lib/utils';

export const TransactionMenu = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const menus = [
        { label: 'Isi Saldo', path: '/transaksi/topup', icon: <ArrowDownLeft size={28} />, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
        { label: 'Tarik Tunai', path: '/transaksi/tarik', icon: <ArrowUpRight size={28} />, color: 'bg-red-100 text-red-600', border: 'border-red-200' },
        { label: 'Kirim Uang', path: '/transaksi/kirim', icon: <Send size={28} />, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
        { label: 'Riwayat', path: '/transaksi/riwayat', icon: <History size={28} />, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/')} className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Menu Transaksi</h1>
            </div>

            {/* Saldo Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Saldo Tapro</p>
                    <p className="text-lg font-bold text-kkj-blue">{formatRupiah(user?.tapro_balance || 0)}</p>
                </div>
                <Wallet className="text-gray-300" size={32} />
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-4">
                {menus.map((item) => (
                    <Link key={item.path} to={item.path} className={`bg-white p-6 rounded-3xl shadow-sm border ${item.border} flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95 h-40`}>
                        <div className={`p-4 rounded-full ${item.color}`}>
                            {item.icon}
                        </div>
                        <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};