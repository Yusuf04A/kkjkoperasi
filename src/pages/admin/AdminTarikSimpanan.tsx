import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import {
    ArrowLeft, Search, User, Wallet, PiggyBank, School, Gift,
    Heart, Plane, Banknote, AlertTriangle, X, CheckCircle,
    ChevronRight, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

// Definisi semua jenis simpanan beserta nama tampilan & kolom DB
const SIMPANAN_LIST = [
    { id: 'simwa', label: 'Simpanan Wajib', col: 'simwa_balance', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { id: 'simpok', label: 'Simpanan Pokok', col: 'simpok_balance', icon: PiggyBank, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'simade', label: 'Masa Depan', col: 'simade_balance', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: 'sipena', label: 'Pendidikan', col: 'sipena_balance', icon: School, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { id: 'sihara', label: 'Hari Raya', col: 'sihara_balance', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { id: 'siqurma', label: 'Qurban', col: 'siqurma_balance', icon: Heart, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { id: 'siuji', label: 'Haji / Umroh', col: 'siuji_balance', icon: Plane, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { id: 'siwalima', label: 'Walimah', col: 'siwalima_balance', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
    { id: 'tapro', label: 'Tabungan TaPro', col: 'tapro_balance', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
];

export const AdminTarikSimpanan = () => {
    // Step 1: Cari Anggota
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    // Step 2: Pilih Simpanan & Nominal
    const [selectedSimpanan, setSelectedSimpanan] = useState<typeof SIMPANAN_LIST[0] | null>(null);
    const [amount, setAmount] = useState('');
    const [tarikSemua, setTarikSemua] = useState(false);
    const [keterangan, setKeterangan] = useState('');

    // Modal Konfirmasi
    const [showConfirm, setShowConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Search anggota
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, simwa_balance, simpok_balance, simade_balance, sipena_balance, sihara_balance, siqurma_balance, siuji_balance, siwalima_balance, tapro_balance')
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
        setSelectedSimpanan(null);
        setAmount('');
        setTarikSemua(false);
        setKeterangan('');
    };

    const getBalanceForSelected = () => {
        if (!selectedMember || !selectedSimpanan) return 0;
        return selectedMember[selectedSimpanan.col] || 0;
    };

    const getNominalTarik = () => {
        if (tarikSemua) return getBalanceForSelected();
        return parseInt(amount.replace(/\D/g, '') || '0');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
        setTarikSemua(false);
    };

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return toast.error('Pilih anggota terlebih dahulu!');
        if (!selectedSimpanan) return toast.error('Pilih jenis simpanan!');
        if (getNominalTarik() <= 0) return toast.error('Nominal penarikan harus lebih dari 0!');
        if (getNominalTarik() > getBalanceForSelected()) return toast.error('Saldo tidak mencukupi!');
        if (!keterangan.trim()) return toast.error('Keterangan/alasan wajib diisi!');
        setShowConfirm(true);
    };

    const handleExecute = async () => {
        if (!selectedMember || !selectedSimpanan) return;
        setIsProcessing(true);
        const nominal = getNominalTarik();
        const toastId = toast.loading('Memproses penarikan...');

        try {
            // 1. Ambil saldo real-time untuk keamanan
            const { data: freshProfile, error: fetchError } = await supabase
                .from('profiles')
                .select(selectedSimpanan.col)
                .eq('id', selectedMember.id)
                .single();

            if (fetchError) throw fetchError;
            const freshProfileData = (freshProfile as unknown) as Record<string, number>;
            const currentBalance: number = freshProfileData[selectedSimpanan.col] || 0;
            if (currentBalance < nominal) throw new Error('Saldo anggota tidak mencukupi!');

            // 2. Kurangi saldo
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ [selectedSimpanan.col]: currentBalance - nominal })
                .eq('id', selectedMember.id);
            if (updateError) throw updateError;

            // 3. Catat di savings_withdrawals (status langsung approved karena admin)
            await supabase.from('savings_withdrawals').insert({
                user_id: selectedMember.id,
                type: selectedSimpanan.id,
                amount: nominal,
                bank_name: 'Eksekusi Admin',
                account_number: '-',
                status: 'approved',
                admin_note: keterangan,
            });

            // 4. Catat di tabel transaksi utama
            await supabase.from('transactions').insert({
                user_id: selectedMember.id,
                type: 'withdraw',
                amount: nominal,
                status: 'success',
                description: `[ADMIN] Penarikan ${selectedSimpanan.label} - ${keterangan}`,
            });

            toast.success('Penarikan berhasil dieksekusi!', { id: toastId });
            setShowConfirm(false);

            // Refresh data anggota
            const { data: updated } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, simwa_balance, simpok_balance, simade_balance, sipena_balance, sihara_balance, siqurma_balance, siuji_balance, siwalima_balance, tapro_balance')
                .eq('id', selectedMember.id)
                .single();
            if (updated) setSelectedMember(updated);

            setAmount('');
            setTarikSemua(false);
            setKeterangan('');
            setSelectedSimpanan(null);
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
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Banknote size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Tarik Simpanan Anggota</h1>
                                <p className="text-[10px] text-green-200/80 font-bold uppercase tracking-[0.2em]">Eksekusi Admin · Langsung Diproses</p>
                            </div>
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
                                <ChevronRight size={16} className="text-slate-300" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Anggota Terpilih */}
                {selectedMember && (
                    <div className="mt-4 bg-[#136f42]/5 border border-[#136f42]/20 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#136f42]/10 rounded-2xl flex items-center justify-center text-[#136f42]">
                            <User size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-slate-900">{selectedMember.full_name}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase">{selectedMember.member_id}</p>
                        </div>
                        <button
                            onClick={() => { setSelectedMember(null); setSelectedSimpanan(null); }}
                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* === STEP 2: PILIH SIMPANAN === */}
            {selectedMember && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-5">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Step 2 · Pilih Jenis Simpanan</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SIMPANAN_LIST.map((s) => {
                            const balance = selectedMember[s.col] || 0;
                            const Icon = s.icon;
                            const isSelected = selectedSimpanan?.id === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { setSelectedSimpanan(s); setAmount(''); setTarikSemua(false); }}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                                        isSelected
                                            ? "bg-[#136f42] border-[#136f42] shadow-lg shadow-green-900/15"
                                            : "bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-white/20" : s.bg)}>
                                        <Icon size={18} className={isSelected ? "text-white" : s.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs font-black uppercase tracking-tight truncate", isSelected ? "text-white" : "text-slate-700")}>{s.label}</p>
                                        <p className={cn("text-[11px] font-bold font-mono", isSelected ? "text-green-200" : "text-slate-400")}>{formatRupiah(balance)}</p>
                                    </div>
                                    {isSelected && <CheckCircle size={18} className="text-white shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === STEP 3: FORM PENARIKAN === */}
            {selectedMember && selectedSimpanan && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-5">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Step 3 · Detail Penarikan</h2>

                    {/* Info Saldo */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-5 flex justify-between items-center border border-slate-100">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo {selectedSimpanan.label}</p>
                            <p className="text-2xl font-black text-slate-900">{formatRupiah(getBalanceForSelected())}</p>
                        </div>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", selectedSimpanan.bg)}>
                            <selectedSimpanan.icon size={22} className={selectedSimpanan.color} />
                        </div>
                    </div>

                    <form onSubmit={handleOpenConfirm} className="space-y-4">
                        {/* Nominal */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Penarikan</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                                <input
                                    type="text"
                                    placeholder="0"
                                    className="w-full pl-12 h-14 text-xl font-black bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#136f42] focus:outline-none transition-all disabled:opacity-50"
                                    value={tarikSemua ? parseInt(getBalanceForSelected().toString()).toLocaleString('id-ID') : amount}
                                    onChange={handleAmountChange}
                                    disabled={tarikSemua}
                                />
                            </div>
                            {/* Checkbox Tarik Semua */}
                            <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={tarikSemua}
                                    onChange={(e) => {
                                        setTarikSemua(e.target.checked);
                                        if (e.target.checked) setAmount('');
                                    }}
                                    className="w-4 h-4 accent-[#136f42]"
                                />
                                <span className="text-xs font-bold text-slate-600">Tarik seluruh saldo ({formatRupiah(getBalanceForSelected())})</span>
                            </label>
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Alasan <span className="text-rose-500">*</span></label>
                            <textarea
                                placeholder="Contoh: Anggota meminta penarikan, Pelunasan tagihan anggota wafat..."
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
                            <Banknote size={18} />
                            Eksekusi Penarikan
                        </button>
                    </form>
                </div>
            )}

            {/* === MODAL KONFIRMASI === */}
            {showConfirm && selectedMember && selectedSimpanan && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Konfirmasi Penarikan</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                            Anda akan menarik <b>{selectedSimpanan.label}</b> sebesar<br />
                            <span className="text-2xl font-black text-[#136f42]">{formatRupiah(getNominalTarik())}</span><br />
                            milik anggota <b>{selectedMember.full_name}</b>
                        </p>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 text-left">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Keterangan:</p>
                            <p className="text-xs text-amber-900 font-medium">{keterangan}</p>
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
                                className="py-3 bg-[#136f42] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-1"
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
