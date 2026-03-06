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
    const [selectedSimpanans, setSelectedSimpanans] = useState<typeof SIMPANAN_LIST[0][]>([]);
    const [amount, setAmount] = useState('');
    const [tarikSemua, setTarikSemua] = useState(false);
    const [keterangan, setKeterangan] = useState('');

    // Modal Konfirmasi
    const [showConfirm, setShowConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Logic Handlers (Search, Select, Execute)
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
        setSelectedSimpanans([]);
        setAmount('');
        setTarikSemua(false);
        setKeterangan('');
    };

    const getBalanceForSelected = () => {
        if (!selectedMember || selectedSimpanans.length === 0) return 0;
        return selectedSimpanans.reduce((total, sim) => total + (selectedMember[sim.col] || 0), 0);
    };

    const toggleSimpanan = (sim: typeof SIMPANAN_LIST[0]) => {
        if (selectedSimpanans.find(s => s.id === sim.id)) {
            setSelectedSimpanans(prev => prev.filter(s => s.id !== sim.id));
        } else {
            setSelectedSimpanans(prev => [...prev, sim]);
        }
        setAmount('');
        setTarikSemua(false);
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
        if (selectedSimpanans.length === 0) return toast.error('Pilih minimal satu jenis simpanan!');
        if (getNominalTarik() <= 0) return toast.error('Nominal penarikan harus lebih dari 0!');
        if (getNominalTarik() > getBalanceForSelected()) return toast.error('Saldo tidak mencukupi!');
        if (!keterangan.trim()) return toast.error('Keterangan/alasan wajib diisi!');
        setShowConfirm(true);
    };

    const handleExecute = async () => {
        if (!selectedMember || selectedSimpanans.length === 0) return;
        setIsProcessing(true);
        const nominal = getNominalTarik();
        const toastId = toast.loading('Memproses penarikan...');

        try {
            // Setup parallel updates & inserts arrays
            let remainingNominal = nominal;
            let currentUpdates: Record<string, number> = {};
            let withdrawalInserts = [];
            let transcriptMsgs = [];

            // Pre-calculate to ensure there is enough balance across ALL selected
            let cumulativeBalance = 0;
            const targetCols = selectedSimpanans.map(s => s.col);
            const { data: freshProfile, error: fetchError } = await supabase
                .from('profiles')
                .select(targetCols.join(','))
                .eq('id', selectedMember.id)
                .single();

            if (fetchError) throw fetchError;

            const profileData = (freshProfile as unknown) as Record<string, number>;

            for (const sim of selectedSimpanans) {
                cumulativeBalance += (profileData[sim.col] || 0);
            }

            if (cumulativeBalance < nominal) throw new Error('Saldo anggota tidak mencukupi kombinasi total.');

            for (const sim of selectedSimpanans) {
                if (remainingNominal <= 0) break;

                const balance = profileData[sim.col] || 0;
                if (balance <= 0) continue;

                const deduct = Math.min(balance, remainingNominal);

                currentUpdates[sim.col] = balance - deduct;

                withdrawalInserts.push({
                    user_id: selectedMember.id,
                    type: sim.id,
                    amount: deduct,
                    bank_name: 'Eksekusi Admin',
                    account_number: '-',
                    status: 'approved',
                    admin_note: keterangan,
                });

                transcriptMsgs.push(`${sim.label} (Rp ${deduct.toLocaleString('id-ID')})`);
                remainingNominal -= deduct;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update(currentUpdates)
                .eq('id', selectedMember.id);
            if (updateError) throw updateError;

            await supabase.from('savings_withdrawals').insert(withdrawalInserts);

            await supabase.from('transactions').insert({
                user_id: selectedMember.id,
                type: 'withdraw',
                amount: nominal,
                status: 'success',
                description: `[ADMIN] Penarikan ${transcriptMsgs.join(' & ')} - ${keterangan}`,
            });

            toast.success('Penarikan berhasil dieksekusi!', { id: toastId });
            setShowConfirm(false);

            const { data: updated } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, simwa_balance, simpok_balance, simade_balance, sipena_balance, sihara_balance, siqurma_balance, siuji_balance, siwalima_balance, tapro_balance')
                .eq('id', selectedMember.id)
                .single();
            if (updated) setSelectedMember(updated);

            setAmount('');
            setTarikSemua(false);
            setKeterangan('');
            setSelectedSimpanans([]);
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
            {/* --- HEADER KONSISTEN --- */}
            <div className="mb-8">
                <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-[#136f42] mb-6 transition-all group"
                >
                    <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Kembali</span>
                </Link>

                <div className="bg-[#136f42] rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-black/5 rounded-full blur-2xl -mb-10 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                                <Banknote size={32} strokeWidth={2.5} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-none mb-1">
                                    TARIK SIMPANAN
                                </h1>
                                <p className="text-[10px] md:text-xs text-green-200/80 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    Otoritas Admin • Eksekusi Instan
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BODY CONTENT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* SISI KIRI: STEP 1 & 2 */}
                <div className="lg:col-span-7 space-y-6">

                    {/* STEP 1: CARI ANGGOTA */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-inner">
                                <Search size={18} strokeWidth={3} />
                            </div>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tahap 1: Identifikasi Anggota</h2>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIAK..."
                                    className="w-full pl-10 h-14 text-sm font-bold bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#136f42]/20 focus:bg-white transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="h-14 px-6 bg-[#136f42] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f5c35] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 size={18} className="animate-spin" /> : "Cari"}
                            </button>
                        </div>

                        {/* Search Results Dropdown-like */}
                        {searchResults.length > 0 && (
                            <div className="mt-4 border border-slate-100 rounded-[2rem] overflow-hidden divide-y divide-slate-50">
                                {searchResults.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleSelectMember(m)}
                                        className="w-full flex items-center gap-4 p-5 hover:bg-green-50/50 transition-colors text-left group"
                                    >
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#136f42] group-hover:text-white transition-all">
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">{m.full_name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 uppercase">{m.member_id}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-[#136f42] transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedMember && (
                            <div className="mt-6 bg-[#136f42]/5 border border-[#136f42]/10 rounded-[2rem] p-6 flex items-center gap-5">
                                <div className="w-14 h-14 bg-[#136f42] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                    <User size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-lg text-slate-900 leading-tight">{selectedMember.full_name}</p>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{selectedMember.member_id}</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedMember(null); setSelectedSimpanans([]); }}
                                    className="p-3 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* STEP 2: PILIH SIMPANAN */}
                    {selectedMember && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-inner">
                                    <Wallet size={18} strokeWidth={3} />
                                </div>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tahap 2: Sumber Dana</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SIMPANAN_LIST.map((s) => {
                                    const balance = selectedMember[s.col] || 0;
                                    const Icon = s.icon;
                                    const isSelected = selectedSimpanans.find(sim => sim.id === s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleSimpanan(s)}
                                            className={cn(
                                                "flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group",
                                                isSelected
                                                    ? "bg-[#136f42] border-[#136f42] shadow-xl shadow-green-900/20 scale-[1.02]"
                                                    : "bg-slate-50/50 border-slate-100 hover:border-green-200 hover:bg-white"
                                            )}
                                        >
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-white/20" : s.bg)}>
                                                <Icon size={20} className={isSelected ? "text-white" : s.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-green-100" : "text-slate-400")}>{s.label}</p>
                                                <p className={cn("text-sm font-bold font-mono mt-0.5", isSelected ? "text-white" : "text-slate-900")}>{formatRupiah(balance)}</p>
                                            </div>
                                            {isSelected && <CheckCircle size={20} className="text-white animate-in zoom-in" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* SISI KANAN: STEP 3 (EKSEKUSI) */}
                <div className="lg:col-span-5">
                    {selectedMember && selectedSimpanans.length > 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 md:p-8 sticky top-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#136f42] shadow-inner">
                                    <Banknote size={18} strokeWidth={3} />
                                </div>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tahap 3: Finalisasi</h2>
                            </div>

                            <form onSubmit={handleOpenConfirm} className="space-y-6">
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
                                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full -mb-10 -mr-10" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Saldo Tersedia</p>
                                    <div className="flex items-end justify-between">
                                        <h3 className="text-2xl font-black font-mono tracking-tight">{formatRupiah(getBalanceForSelected())}</h3>
                                        <Wallet size={24} className="text-slate-500" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Nominal Penarikan</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0"
                                            className="w-full h-20 text-center text-3xl font-black bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-[#136f42]/10 focus:bg-white transition-all placeholder:text-slate-200"
                                            value={tarikSemua ? parseInt(getBalanceForSelected().toString()).toLocaleString('id-ID') : amount}
                                            onChange={handleAmountChange}
                                            disabled={tarikSemua}
                                        />
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">Rp</div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setTarikSemua(!tarikSemua); if (!tarikSemua) setAmount(''); }}
                                        className={cn(
                                            "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            tarikSemua
                                                ? "bg-green-50 border-green-200 text-[#136f42]"
                                                : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        Tarik Semua Saldo
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Admin</label>
                                    <textarea
                                        placeholder="Alasan penarikan..."
                                        className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold focus:ring-4 focus:ring-[#136f42]/10 focus:bg-white transition-all min-h-[120px] resize-none"
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-[#136f42] hover:bg-[#0f5c35] text-white font-black text-sm uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Banknote size={20} />
                                    Eksekusi Sekarang
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                                <Banknote size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Pilih anggota dan jenis simpanan<br />untuk memulai penarikan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL KONFIRMASI --- */}
            {showConfirm && selectedMember && selectedSimpanans.length > 0 && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Konfirmasi Akhir</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                            Sistem akan memotong saldo total <b>{selectedSimpanans.length} Simpanan</b> sebesar:
                            <span className="block text-3xl font-black text-[#136f42] my-3">{formatRupiah(getNominalTarik())}</span>
                            Nama Anggota: <span className="font-bold text-slate-900">{selectedMember.full_name}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="h-14 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={isProcessing}
                                className="h-14 bg-[#136f42] text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                                Proses Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};