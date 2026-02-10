import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, Calendar, FileText, User, Archive, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export const AdminFinancing = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // STATE TAB
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const fetchLoans = async () => {
        setLoading(true);

        let query = supabase
            .from('loans')
            .select(`
        *,
        profiles ( full_name, member_id, phone )
      `)
            .order('created_at', { ascending: false });

        // FILTER BERDASARKAN TAB
        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            // Ambil yang BUKAN pending (active, rejected, paid)
            query = query.neq('status', 'pending');
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
    }, [activeTab]); // Fetch ulang saat ganti tab

    // LOGIC ACC PINJAMAN
    const handleApprove = async (loan) => {
        const confirm = window.confirm(`Setujui pembiayaan ${loan.type} sebesar ${formatRupiah(loan.amount)} untuk ${loan.profiles?.full_name}?`);
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
            const { error } = await supabase
                .from('loans')
                .update({ status: 'rejected', reason: reason })
                .eq('id', id);

            if (error) throw error;
            toast.success('Pengajuan ditolak.', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    // Helper render detail json
    const renderDetails = (loan) => {
        if (!loan.details) return <p className="text-xs italic text-gray-400">Tidak ada detail.</p>;

        return (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100 space-y-1 mt-2">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Detail Pengajuan:</p>
                {loan.type === 'Kredit Barang' && (
                    <>
                        <p>Barang: <b>{loan.details.item}</b></p>
                        <p>Harga: {loan.details.price} (DP: {loan.details.dp})</p>
                    </>
                )}
                {loan.type === 'Modal Usaha' && (
                    <>
                        <p>Usaha: <b>{loan.details.business_name}</b> ({loan.details.business_type})</p>
                        <p>Omset: {formatRupiah(loan.details.daily_revenue || 0)}/hari</p>
                        <p>Peruntukan: {loan.details.purpose}</p>
                    </>
                )}
                {loan.type === 'Biaya Pelatihan' && (
                    <>
                        <p>Pelatihan: <b>{loan.details.training_name}</b></p>
                        <p>Jenis: {loan.details.training_type}</p>
                    </>
                )}
                {loan.type === 'Biaya Pendidikan' && (
                    <>
                        <p>Siswa: <b>{loan.details.child_name}</b></p>
                        <p>Sekolah: {loan.details.school_name}</p>
                        <p>Peruntukan: {loan.details.purpose}</p>
                    </>
                )}
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
                        <h1 className="text-2xl font-bold text-gray-900">Persetujuan Pembiayaan</h1>
                        <p className="text-sm text-gray-500">Review pengajuan kredit anggota</p>
                    </div>
                    <button onClick={fetchLoans} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Menunggu Persetujuan
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'history' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Riwayat (Selesai)
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* LIST CARD */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : loans.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                        <Archive size={40} className="mx-auto text-gray-300 mb-2" />
                        <p>Tidak ada data {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                    </div>
                ) : (
                    loans.map((loan) => (
                        <div key={loan.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">

                            {/* Info User & Pinjaman */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{loan.profiles?.full_name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <User size={12} /> {loan.profiles?.member_id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${loan.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                                loan.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {loan.status === 'active' ? 'AKTIF (Disetujui)' : loan.status.toUpperCase()}
                                        </span>
                                        {activeTab === 'history' && (
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {format(new Date(loan.created_at), 'dd MMM yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-gray-400">Nominal Pokok</p>
                                        <p className="text-xl font-bold text-kkj-blue">{formatRupiah(loan.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Tenor</p>
                                        <p className="font-bold text-gray-700 flex items-center gap-1">
                                            <Calendar size={16} className="text-orange-500" /> {loan.duration} Bulan
                                        </p>
                                    </div>
                                </div>

                                {/* DETAIL KHUSUS */}
                                {renderDetails(loan)}

                            </div>

                            {/* Action Panel / Status Panel */}
                            <div className="flex flex-col justify-center gap-3 md:border-l md:pl-6 border-gray-100 min-w-[200px]">
                                <div className="text-right mb-2">
                                    <p className="text-xs text-gray-400">Cicilan / Bulan</p>
                                    <p className="font-bold text-gray-800">{formatRupiah(loan.monthly_payment)}</p>
                                </div>

                                {/* HANYA TAMPILKAN TOMBOL JIKA STATUS PENDING */}
                                {loan.status === 'pending' ? (
                                    <>
                                        <button onClick={() => handleApprove(loan)} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                                            <Check size={18} /> Setujui
                                        </button>
                                        <button onClick={() => handleReject(loan.id)} className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2">
                                            <X size={18} /> Tolak
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
                                        {loan.status === 'active' ? (
                                            <div className="text-green-600 text-sm font-bold flex flex-col items-center">
                                                <Check size={24} className="mb-1" /> Dana Cair
                                            </div>
                                        ) : (
                                            <div className="text-red-400 text-sm font-bold flex flex-col items-center">
                                                <X size={24} className="mb-1" /> Ditolak
                                                <p className="text-xs font-normal text-gray-500 mt-1 max-w-[150px]">{loan.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};