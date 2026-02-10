import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle, User, Phone, XCircle } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const AdminLoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Ambil Data Pinjaman + Profil User
            const { data: loanData } = await supabase
                .from('loans')
                .select(`
                *,
                profiles ( full_name, member_id, phone, email )
            `)
                .eq('id', id)
                .single();

            setLoan(loanData);

            // Ambil Jadwal Cicilan
            if (loanData) {
                const { data: instData } = await supabase
                    .from('installments')
                    .select('*')
                    .eq('loan_id', id)
                    .order('due_date', { ascending: true });
                setInstallments(instData || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat data...</div>;
    if (!loan) return <div className="p-10 text-center text-red-500">Data tidak ditemukan</div>;

    // Statistik Ringkas
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = (paidCount / installments.length) * 100;

    return (
        <div className="p-6 max-w-5xl mx-auto min-h-screen bg-gray-50">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/pembiayaan')} className="p-2 bg-white rounded-lg border hover:bg-gray-50">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Pinjaman Anggota</h1>
                    <p className="text-sm text-gray-500">Pantau progres pembayaran angsuran.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* KOLOM KIRI: INFO ANGGOTA & KREDIT */}
                <div className="space-y-6">
                    {/* Card Info User */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informasi Peminjam</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{loan.profiles?.full_name}</p>
                                <p className="text-xs text-gray-500">{loan.profiles?.member_id}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">No HP</span>
                                <span className="font-medium">{loan.profiles?.phone}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium">{loan.profiles?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card Info Pinjaman */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ringkasan Kredit</h3>
                        <div className="mb-4">
                            <p className="text-3xl font-bold text-kkj-blue">{formatRupiah(loan.amount)}</p>
                            <span className="text-sm font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded mt-1 inline-block">
                                {loan.type}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tenor</span>
                                <span className="font-bold">{loan.duration} Bulan</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-bold px-2 rounded text-xs ${loan.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {loan.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="pt-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Progress Bayar</span>
                                    <span className="font-bold">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: JADWAL CICILAN */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} /> Kartu Cicilan
                            </h3>
                            <span className="text-xs font-bold text-gray-500">
                                {paidCount} / {installments.length} Lunas
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {installments.map((item, index) => {
                                const isPaid = item.status === 'paid';
                                const dueDate = new Date(item.due_date);
                                const isOverdue = !isPaid && dueDate < new Date();

                                return (
                                    <div key={item.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isPaid ? 'bg-green-50/30' : ''
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{formatRupiah(item.amount)}</p>
                                                <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'
                                                    }`}>
                                                    Jatuh Tempo: {format(dueDate, 'dd MMMM yyyy', { locale: indonesia })}
                                                    {isOverdue && <span className="bg-red-100 text-red-600 px-1.5 rounded text-[10px]">TERLAMBAT</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {isPaid ? (
                                                <div className="flex items-center gap-1 text-green-600 bg-white border border-green-200 px-3 py-1 rounded-full shadow-sm">
                                                    <CheckCircle size={14} />
                                                    <span className="text-xs font-bold">LUNAS</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <XCircle size={14} />
                                                    <span className="text-xs">Belum Bayar</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};