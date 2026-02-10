import React, { useState } from 'react';
import { formatRupiah, cn } from '../../lib/utils';
import { Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowRightLeft, History } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BalanceSectionProps {
    taproBalance: number;
    otherAssetsBalance: number;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({ taproBalance, otherAssetsBalance }) => {
    const [showBalance, setShowBalance] = useState(true);

    const actions = [
        { label: 'Top Up', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup' }, // [cite: 42]
        { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik' }, // [cite: 43]
        { label: 'Kirim', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim' }, // [cite: 44]
        { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat' }, // [cite: 45]
    ];

    return (
        <div className="px-4 -mt-8 relative z-20">
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                {/* Main Balance (TAPRO) [cite: 39] */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo TAPRO</span>
                            <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400 hover:text-kkj-blue">
                                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {showBalance ? formatRupiah(taproBalance) : 'Rp ••••••••'}
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-kkj-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-kkj-blue font-bold text-xs">IDR</span>
                    </div>
                </div>

                {/* Secondary Balance [cite: 40] */}
                <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg mb-6">
                    <span className="text-xs text-gray-500">Total Aset Lain:</span>
                    <span className="text-xs font-semibold text-gray-700">
                        {showBalance ? formatRupiah(otherAssetsBalance) : '••••••'}
                    </span>
                </div>

                {/* Quick Actions Grid [cite: 41] */}
                <div className="grid grid-cols-4 gap-2">
                    {actions.map((action) => (
                        <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-105 shadow-sm", action.bg)}>
                                <action.icon size={22} className={action.color} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                                {action.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};