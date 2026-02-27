import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import {
    ArrowLeft, Search, User, Wallet, ArrowDownLeft, ArrowUpRight,
    ArrowRightLeft, AlertTriangle, X, ChevronRight, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

type TransactionMode = 'topup' | 'tarik' | 'transfer';

const MODES: { id: TransactionMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
        id: 'topup',
        label: 'Top Up',
        desc: 'Tambah saldo TaPro',
        icon: <ArrowDownLeft size={20} />,
    },
    {
        id: 'tarik',
        label: 'Tarik',
        desc: 'Kurangi saldo TaPro',
        icon: <ArrowUpRight size={20} />,
    },
    {
        id: 'transfer',
        label: 'Bayar Tagihan',
        desc: 'Debet untuk cicilan/tagihan',
        icon: <ArrowRightLeft size={20} />,
    },
];

export const AdminTaproTransaksi = () => {
    // Step 1: Cari Anggota
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    // Step 2: Mode & Form
    const [mode, setMode] = useState<TransactionMode>('topup');
    const [amount, setAmount] = useState('');
    const [keterangan, setKeterangan] = useState('');

    // Modal & Processing
    const [showConfirm, setShowConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, tapro_balance')
                .eq('status', 'active')
                .neq('role', 'admin')
                .or(`full_name.ilike.%${searchQuery}%,member_id.ilike.%${searchQuery}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err: any) {
            toast.error('Gagal mencari anggota: ' + err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        setSearchResults([]);
        setAmount('');
        setKeterangan('');
    };

    const getNominal = () => parseInt(amount.replace(/\D/g, '') || '0');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
    };

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return toast.error('Pilih anggota terlebih dahulu!');
        if (getNominal() <= 0) return toast.error('Nominal harus lebih dari 0!');
        if ((mode === 'tarik' || mode === 'transfer') && getNominal() > (selectedMember.tapro_balance || 0)) {
            return toast.error('Saldo TaPro anggota tidak mencukupi!');
        }
        if (!keterangan.trim()) return toast.error('Keterangan wajib diisi!');
        setShowConfirm(true);
    };

    const handleExecute = async () => {
        if (!selectedMember) return;
        setIsProcessing(true);
        const nominal = getNominal();
        const toastId = toast.loading('Memproses transaksi...');

        try {
            // 1. Ambil saldo TaPro real-time
            const { data: freshProfile, error: fetchErr } = await supabase
                .from('profiles')
                .select('tapro_balance')
                .eq('id', selectedMember.id)
                .single();
            if (fetchErr) throw fetchErr;

            const freshData = (freshProfile as unknown) as Record<string, number>;
            const currentBalance: number = freshData['tapro_balance'] || 0;

            // 2. Hitung saldo baru
            let newBalance = currentBalance;
            if (mode === 'topup') {
                newBalance = currentBalance + nominal;
            } else {
                if (currentBalance < nominal) throw new Error('Saldo TaPro tidak mencukupi!');
                newBalance = currentBalance - nominal;
            }

            // 3. Update saldo
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ tapro_balance: newBalance })
                .eq('id', selectedMember.id);
            if (updateErr) throw updateErr;

            // 4. Catat transaksi
            const txType = mode === 'topup' ? 'topup' : 'withdraw';
            const txDesc = mode === 'topup'
                ? `[ADMIN] Top Up TaPro - ${keterangan}`
                : mode === 'tarik'
                    ? `[ADMIN] Tarik TaPro - ${keterangan}`
                    : `[ADMIN] Bayar Tagihan (Debet TaPro) - ${keterangan}`;

            await supabase.from('transactions').insert({
                user_id: selectedMember.id,
                type: txType,
                amount: nominal,
                status: 'success',
                description: txDesc,
            });

            toast.success('Transaksi TaPro berhasil!', { id: toastId });
            setShowConfirm(false);

            // Refresh data member
            const { data: updated } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, tapro_balance')
                .eq('id', selectedMember.id)
                .single();
            if (updated) setSelectedMember(updated);

            setAmount('');
            setKeterangan('');
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] mb-5 w-fit transition-colors text-sm font-bold">
                    <ArrowLeft size={16} /> Kembali ke Dashboard
                </Link>
                <div className="bg-[#136f42] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-green-900/20">
                    <div className="absolute right-0 top-0 w-60 h-60 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#136f42] to-[#0f5c35] opacity-90 z-0" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">Transaksi TaPro Anggota</h1>
                            <p className="text-[10px] text-green-200/80 font-bold uppercase tracking-[0.2em]">Admin Dapat Mentransaksikan Atas Nama Anggota</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* === STEP 1: CARI ANGGOTA === */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Step 1 · Cari Anggota</h2>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIAK anggota..."
                            className="w-full pl-10 h-12 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#136f42] focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="h-12 px-5 bg-[#136f42] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#0f5c35] transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Cari
                    </button>
                </div>

                {/* Hasil Pencarian */}
                {searchResults.length > 0 && (
                    <div className="mt-3 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                        {searchResults.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => handleSelectMember(m)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-green-50/50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-slate-900">{m.full_name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 uppercase">{m.member_id}</p>
                                </div>
                                <div className="text-right mr-2">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Saldo TaPro</p>
                                    <p className="text-sm font-black text-[#136f42]">{formatRupiah(m.tapro_balance || 0)}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Anggota Terpilih */}
                {selectedMember && (
                    <div className="mt-4 bg-[#136f42]/5 border border-[#136f42]/20 rounded-2xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#136f42]/10 rounded-2xl flex items-center justify-center text-[#136f42]">
                                <User size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-900">{selectedMember.full_name}</p>
                                <p className="text-[10px] font-mono text-slate-400 uppercase">{selectedMember.member_id}</p>
                            </div>
                            <div className="text-right mr-2">
                                <p className="text-[9px] text-[#136f42] font-bold uppercase tracking-widest">Saldo TaPro</p>
                                <p className="text-xl font-black text-[#136f42]">{formatRupiah(selectedMember.tapro_balance || 0)}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedMember(null); setAmount(''); setKeterangan(''); }}
                                className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* === STEP 2: PILIH MODE TRANSAKSI === */}
            {selectedMember && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-5">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Step 2 · Jenis Transaksi</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {MODES.map((m) => {
                            const isActive = mode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => { setMode(m.id); setAmount(''); }}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                        isActive
                                            ? "bg-[#136f42] border-[#136f42] text-white shadow-lg shadow-green-900/15"
                                            : "bg-gray-50 border-gray-100 text-gray-500 hover:border-green-100 hover:bg-green-50/30"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isActive ? "bg-white/20" : "bg-white")}>
                                        <span className={isActive ? "text-white" : "text-[#136f42]"}>{m.icon}</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-wide leading-none">{m.label}</p>
                                        <p className={cn("text-[9px] mt-1 leading-tight", isActive ? "text-green-200/80" : "text-gray-400")}>{m.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === STEP 3: FORM TRANSAKSI === */}
            {selectedMember && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-5">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-5">Step 3 · Detail Transaksi</h2>

                    <form onSubmit={handleOpenConfirm} className="space-y-4">
                        {/* Nominal */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                                <input
                                    type="text"
                                    placeholder="0"
                                    className="w-full pl-12 h-14 text-xl font-black bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#136f42] focus:outline-none transition-all"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    required
                                />
                            </div>
                            {(mode === 'tarik' || mode === 'transfer') && getNominal() > 0 && (
                                <div className={cn(
                                    "text-xs font-bold px-3 py-1.5 rounded-lg w-fit",
                                    getNominal() > (selectedMember.tapro_balance || 0)
                                        ? "bg-rose-50 text-rose-600"
                                        : "bg-green-50 text-green-700"
                                )}>
                                    Sisa saldo: {formatRupiah((selectedMember.tapro_balance || 0) - getNominal())}
                                </div>
                            )}
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Keterangan / Alasan <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                placeholder={
                                    mode === 'topup' ? "Contoh: Setoran tunai dari anggota, Koreksi saldo..."
                                        : mode === 'tarik' ? "Contoh: Anggota minta tarik tunai, Refund..."
                                            : "Contoh: Pelunasan tagihan anggota almarhum Bapak X, Bayar cicilan KB-5..."
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:bg-white focus:border-[#136f42] focus:outline-none transition-all resize-none h-24"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 bg-[#136f42] hover:bg-[#0f5c35] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-green-900/15 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {MODES.find(m => m.id === mode)?.icon}
                            {mode === 'topup' ? 'Top Up TaPro Anggota'
                                : mode === 'tarik' ? 'Tarik Saldo TaPro'
                                    : 'Bayar Tagihan (Debet TaPro)'}
                        </button>
                    </form>
                </div>
            )}

            {/* === MODAL KONFIRMASI === */}
            {showConfirm && selectedMember && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-[#136f42]/10 text-[#136f42] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>

                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Konfirmasi Transaksi</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">
                            {mode === 'topup' ? 'Tambah' : mode === 'tarik' ? 'Tarik' : 'Debet'} saldo TaPro
                        </p>
                        <p className="text-3xl font-black text-[#136f42] mb-1">
                            {formatRupiah(getNominal())}
                        </p>
                        <p className="text-xs font-bold text-slate-500 mb-4">milik <b>{selectedMember.full_name}</b></p>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-6 text-left">
                            <p className="text-[10px] font-black text-[#136f42] uppercase tracking-widest mb-1">Keterangan:</p>
                            <p className="text-xs text-slate-700 font-medium">{keterangan}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={isProcessing}
                                className="py-3 bg-[#136f42] hover:bg-[#0f5c35] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-1"
                            >
                                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : null}
                                Ya, Proses
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
