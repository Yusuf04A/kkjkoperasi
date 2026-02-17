import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import {
    Check, X, Loader2, RefreshCw, ArrowLeft, Search,
    ChevronRight, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const AdminFinancing = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

    const fetchLoans = async () => {
        setLoading(true);
        try {
            // Panggil API Laravel: GET /admin/financing
            // Mengirim parameter tab untuk filter status di backend
            const response = await API.get('/admin/financing', {
                params: { tab: activeTab }
            });
            setLoans(response.data || []);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
            toast.error("Gagal mengambil data pembiayaan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [activeTab]);

    // LOGIC ACC/REJECT
    const handleApprove = async (loan: any) => {
        const confirm = window.confirm(`Setujui pembiayaan ${loan.type} sebesar ${formatRupiah(loan.amount)}?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses...');
        try {
            // Endpoint Laravel: POST /admin/financing/{id}/approve
            // Backend akan menangani pembuatan jadwal angsuran (installments)
            await API.post(`/admin/financing/${loan.id}/approve`);
            
            toast.success('Disetujui & Dicairkan', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Gagal: ${msg}`, { id: toastId });
        }
    };

    const handleReject = async (id: number) => {
        const reason = window.prompt("Alasan penolakan:");
        if (!reason) return;

        const toastId = toast.loading('Menolak...');
        try {
            // Endpoint Laravel: POST /admin/financing/{id}/reject
            await API.post(`/admin/financing/${id}/reject`, {
                reason: reason
            });

            toast.success('Ditolak', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Gagal: ${msg}`, { id: toastId });
        }
    };

    // Helper: Render Detail Kecil
    const renderDetailBadge = (loan: any) => {
        if (!loan.details) return null;
        // Parsing details jika dikirim sebagai string JSON dari Laravel
        const details = typeof loan.details === 'string' ? JSON.parse(loan.details) : loan.details;
        
        let text = "";
        if (loan.type === 'Kredit Barang') text = details.item_name || details.item;
        else if (loan.type === 'Modal Usaha') text = details.business_name;
        else if (loan.type === 'Biaya Pelatihan') text = details.training_name;
        else if (loan.type === 'Biaya Pendidikan') text = details.child_name;

        if (!text) return null;

        return (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[150px] inline-block">
                {text}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">

            {/* === HEADER === */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 w-fit text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pembiayaan</h1>
                        <p className="text-gray-500 mt-1 text-sm">Monitoring pengajuan, pinjaman berjalan, dan riwayat arsip.</p>
                    </div>

                    <button
                        onClick={fetchLoans}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="flex items-center gap-8 border-b border-gray-200 mt-6 overflow-x-auto">
                    {[
                        { id: 'pending', label: 'Menunggu Approval' },
                        { id: 'active', label: 'Pinjaman Berjalan' },
                        { id: 'history', label: 'Riwayat Arsip' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* === CONTENT LIST === */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                        <span className="text-gray-400 text-sm font-medium">Memuat data...</span>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                            <Search size={28} />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Tidak ada data ditemukan di tab ini.</p>
                    </div>
                ) : (
                    loans.map((loan) => (
                        <div key={loan.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                                {/* 1. Identitas & Info Dasar */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                                        {loan.user?.name?.charAt(0) || 'U'}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">
                                                {loan.user?.name}
                                            </h3>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded border border-gray-200">
                                                {loan.user?.member_id}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                                            <span className="text-blue-600 font-medium">{loan.type}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{loan.duration} Bulan</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} /> {format(new Date(loan.created_at), 'dd MMM yyyy', { locale: indonesia })}
                                            </span>
                                        </div>

                                        <div className="mt-1">{renderDetailBadge(loan)}</div>
                                    </div>
                                </div>

                                {/* 2. Nominal & Status */}
                                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">NOMINAL</p>
                                        <p className="font-bold text-gray-900 text-sm md:text-base">{formatRupiah(loan.amount)}</p>
                                    </div>

                                    <div>
                                        <span className={cn(
                                            "px-2.5 py-1 rounded text-xs font-bold border",
                                            loan.status === 'pending' ? "bg-orange-50 text-orange-700 border-orange-100" :
                                            loan.status === 'active' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                            loan.status === 'paid' ? "bg-green-50 text-green-700 border-green-100" :
                                            "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {loan.status === 'active' ? 'Berjalan' : loan.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* 3. Action Buttons */}
                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 md:pl-4 md:border-l border-gray-100">
                                    {loan.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(loan)}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                                            >
                                                <Check size={14} /> Setujui
                                            </button>
                                            <button
                                                onClick={() => handleReject(loan.id)}
                                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                                <X size={14} /> Tolak
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            to={`/admin/pembiayaan/${loan.id}`}
                                            className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 transition-colors ${loan.status === 'active'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {loan.status === 'active' ? 'Pantau' : 'Detail'} <ChevronRight size={14} />
                                        </Link>
                                    )}
                                </div>

                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};