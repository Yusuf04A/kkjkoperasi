import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Check, X, Loader2, RefreshCw, ArrowLeft, Search,
    ChevronRight, Calendar, AlertCircle
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

    // State untuk Modal Kustom (Approval Barang Baru)
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean, loan: any }>({ isOpen: false, loan: null });
    const [finalPrice, setFinalPrice] = useState('');
    const [finalDp, setFinalDp] = useState('');
    const [selectedTenors, setSelectedTenors] = useState<number[]>([3, 6, 12]);
    const [isApproving, setIsApproving] = useState(false);

    const fetchLoans = async () => {
        setLoading(true);
        let query = supabase
            .from('loans')
            .select(`*, profiles ( full_name, member_id, phone, avatar_url )`)
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') query = query.eq('status', 'pending');
        else if (activeTab === 'active') query = query.eq('status', 'active');
        else query = query.in('status', ['paid', 'rejected']);

        const { data, error } = await query;
        if (error) toast.error("Gagal mengambil data");
        else setLoans(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLoans();
    }, [activeTab]);

    // Format Input Rupiah secara Real-time
    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const val = e.target.value.replace(/\D/g, ''); // Hapus semua selain angka
        setter(val ? parseInt(val).toLocaleString('id-ID') : ''); // Format dengan titik
    };

    // Toggle pilihan tenor
    const toggleTenor = (val: number) => {
        setSelectedTenors(prev =>
            prev.includes(val)
                ? prev.filter(t => t !== val)
                : [...prev, val].sort((a, b) => a - b)
        );
    };

    // LOGIC ACC
    const handleInitApprove = (loan: any) => {
        if (loan.type === 'Kredit Barang' && loan.details?.is_custom) {
            // Jika Kustom, buka modal input harga
            setFinalPrice('');
            setFinalDp('');
            setSelectedTenors([3, 6, 12]);
            setApprovalModal({ isOpen: true, loan });
        } else {
            // Jika Reguler (Katalog/Modal/Pelatihan), langsung ACC
            const confirm = window.confirm(`Setujui pembiayaan ${loan.type} sebesar ${formatRupiah(loan.amount)}?`);
            if (confirm) executeApproval(loan.id);
        }
    };

    // Eksekusi ACC Pembiayaan Reguler
    const executeApproval = async (loanId: string) => {
        const toastId = toast.loading('Memproses...');
        try {
            const { error } = await supabase.rpc('approve_loan', { loan_id_param: loanId });
            if (error) throw error;
            toast.success('Disetujui & Dicairkan', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    // Eksekusi ACC Barang Kustom (Simpan ke Katalog & Tolak Pengajuan Awal)
    const submitCustomApproval = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedTenors.length === 0) {
            return toast.error("Pilih minimal 1 tenor!");
        }

        const price = parseInt(finalPrice.replace(/\D/g, '')) || 0;
        const dp = parseInt(finalDp.replace(/\D/g, '')) || 0;

        setIsApproving(true);
        const toastId = toast.loading('Memproses barang ke katalog...');

        try {
            // 1. Simpan Barang Baru ke Katalog Koperasi
            const { error: insertError } = await supabase.from('credit_catalog').insert({
                name: approvalModal.loan.details.item,
                price: price,
                dp: dp,
                tenors: selectedTenors,
                tax: 0,
            });

            if (insertError) throw insertError;

            // 2. Tolak Pengajuan Awal dengan Pesan Khusus
            const reasonMsg = "Barang berhasil diverifikasi Admin dan telah ditambahkan ke Katalog. Silakan ajukan ulang pinjaman Anda melalui menu Katalog dengan harga dan DP yang sudah disesuaikan.";

            const { error: rejectError } = await supabase.from('loans').update({
                status: 'rejected',
                reason: reasonMsg
            }).eq('id', approvalModal.loan.id);

            if (rejectError) throw rejectError;

            // 3. Kirim Notif ke User
            await supabase.from('notifications').insert({
                user_id: approvalModal.loan.user_id,
                title: 'Barang Ditambahkan ke Katalog!',
                message: `Pengajuan kustom barang "${approvalModal.loan.details.item}" telah diACC Admin. Silakan cek katalog dan ajukan ulang.`,
                type: 'success'
            });

            toast.success('Berhasil ditambahkan ke Katalog!', { id: toastId });
            setApprovalModal({ isOpen: false, loan: null });
            fetchLoans();

        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Alasan penolakan:");
        if (!reason) return;

        const toastId = toast.loading('Menolak...');
        try {
            const { error } = await supabase.from('loans').update({ status: 'rejected', reason: reason }).eq('id', id);
            if (error) throw error;
            toast.success('Ditolak', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    const renderDetailBadge = (loan: any) => {
        if (!loan.details) return null;
        let text = "";

        if (loan.type === 'Kredit Barang') {
            text = loan.details.item + (loan.details.is_custom ? ' (Kustom)' : '');
        } else if (loan.type === 'Modal Usaha') text = loan.details.business_name;
        else if (loan.type === 'Biaya Pelatihan') text = loan.details.training_name;
        else if (loan.type === 'Biaya Pendidikan') text = loan.details.child_name;

        if (!text) return null;

        return (
            <span className={`text-[10px] px-2 py-0.5 rounded border truncate max-w-[200px] inline-block mt-1 ${loan.details?.is_custom ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {text}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">

            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 w-fit text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pembiayaan</h1>
                        <p className="text-gray-500 mt-1 text-sm">Monitoring pengajuan dan penambahan barang kustom ke katalog.</p>
                    </div>

                    <button onClick={fetchLoans} className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm active:scale-95" title="Refresh Data">
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-8 border-b border-gray-200 mt-6 overflow-x-auto">
                    {[{ id: 'pending', label: 'Menunggu Approval' }, { id: 'active', label: 'Pinjaman Berjalan' }, { id: 'history', label: 'Riwayat Arsip' }].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500 mb-2" />
                        <span className="text-gray-400 text-sm">Memuat data...</span>
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
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                                        {loan.profiles?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">{loan.profiles?.full_name}</h3>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded border border-gray-200">{loan.profiles?.member_id}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                                            <span className="text-blue-600 font-medium">{loan.type}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{loan.duration} Bulan</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(loan.created_at), 'dd MMM yyyy', { locale: indonesia })}</span>
                                        </div>
                                        {renderDetailBadge(loan)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                                            {loan.details?.is_custom ? 'PERKIRAAN (KUSTOM)' : 'NOMINAL POKOK'}
                                        </p>
                                        <p className="font-bold text-gray-900 text-sm md:text-base">
                                            {loan.amount > 0 ? formatRupiah(loan.amount) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        {loan.status === 'pending' && <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded text-xs font-bold">Menunggu</span>}
                                        {loan.status === 'active' && <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded text-xs font-bold">Berjalan</span>}
                                        {loan.status === 'paid' && <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded text-xs font-bold">Lunas</span>}
                                        {loan.status === 'rejected' && (
                                            loan.reason?.includes('Katalog') ? (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                    Tersedia di Katalog (Ajukan Ulang)
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                    Ditolak
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 md:pl-4 md:border-l border-gray-100">
                                    {loan.status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleInitApprove(loan)} className={`px-3 py-1.5 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1 ${loan.details?.is_custom ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                                <Check size={14} /> {loan.details?.is_custom ? 'Tinjau Barang' : 'Setujui'}
                                            </button>
                                            <button onClick={() => handleReject(loan.id)} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors flex items-center gap-1">
                                                <X size={14} /> Tolak
                                            </button>
                                        </>
                                    ) : (
                                        <Link to={`/admin/pembiayaan/${loan.id}`} className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 transition-colors ${loan.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                            {loan.status === 'active' ? 'Pantau' : 'Detail'} <ChevronRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL APPROVAL BARANG KUSTOM */}
            {approvalModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                            <div>
                                <h3 className="font-bold text-blue-900">Verifikasi Barang Baru</h3>
                                <p className="text-xs text-blue-700">Tetapkan harga pasti untuk katalog</p>
                            </div>
                            <button onClick={() => setApprovalModal({ isOpen: false, loan: null })} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                        </div>

                        <form onSubmit={submitCustomApproval} className="p-5 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg text-sm mb-2 border border-gray-100">
                                <span className="block text-gray-500 text-xs mb-1">Pengajuan Barang oleh Anggota:</span>
                                <strong className="text-gray-800 text-base">{approvalModal.loan?.details?.item}</strong>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Harga Beli Asli (Rp)</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={finalPrice}
                                    onChange={(e) => handleCurrencyInput(e, setFinalPrice)}
                                    placeholder="Contoh: 3.500.000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Syarat Uang Muka / DP (Rp)</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={finalDp}
                                    onChange={(e) => handleCurrencyInput(e, setFinalDp)}
                                    placeholder="Contoh: 500.000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tersedia untuk Tenor (Bulan)</label>
                                <div className="flex flex-wrap gap-2">
                                    {[3, 6, 12, 18, 24].map(t => (
                                        <button
                                            type="button"
                                            key={t}
                                            onClick={() => toggleTenor(t)}
                                            className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${selectedTenors.includes(t) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-xs text-blue-800 border border-blue-200 mt-4 leading-relaxed">
                                <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-600" />
                                <p><strong>Info Alur:</strong> Menyimpan data ini akan otomatis membatalkan pengajuan awal anggota. Anggota akan diminta mengajukan ulang barang ini melalui Katalog agar nominal angsurannya Valid.</p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setApprovalModal({ isOpen: false, loan: null })} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isApproving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
                                    {isApproving ? <Loader2 size={18} className="animate-spin" /> : 'Simpan ke Katalog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};