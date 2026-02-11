import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle, User, XCircle, AlertTriangle, Check, X, MessageSquare } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const AdminLoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // FETCH DATA
    const fetchData = async () => {
        setLoading(true);

        // 1. Ambil Data Pinjaman
        const { data: loanData, error } = await supabase
            .from('loans')
            .select(`*, profiles ( full_name, member_id, phone, avatar_url )`)
            .eq('id', id).single();

        // PERBAIKAN BUG DISINI: Ganti 'if(data)' jadi 'if(loanData)'
        if (loanData) {
            setLoan(loanData);
            // 2. Ambil Cicilan
            const { data: instData } = await supabase
                .from('installments').select('*').eq('loan_id', id).order('due_date', { ascending: true });
            setInstallments(instData || []);
        } else {
            console.error("Error loading loan:", error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [id]);

    // LOGIC ACC PERPANJANGAN
    const handleApproveRestructure = async () => {
        const confirm = window.confirm(`Setujui perpanjangan tenor menjadi ${loan.restructure_req_duration} bulan?\nCicilan akan dihitung ulang.`);
        if (!confirm) return;

        const toastId = toast.loading('Menghitung ulang cicilan...');
        try {
            const { error } = await supabase.rpc('approve_restructure', { loan_id_param: loan.id });
            if (error) throw error;
            toast.success('Berhasil diperpanjang!', { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        }
    };

    const handleRejectRestructure = async () => {
        const toastId = toast.loading('Menolak...');
        await supabase.from('loans').update({ restructure_status: 'rejected', restructure_req_duration: null }).eq('id', loan.id);
        toast.success('Ditolak', { id: toastId });
        fetchData();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data...</div>;
    if (!loan) return <div className="text-center p-10">Data tidak ditemukan.</div>;

    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">

            <div className="mb-6">
                <button onClick={() => navigate('/admin/pembiayaan')} className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue font-bold">
                    <ArrowLeft size={20} /> Kembali ke Daftar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* KOLOM KIRI */}
                <div className="space-y-6">

                    {/* ALERT: REQUEST PERPANJANGAN (DISINI ADMIN LIHAT ALASANNYA) */}
                    {loan.restructure_status === 'pending' && (
                        <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl shadow-sm animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="w-full">
                                    <h4 className="font-bold text-orange-900">Pengajuan Perpanjangan</h4>
                                    <p className="text-sm text-orange-800 mt-1 leading-snug">
                                        Member meminta ubah tenor dari <b>{loan.duration} Bulan</b> menjadi <b className="text-lg">{loan.restructure_req_duration} Bulan</b>.
                                    </p>

                                    {/* ALASAN USER DITAMPILKAN DISINI */}
                                    <div className="mt-3 bg-white p-3 rounded-lg border border-orange-100 text-sm text-gray-600 italic flex gap-2">
                                        <MessageSquare size={16} className="shrink-0 mt-0.5" />
                                        "{loan.restructure_reason}"
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleApproveRestructure} className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 hover:bg-green-700 shadow-sm">
                                            <Check size={14} /> Setujui
                                        </button>
                                        <button onClick={handleRejectRestructure} className="flex-1 bg-white border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 hover:bg-red-50">
                                            <X size={14} /> Tolak
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profil Peminjam */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Peminjam</h3>
                        <div className="flex items-center gap-4">
                            <img
                                src={loan.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${loan.profiles?.full_name}&background=0D8ABC&color=fff`}
                                alt="Profile"
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                            />
                            <div>
                                <p className="font-bold text-gray-900 text-lg leading-tight">{loan.profiles?.full_name}</p>
                                <p className="text-sm text-gray-500">{loan.profiles?.member_id}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">No HP</span>
                            <span className="font-medium">{loan.profiles?.phone || '-'}</span>
                        </div>
                    </div>

                    {/* Info Pinjaman */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sisa Pinjaman</h3>
                        <p className="text-3xl font-bold text-kkj-blue">{formatRupiah(loan.amount)}</p>
                        <div className="mt-1 mb-6"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{loan.type}</span></div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Tenor Saat Ini</span>
                                <span className="font-bold text-gray-900">{loan.duration} Bulan</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cicilan/Bulan</span>
                                <span className="font-bold text-gray-900">{formatRupiah(loan.monthly_payment)}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-500">Progress</span>
                                <span className="font-bold text-green-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN (List Cicilan) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-fit">
                    <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={18} /> Kartu Cicilan</h3>
                        <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                            {paidCount} / {installments.length} Lunas
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {installments.map((item, index) => {
                            const isPaid = item.status === 'paid';
                            const dueDate = new Date(item.due_date);
                            const isOverdue = !isPaid && dueDate < new Date();

                            return (
                                <div key={item.id} className={`p-5 flex items-center justify-between transition-colors ${isPaid ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{formatRupiah(item.amount)}</p>
                                            <p className={`text-xs mt-1 flex items-center gap-2 font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                                Jatuh Tempo: {format(dueDate, 'dd MMMM yyyy', { locale: indonesia })}
                                                {isOverdue && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">TERLAMBAT</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {isPaid ? (
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 px-3 py-1 rounded-full">
                                                <CheckCircle size={14} /> LUNAS
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-300"><XCircle size={24} strokeWidth={1.5} /></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};