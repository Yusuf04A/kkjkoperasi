import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, FileText, Calendar, Clock } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';

export const FinancingMenu = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loans, setLoans] = useState<any[]>([]);

    useEffect(() => {
        const fetchLoans = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setLoans(data);
        };
        fetchLoans();
    }, [user]);

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-kkj-blue to-blue-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold">Pembiayaan</h1>
                    <p className="text-blue-100 text-sm mt-1">Solusi dana cepat untuk kebutuhan Anda.</p>
                </div>
                <Link to="/pembiayaan/ajukan" className="relative z-10 bg-white text-kkj-blue px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2">
                    <Plus size={16} /> Ajukan Baru
                </Link>
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            </div>

            <h2 className="font-bold text-gray-800 text-lg">Riwayat Pengajuan</h2>

            {loans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada pengajuan pembiayaan.</p>
                    <Link to="/pembiayaan/ajukan" className="text-kkj-blue font-bold text-sm mt-2 hover:underline">
                        Mulai ajukan sekarang
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {loans.map((loan) => (
                        <div key={loan.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            {/* Status Badge */}
                            <div className="absolute top-0 right-0 p-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${loan.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                        loan.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                            loan.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-600'
                                    }`}>
                                    {loan.status === 'active' ? 'Berjalan' : loan.status === 'paid' ? 'Lunas' : loan.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-gray-400 font-bold mb-1">{loan.type.toUpperCase()}</p>
                                <h3 className="text-xl font-bold text-gray-900">{formatRupiah(loan.amount)}</h3>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                    <Calendar size={14} /> Tenor {loan.duration} Bulan
                                </p>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400">Cicilan per bulan</p>
                                    <p className="font-bold text-gray-800">{formatRupiah(loan.monthly_payment)}</p>
                                </div>

                                {/* Tombol Aksi */}
                                {loan.status === 'active' || loan.status === 'paid' ? (
                                    <Link to={`/pembiayaan/${loan.id}`} className="bg-gray-50 hover:bg-kkj-blue hover:text-white text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                                        Lihat Tagihan <ArrowRight size={16} />
                                    </Link>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Menunggu persetujuan admin</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};