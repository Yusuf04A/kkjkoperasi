import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, Calendar, FileText, User, Archive, Clock, Activity, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export const AdminFinancing = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // KITA PISAH JADI 3 TAB BIAR RAPI
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

    const fetchLoans = async () => {
        setLoading(true);

        let query = supabase
            .from('loans')
            .select(`
        *,
        profiles ( full_name, member_id, phone )
      `)
            .order('created_at', { ascending: false });

        // LOGIKA FILTER TAB
        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else if (activeTab === 'active') {
            query = query.eq('status', 'active'); // Khusus yang sedang berjalan (Lihat Cicilan)
        } else {
            query = query.in('status', ['paid', 'rejected']); // Murni Riwayat (Lunas/Tolak)
        }

        const { data, error } = await query;

        if (error) {
            toast.error("Gagal mengambil data");
        } else {
            setLoans(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLoans();
    }, [activeTab]);

    // LOGIC ACC
    const handleApprove = async (loan) => {
        const confirm = window.confirm(`Setujui pembiayaan ${loan.type} sebesar ${formatRupiah(loan.amount)}?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses pencairan dana...');
        try {
            const { error } = await supabase.rpc('approve_loan', { loan_id_param: loan.id });
            if (error) throw error;
            toast.success('Berhasil! Dana dicairkan.', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Alasan penolakan:");
        if (!reason) return;

        const toastId = toast.loading('Menolak...');
        try {
            const { error } = await supabase.from('loans').update({ status: 'rejected', reason: reason }).eq('id', id);
            if (error) throw error;
            toast.success('Pengajuan ditolak.', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    const renderDetails = (loan) => {
        if (!loan.details || Object.keys(loan.details).length === 0) return null;
        return (
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 border border-gray-100 mt-2">
                <p className="font-bold text-gray-400 mb-1 uppercase">Detail:</p>
                {/* Logic render detail sama seperti sebelumnya */}
                {loan.type === 'Kredit Barang' && <p>{loan.details.item} - {loan.details.price}</p>}
                {loan.type === 'Modal Usaha' && <p>{loan.details.business_name} ({loan.details.business_type})</p>}
                {loan.type === 'Biaya Pelatihan' && <p>{loan.details.training_name}</p>}
                {loan.type === 'Biaya Pendidikan' && <p>{loan.details.child_name} ({loan.details.school_name})</p>}
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">

            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kelola Pinjaman</h1>
                        <p className="text-sm text-gray-500">Approval & Monitoring Cicilan Anggota</p>
                    </div>
                    <button onClick={fetchLoans} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* 3 TAB NAVIGATION (NEW) */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                {/* TAB 1: PENDING */}
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={16} /> Menunggu Approval
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>

                {/* TAB 2: ACTIVE (MONITORING) */}
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'active' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Activity size={16} /> Pinjaman Berjalan
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>

                {/* TAB 3: HISTORY (LUNAS/TOLAK) */}
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'history' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Archive size={16} /> Arsip Riwayat
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : loans.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                            {activeTab === 'pending' ? <Clock size={32} /> : activeTab === 'active' ? <Activity size={32} /> : <CheckCircle size={32} />}
                        </div>
                        <p>Tidak ada data di tab {activeTab === 'pending' ? 'pending' : activeTab === 'active' ? 'berjalan' : 'riwayat'}.</p>
                    </div>
                ) : (
                    loans.map((loan) => (
                        <div key={loan.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">

                            {/* Kolom Info */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{loan.profiles?.full_name || 'Tanpa Nama'}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <User size={12} /> {loan.profiles?.member_id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${loan.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                loan.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    loan.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {loan.status === 'active' ? 'Berjalan' : loan.status === 'paid' ? 'Lunas' : loan.status}
                                        </span>
                                        {activeTab !== 'pending' && (
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {format(new Date(loan.created_at), 'dd MMM yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-gray-400">Total Pinjaman</p>
                                        <p className="text-xl font-bold text-kkj-blue">{formatRupiah(loan.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Tipe & Tenor</p>
                                        <p className="font-bold text-gray-700 flex items-center gap-1 text-sm">
                                            {loan.type} • {loan.duration} Bln
                                        </p>
                                    </div>
                                </div>

                                {renderDetails(loan)}
                            </div>

                            {/* Kolom Aksi */}
                            <div className="flex flex-col justify-center gap-3 md:border-l md:pl-6 border-gray-100 min-w-[200px]">
                                <div className="text-right mb-2">
                                    <p className="text-xs text-gray-400">Cicilan / Bulan</p>
                                    <p className="font-bold text-gray-800">{formatRupiah(loan.monthly_payment)}</p>
                                </div>

                                {/* AKSI BERDASARKAN TAB */}
                                {loan.status === 'pending' ? (
                                    <>
                                        <button onClick={() => handleApprove(loan)} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                                            <Check size={18} /> Setujui
                                        </button>
                                        <button onClick={() => handleReject(loan.id)} className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2">
                                            <X size={18} /> Tolak
                                        </button>
                                    </>
                                ) : loan.status === 'active' ? (
                                    // TOMBOL SPESIAL BUAT TAB 'BERJALAN'
                                    <Link
                                        to={`/admin/pembiayaan/${loan.id}`}
                                        className="w-full py-3 bg-blue-50 text-kkj-blue border border-blue-200 rounded-lg hover:bg-blue-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Activity size={18} /> Pantau Cicilan
                                    </Link>
                                ) : (
                                    // TOMBOL BUAT HISTORY (Cuma lihat sekilas)
                                    <Link
                                        to={`/admin/pembiayaan/${loan.id}`}
                                        className="w-full py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <FileText size={18} /> Detail Arsip
                                    </Link>
                                )}
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};