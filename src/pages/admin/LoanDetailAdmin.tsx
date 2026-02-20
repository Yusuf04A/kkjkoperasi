import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ArrowLeft, Calendar, CheckCircle, AlertTriangle,
    MessageSquare, Smartphone, DollarSign, Clock, Check, X,
    ChevronRight, Info
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { sendWhatsApp } from '../../lib/fonnte';

export const AdminLoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // === 1. FETCH DATA ===
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: loanData, error } = await supabase
                .from('loans')
                .select(`*, profiles ( full_name, member_id, phone, avatar_url )`)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (loanData) {
                setLoan(loanData);
                const { data: instData } = await supabase
                    .from('installments')
                    .select('*')
                    .eq('loan_id', id)
                    .order('due_date', { ascending: true });

                setInstallments(instData || []);
            }
        } catch (error: any) {
            console.error("Error:", error);
            toast.error("Gagal memuat data pinjaman");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // === 2. LOGIC RESTRUKTURISASI ===
    const handleApproveRestructure = async () => {
        const confirm = window.confirm(`Setujui perpanjangan menjadi ${loan.restructure_req_duration} bulan?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses...');
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
        if (!window.confirm("Tolak pengajuan?")) return;
        const toastId = toast.loading('Menolak...');
        await supabase.from('loans').update({ restructure_status: 'rejected', restructure_req_duration: null }).eq('id', loan.id);
        toast.success('Ditolak', { id: toastId });
        fetchData();
    };

    // === 3. LOGIC KIRIM WA ===
    const handleIngatkanNasabah = async () => {
        if (!loan?.profiles?.phone) return toast.error("No HP Nasabah tidak ada!");
        const nextBill = installments.find(i => i.status !== 'paid');

        if (!nextBill) return toast.success("Nasabah ini sudah lunas semua! 🎉");

        const pesan = `
Assalamualaikum Kak *${loan.profiles.full_name}*! 👋
Dari Admin *Koperasi KKJ*.

Mengingatkan tagihan pinjaman *${loan.type}*:
💰 Nominal: *${formatRupiah(nextBill.amount)}*
📅 Jatuh Tempo: *${format(new Date(nextBill.due_date), 'dd MMMM yyyy', { locale: indonesia })}*

Mohon segera dibayarkan ya. Abaikan jika sudah transfer.
Terima kasih. 🙏
    `;

        toast.loading("Mengirim WA...");
        const sukses = await sendWhatsApp(loan.profiles.phone, pesan);
        toast.dismiss();

        if (sukses) toast.success("Pesan WA Terkirim! 🚀");
        else toast.error("Gagal kirim WA (Cek Token/Koneksi).");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Memuat data...</div>;
    if (!loan) return <div className="text-center p-10 text-red-500">Data tidak ditemukan.</div>;

    // === PERBAIKAN LOGIKA PERHITUNGAN ===
    const paidInstallments = installments.filter(i => i.status === 'paid');
    const paidCount = paidInstallments.length;
    const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;

    // Hitung total yang sudah dibayar secara nominal
    const totalPaidNominal = paidInstallments.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Sisa Pokok = Total Pinjaman - Total yang sudah dibayar
    // Jika loan.remaining_amount ada di DB gunakan itu, jika tidak hitung manual
    const sisaPokok = loan.status === 'paid' ? 0 : (loan.amount - totalPaidNominal);

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto min-h-screen bg-gray-50/50 font-sans">

            {/* HEADER */}
            <div className="mb-6">
                <button onClick={() => navigate('/admin/pembiayaan')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-2">
                    <ArrowLeft size={18} /> Kembali
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detail Pinjaman</h1>
                        <p className="text-sm text-gray-500">{loan.type} • ID: {loan.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${
                        loan.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        loan.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {loan.status === 'active' ? '● AKTIF' : loan.status === 'paid' ? '● LUNAS' : loan.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* KOLOM KIRI */}
                <div className="lg:col-span-4 space-y-5">

                    {/* CARD PROFIL */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={loan.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${loan.profiles?.full_name}&background=0D8ABC&color=fff`}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-gray-900 truncate leading-tight">{loan.profiles?.full_name}</h3>
                                <p className="text-[11px] text-gray-400 font-mono mt-1">{loan.profiles?.member_id}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleIngatkanNasabah}
                            className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-xl transition-all shadow-md shadow-green-200"
                        >
                            <MessageSquare size={18} />
                        </button>
                    </div>

                    {/* CARD SISA POKOK (FIXED) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <DollarSign size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Sisa Pokok Pinjaman</p>
                            <p className="text-3xl font-black text-[#136f42] tracking-tighter">{formatRupiah(sisaPokok)}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-xs font-medium">
                                <Info size={12}/> dari total {formatRupiah(loan.amount)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-dashed border-gray-100">
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Tenor</p>
                                <p className="font-bold text-gray-800">{loan.duration} Bulan</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Cicilan / Bln</p>
                                <p className="font-bold text-gray-800">{formatRupiah(loan.monthly_payment)}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between text-[10px] mb-2 font-bold text-gray-500 uppercase tracking-wider">
                                <span>Progress Pelunasan</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 p-0.5 border border-gray-50">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* ALERT RESTRUKTURISASI */}
                    {loan.restructure_status === 'pending' && (
                        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl shadow-sm animate-pulse">
                            <h4 className="font-black text-amber-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} /> Pengajuan Perpanjangan
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                Nasabah ingin mengubah tenor menjadi <span className="bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-bold">{loan.restructure_req_duration} Bulan</span>.
                            </p>
                            <div className="mt-3 bg-white/60 p-3 rounded-xl text-xs italic text-amber-900 border border-amber-100 font-medium">
                                "{loan.restructure_reason}"
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleApproveRestructure} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all">
                                    Setujui
                                </button>
                                <button onClick={handleRejectRestructure} className="flex-1 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 py-2.5 rounded-xl text-xs font-bold transition-all">
                                    Tolak
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* KOLOM KANAN */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[560px]">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-wider">
                            <Calendar size={18} className="text-blue-500" /> Riwayat Angsuran
                        </h3>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
                            {paidCount} / {installments.length} Lunas
                        </span>
                    </div>

                    <div className="overflow-y-auto flex-1 no-scrollbar">
                        {installments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                                <Calendar size={48} className="opacity-10 mb-4" />
                                <p className="text-sm font-medium">Data angsuran belum tersedia.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 sticky top-0 z-10 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="p-4 text-center w-16">No</th>
                                        <th className="p-4">Jatuh Tempo</th>
                                        <th className="p-4">Tagihan</th>
                                        <th className="p-4 text-right pr-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-50">
                                    {installments.map((item, index) => {
                                        const isPaid = item.status === 'paid';
                                        const dueDate = new Date(item.due_date);
                                        const isOverdue = !isPaid && dueDate < new Date();

                                        return (
                                            <tr key={item.id} className={`group transition-colors ${isPaid ? 'bg-emerald-50/20' : 'hover:bg-gray-50'}`}>
                                                <td className="p-4 text-center font-mono text-gray-400 text-xs">{index + 1}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-700">
                                                        {format(dueDate, 'dd MMMM yyyy', { locale: indonesia })}
                                                    </div>
                                                    {isOverdue && <span className="text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-block mt-1 animate-pulse">OVERDUE</span>}
                                                </td>
                                                <td className="p-4 font-black text-gray-900">
                                                    {formatRupiah(item.amount)}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-100/50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                            <CheckCircle size={12} /> Lunas
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-100/50 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                            <Clock size={12} /> Menunggu
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};