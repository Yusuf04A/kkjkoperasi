import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Check, X, Loader2, RefreshCw, ArrowLeft, Search,
    ChevronRight, Calendar, AlertCircle, Info, CheckCircle, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const AdminFinancing = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

    // --- STATE UNTUK MODAL KUSTOM ---
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean, loan: any }>({ isOpen: false, loan: null });
    
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean, 
        type: 'approve' | 'reject', 
        loan: any 
    }>({
        isOpen: false,
        type: 'approve',
        loan: null
    });
    const [rejectReason, setRejectReason] = useState("");

    const [finalPrice, setFinalPrice] = useState('');
    const [finalDp, setFinalDp] = useState('');
    const [selectedTenors, setSelectedTenors] = useState<number[]>([3, 6, 12]);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const val = e.target.value.replace(/\D/g, '');
        setter(val ? parseInt(val).toLocaleString('id-ID') : '');
    };

    const toggleTenor = (val: number) => {
        setSelectedTenors(prev =>
            prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val].sort((a, b) => a - b)
        );
    };

    const handleInitApprove = (loan: any) => {
        if (loan.type === 'Kredit Barang' && loan.details?.is_custom) {
            setFinalPrice('');
            setFinalDp('');
            setSelectedTenors([3, 6, 12]);
            setApprovalModal({ isOpen: true, loan });
        } else {
            setConfirmModal({ isOpen: true, type: 'approve', loan });
        }
    };

    const executeApproval = async () => {
        const loanId = confirmModal.loan?.id;
        if (!loanId) return;

        setIsProcessing(true);
        const toastId = toast.loading('Memproses persetujuan...');
        try {
            const { error } = await supabase.rpc('approve_loan', { loan_id_param: loanId });
            if (error) throw error;
            toast.success('Disetujui & Dicairkan', { id: toastId });
            setConfirmModal({ isOpen: false, type: 'approve', loan: null });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeReject = async () => {
        const loanId = confirmModal.loan?.id;
        if (!loanId || !rejectReason.trim()) return toast.error("Alasan penolakan wajib diisi");

        setIsProcessing(true);
        const toastId = toast.loading('Menolak pengajuan...');
        try {
            const { error } = await supabase.from('loans').update({ 
                status: 'rejected', 
                reason: rejectReason 
            }).eq('id', loanId);
            
            if (error) throw error;
            toast.success('Pengajuan ditolak', { id: toastId });
            setConfirmModal({ isOpen: false, type: 'reject', loan: null });
            setRejectReason("");
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const submitCustomApproval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTenors.length === 0) return toast.error("Pilih minimal 1 tenor!");
        const price = parseInt(finalPrice.replace(/\D/g, '')) || 0;
        const dp = parseInt(finalDp.replace(/\D/g, '')) || 0;

        setIsProcessing(true);
        const toastId = toast.loading('Memproses ke katalog...');
        try {
            const { error: insertError } = await supabase.from('credit_catalog').insert({
                name: approvalModal.loan.details.item,
                price: price,
                dp: dp,
                tenors: selectedTenors,
                tax: 0,
            });
            if (insertError) throw insertError;

            await supabase.from('loans').update({
                status: 'rejected',
                reason: "Barang berhasil ditambahkan ke Katalog. Silakan ajukan ulang pinjaman Anda."
            }).eq('id', approvalModal.loan.id);

            await supabase.from('notifications').insert({
                user_id: approvalModal.loan.user_id,
                title: 'Barang Ditambahkan ke Katalog!',
                message: `Pengajuan kustom barang "${approvalModal.loan.details.item}" telah di-ACC. Silakan cek katalog.`,
                type: 'success'
            });

            toast.success('Berhasil ditambahkan ke Katalog!', { id: toastId });
            setApprovalModal({ isOpen: false, loan: null });
            fetchLoans();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportExcel = () => {
        if (loans.length === 0) {
            toast.error("Tidak ada data untuk di-export");
            return;
        }

        const headers = ['Member ID', 'Nama Anggota', 'Tipe Pembiayaan', 'Nominal', 'Tenor', 'Status', 'Tanggal Pengajuan'];
        
        const tableRows = loans.map(loan => {
            let detailType = loan.type;
            if (loan.type === 'Kredit Barang' && loan.details?.is_custom) detailType += ' (Kustom)';
            
            return `
            <tr>
                <td style="border: 1px solid #ddd; padding: 4px;">${loan.profiles?.member_id || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${loan.profiles?.full_name || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${detailType}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${loan.amount || 0}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${loan.duration} Bulan</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${loan.status}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${format(new Date(loan.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
            </tr>
        `}).join('');

        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
            </head>
            <body>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th style="background-color: #136f42; color: white; border: 1px solid #136f42; padding: 8px; font-weight: bold;">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Pembiayaan_${format(new Date(), 'dd-MMM-yyyy')}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Excel berhasil diunduh!");
    };

    const renderDetailBadge = (loan: any) => {
        if (!loan.details) return null;
        let text = "";
        if (loan.type === 'Kredit Barang') text = loan.details.item + (loan.details.is_custom ? ' (Kustom)' : '');
        else if (loan.type === 'Modal Usaha') text = loan.details.business_name;
        else if (loan.type === 'Biaya Pelatihan') text = loan.details.training_name;
        else if (loan.type === 'Biaya Pendidikan') text = loan.details.child_name;
        if (!text) return null;
        return <span className={cn("text-[10px] px-2 py-0.5 rounded border truncate max-w-[200px] inline-block mt-1", loan.details?.is_custom ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
            {text}
        </span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] mb-4 w-fit transition-all text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight leading-none mb-1">Manajemen Pembiayaan</h1>
                        <p className="text-sm text-gray-500">Monitoring pengajuan dan penambahan barang kustom ke katalog.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportExcel} className="p-2.5 px-4 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-sm transition-all active:scale-95 flex items-center gap-2">
                            <Download size={18} /> Export Excel
                        </button>
                        <button onClick={fetchLoans} className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-8 border-b border-gray-200 mt-6 overflow-x-auto no-scrollbar">
                    {[{ id: 'pending', label: 'Menunggu Approval' }, { id: 'active', label: 'Pinjaman Berjalan' }, { id: 'history', label: 'Riwayat Arsip' }].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("pb-3 text-sm font-bold transition-all relative whitespace-nowrap", activeTab === tab.id ? 'text-[#136f42]' : 'text-gray-400')}>
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div>
                ) : loans.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400 font-medium italic"><Search size={48} className="mx-auto mb-4 opacity-20" />Tidak ada data ditemukan.</div>
                ) : (
                    loans.map((loan) => (
                        <div key={loan.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-200">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100 shrink-0">{loan.profiles?.full_name?.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-slate-900 truncate text-sm md:text-base">{loan.profiles?.full_name}</h3>
                                            <p className="text-[10px] font-mono text-slate-400">{loan.profiles?.member_id}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-slate-500">
                                            <span className="text-[#136f42] font-bold">{loan.type}</span>
                                            <span>•</span>
                                            <span>{loan.duration} bulan</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(loan.created_at), 'dd MMM yyyy', { locale: indonesia })}</span>
                                        </div>
                                        {renderDetailBadge(loan)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto pt-3 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{loan.details?.is_custom ? 'Perkiraan' : 'Nominal'}</p>
                                        <p className="font-black text-slate-900 text-sm md:text-base tracking-tight">{formatRupiah(loan.amount)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 md:pl-4 md:border-l border-slate-100">
                                        {loan.status === 'pending' ? (
                                            <>
                                                <button onClick={() => handleInitApprove(loan)} className={cn("px-4 py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95", loan.details?.is_custom ? 'bg-blue-600 shadow-blue-900/20' : 'bg-emerald-600 shadow-emerald-900/20')}>Setujui</button>
                                                <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', loan })} className="px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Tolak</button>
                                            </>
                                        ) : (
                                            <Link to={`/admin/pembiayaan/${loan.id}`} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-slate-100 transition-all">Detail <ChevronRight size={14}/></Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CUSTOM POPUP MODAL CONFIRMATION */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                            {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Pembiayaan'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                            {confirmModal.type === 'approve' ? (
                                <>Setujui pembiayaan <b>{confirmModal.loan?.type}</b> sebesar <b>{formatRupiah(confirmModal.loan?.amount)}</b> untuk anggota ini?</>
                            ) : (
                                <>Berikan alasan penolakan agar anggota dapat memperbaikinya.</>
                            )}
                        </p>
                        {confirmModal.type === 'reject' && (
                            <textarea 
                                value={rejectReason} 
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Contoh: Dokumen jaminan tidak lengkap..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium outline-none focus:border-rose-500 transition-all h-24 mb-6 resize-none"
                            />
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setConfirmModal({ isOpen: false, type: 'approve', loan: null }); setRejectReason(""); }} className="py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95">Batal</button>
                            <button onClick={confirmModal.type === 'approve' ? executeApproval : executeReject} disabled={isProcessing} className={cn("py-3 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95", confirmModal.type === 'approve' ? 'bg-[#136f42] shadow-green-900/20' : 'bg-rose-600 shadow-rose-900/20')}>
                                {isProcessing ? 'Proses...' : `Ya, ${confirmModal.type === 'approve' ? 'Setujui' : 'Tolak'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL APPROVAL BARANG KUSTOM */}
            {approvalModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight leading-none">Verifikasi Barang</h3>
                            <button onClick={() => setApprovalModal({ isOpen: false, loan: null })} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 space-y-1">
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Nama barang anggota:</p>
                            <p className="text-sm font-black text-blue-900 uppercase leading-tight">{approvalModal.loan?.details?.item}</p>
                        </div>
                        <form onSubmit={submitCustomApproval} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Harga beli asli (Rp)</label>
                                <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-blue-600 outline-none" value={finalPrice} onChange={(e) => handleCurrencyInput(e, setFinalPrice)} placeholder="0" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Syarat DP anggota (Rp)</label>
                                <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-blue-600 outline-none" value={finalDp} onChange={(e) => handleCurrencyInput(e, setFinalDp)} placeholder="0" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Pilihan tenor (bulan)</label>
                                <div className="flex flex-wrap gap-2">
                                    {[3, 6, 12, 18, 24].map(t => (
                                        <button type="button" key={t} onClick={() => toggleTenor(t)} className={cn("px-3.5 py-1.5 rounded-full border text-[10px] font-black transition-all", selectedTenors.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200')}> {t} </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" disabled={isProcessing} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95">Update Katalog</button>
                                <button type="button" onClick={() => setApprovalModal({ isOpen: false, loan: null })} className="px-6 py-3.5 border border-slate-100 rounded-2xl font-black text-slate-300 text-[10px] uppercase">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};