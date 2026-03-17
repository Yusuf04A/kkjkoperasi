import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, ShieldCheck, KeyRound, Phone, Search, Download, Upload, Trash2, AlertTriangle, Maximize2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

export const AdminVerification = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'verify' | 'reject' | 'reset_pin' | 'delete' | null;
        userId: string;
        userName: string;
        userData?: any;
    }>({
        isOpen: false,
        type: null,
        userId: '',
        userName: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.eq('status', 'active');
        }

        query = query.neq('role', 'admin');

        const { data, error } = await query;
        if (error) {
            toast.error("gagal mengambil data");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const executeVerify = async () => {
        const userId = selectedMember?.id;
        setIsProcessing(true);
        const toastId = toast.loading('memverifikasi & mengisi saldo...');
        try {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'member')
                .eq('status', 'active')
                .not('member_id', 'is', null);

            const seq = (count || 0) + 1;
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const nnak = String(seq).padStart(4, '0');
            const memberId = `KKJ-${yy}${mm}${nnak}`;

            const { error } = await supabase
                .from('profiles')
                .update({
                    status: 'active',
                    member_id: memberId,
                    is_verified: true,
                    simpok_balance: 250000
                })
                .eq('id', userId);

            if (error) throw error;

            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'akun aktif!',
                message: `selamat! akun anda telah diverifikasi. niak: ${memberId}. simpanan pokok rp 250.000 telah diaktifkan.`,
                type: 'success'
            });

            toast.success('anggota berhasil diaktifkan!', { id: toastId });
            setShowVerifyModal(false);
            fetchUsers();
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeReject = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('menolak...');
        try {
            await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
            toast.success('pendaftaran ditolak', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeResetPin = async () => {
        const { userId } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('mereset pin...');
        try {
            const { error } = await supabase.from('profiles').update({ pin: null }).eq('id', userId);
            if (error) throw error;
            toast.success('pin berhasil direset!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err: any) {
            toast.error('gagal: ' + err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeDeleteUser = async () => {
        const { userId, userData } = confirmModal;
        setIsProcessing(true);
        const toastId = toast.loading('memeriksa saldo...');
        try {
            const totalBalance = (
                (userData.tapro_balance || 0) +
                (userData.simpok_balance || 0) +
                (userData.simwa_balance || 0) +
                (userData.tamasa_balance || 0) +
                (userData.inflip_balance || 0)
            );

            if (totalBalance > 0) {
                throw new Error(`gagal: anggota masih memiliki saldo ${formatRupiah(totalBalance)}.`);
            }

            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            toast.success('akun dihapus!', { id: toastId });
            setConfirmModal({ ...confirmModal, isOpen: false });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerModal = (type: 'verify' | 'reject' | 'reset_pin' | 'delete', id: string, name: string, data?: any) => {
        if (type === 'verify') {
            setSelectedMember(data);
            setShowVerifyModal(true);
        } else {
            setConfirmModal({ isOpen: true, type, userId: id, userName: name || 'anggota', userData: data });
        }
    };

    const handleExportCSV = () => {
        if (filteredUsers.length === 0) return toast.error("tidak ada data");

        const exportData = filteredUsers.map(u => ({
            "ID Anggota": u.member_id || '',
            "Nama Anggota": u.full_name || '',
            "Kontak": u.phone || '',
            "Simpanan Pokok": u.simpok_balance || 0,
            "Simpanan Wajib": u.simwa_balance || 0,
            "Tapro": u.tapro_balance || 0,
            "Siqurma": u.siqurma_balance || 0,
            "Siwalima": u.siwalima_balance || 0,
            "Siuji": u.siuji_balance || 0,
            "Simade": u.simade_balance || 0,
            "Sipena": u.sipena_balance || 0,
            "Sihara": u.sihara_balance || 0
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data_Anggota");
        XLSX.writeFile(wb, `Data_Anggota_KKJ.xlsx`);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "ID Anggota": "KKJ-24010001",
                "Nama Anggota": "Ahmad Dani",
                "Kontak": "08123456789",
                "Simpanan Pokok": 250000,
                "Simpanan Wajib": 50000,
                "Tapro": 100000,
                "Siqurma": 0,
                "Siwalima": 0,
                "Siuji": 0,
                "Simade": 0,
                "Sipena": 0,
                "Sihara": 0
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
        XLSX.writeFile(wb, `Template_Import_Anggota_KKJ.xlsx`);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const toastId = toast.loading('Membaca file Excel...');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            if (jsonData.length === 0) {
                throw new Error("File Excel kosong / format tidak sesuai.");
            }

            console.log("Parsed Excel Data:", jsonData);
            console.log("Kolom terdeteksi:", Object.keys(jsonData[0]));

            // --- VALIDASI KOLOM HEADER ---
            const firstRow = jsonData[0];
            const colKeys = Object.keys(firstRow);

            // Helper: cari key yang cocok (case-insensitive)
            const findCol = (candidates: string[]): string | null => {
                for (const c of candidates) {
                    const found = colKeys.find(k => k.trim().toLowerCase() === c.toLowerCase());
                    if (found) return found;
                }
                return null;
            };

            const colNama = findCol(["Nama Anggota", "Nama", "nama anggota", "nama"]);
            const colKontak = findCol(["Kontak", "No HP", "Phone", "kontak", "no hp", "phone", "no_hp"]);
            const colMemberId = findCol(["ID Anggota", "NIAK", "id anggota", "niak", "member_id"]);
            const colSimpok = findCol(["Simpanan Pokok", "simpanan pokok", "Simpok"]);
            const colSimwa = findCol(["Simpanan Wajib", "simpanan wajib", "Simwa"]);
            const colTapro = findCol(["Tapro", "tapro"]);
            const colSiqurma = findCol(["Siqurma", "siqurma"]);
            const colSiwalima = findCol(["Siwalima", "siwalima"]);
            const colSiuji = findCol(["Siuji", "siuji"]);
            const colSimade = findCol(["Simade", "simade"]);
            const colSipena = findCol(["Sipena", "sipena"]);
            const colSihara = findCol(["Sihara", "sihara"]);

            if (!colNama && !colMemberId) {
                throw new Error(
                    `Format file Excel tidak sesuai! Kolom yang terdeteksi: [${colKeys.join(', ')}]. ` +
                    `Pastikan file memiliki header kolom minimal: "ID Anggota", "Nama Anggota", "Kontak". ` +
                    `Gunakan tombol TEMPLATE untuk mengunduh format yang benar.`
                );
            }

            toast.loading(`Memproses ${jsonData.length} baris data...`, { id: toastId });

            let newUsersCount = 0;
            let updatedUsersCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            // Simpan admin session saat ini (untuk dipulihkan setelah membuat akun baru)
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            for (const row of jsonData) {
                const rawName = colNama ? row[colNama] : null;
                const rawPhone = colKontak ? row[colKontak] : null;
                const rawMemberId = colMemberId ? row[colMemberId] : null;

                if (!rawName && !rawMemberId) {
                    console.warn("Baris dilewati (Nama & ID kosong):", row);
                    skippedCount++;
                    continue;
                }

                // Normalisasi Phone
                let phone = '';
                if (rawPhone) {
                    phone = String(rawPhone).replace(/\D/g, '');
                    if (phone.startsWith('62')) {
                        phone = '0' + phone.substring(2);
                    } else if (phone.startsWith('8')) {
                        phone = '0' + phone;
                    }
                }

                // Parse Saldo
                const c_simpok = colSimpok ? (Number(row[colSimpok]) || 0) : 0;
                const c_simwa = colSimwa ? (Number(row[colSimwa]) || 0) : 0;
                const c_tapro = colTapro ? (Number(row[colTapro]) || 0) : 0;
                const c_siqurma = colSiqurma ? (Number(row[colSiqurma]) || 0) : 0;
                const c_siwalima = colSiwalima ? (Number(row[colSiwalima]) || 0) : 0;
                const c_siuji = colSiuji ? (Number(row[colSiuji]) || 0) : 0;
                const c_simade = colSimade ? (Number(row[colSimade]) || 0) : 0;
                const c_sipena = colSipena ? (Number(row[colSipena]) || 0) : 0;
                const c_sihara = colSihara ? (Number(row[colSihara]) || 0) : 0;

                // 1. Cari user berdasarkan ID Anggota ATAU Phone
                let existingUser = null;

                // Coba cari berdasarkan member_id dulu
                if (rawMemberId && String(rawMemberId).trim() !== '') {
                    const { data: byMemberId } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('member_id', String(rawMemberId).trim())
                        .limit(1);
                    if (byMemberId && byMemberId.length > 0) {
                        existingUser = byMemberId[0];
                    }
                }

                // Kalau belum ketemu, cari berdasarkan phone
                if (!existingUser && phone) {
                    const { data: byPhone } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('phone', phone)
                        .limit(1);
                    if (byPhone && byPhone.length > 0) {
                        existingUser = byPhone[0];
                    }
                }

                // Kalau masih belum ketemu, coba cari berdasarkan nama (fallback terakhir)
                if (!existingUser && rawName) {
                    const { data: byName } = await supabase
                        .from('profiles')
                        .select('*')
                        .ilike('full_name', String(rawName).trim())
                        .limit(1);
                    if (byName && byName.length > 0) {
                        existingUser = byName[0];
                    }
                }

                if (existingUser) {
                    // --- UPDATE USER EXISTING ---
                    console.log(`✅ User ditemukan: ${existingUser.full_name} (${existingUser.member_id})`);

                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            tapro_balance: c_tapro,
                            simpok_balance: c_simpok,
                            simwa_balance: c_simwa,
                            siqurma_balance: c_siqurma,
                            siwalima_balance: c_siwalima,
                            siuji_balance: c_siuji,
                            simade_balance: c_simade,
                            sipena_balance: c_sipena,
                            sihara_balance: c_sihara
                        })
                        .eq('id', existingUser.id);

                    if (!updateError) {
                        const recordTx = async (amt: number, t: string) => {
                            if (amt > 0) {
                                await supabase.from('transactions').insert({
                                    user_id: existingUser.id, type: 'deposit', amount: amt,
                                    status: 'completed', description: `Import Excel: Saldo ${t}`,
                                    payment_method: 'system_import', transaction_type: t
                                });
                            }
                        };
                        await recordTx(c_tapro, 'tapro');
                        await recordTx(c_simpok, 'simpanan_pokok');
                        await recordTx(c_simwa, 'simpanan_wajib');
                        await recordTx(c_siqurma, 'siqurma');
                        await recordTx(c_siwalima, 'siwalima');
                        await recordTx(c_siuji, 'siuji');
                        await recordTx(c_simade, 'simade');
                        await recordTx(c_sipena, 'sipena');
                        await recordTx(c_sihara, 'sihara');
                        updatedUsersCount++;
                    } else {
                        console.error("❌ Gagal update:", existingUser.full_name, updateError);
                        errorCount++;
                    }
                } else {
                    // --- CREATE NEW USER ---
                    // Harus signup via auth untuk memenuhi FK constraint profiles.id -> auth.users.id
                    console.log(`🆕 Membuat akun baru: ${rawName} (${phone})`);

                    if (!phone) {
                        console.warn("⚠️ Baris dilewati (tidak ada Kontak untuk akun baru):", rawName);
                        skippedCount++;
                        continue;
                    }

                    let newMemberId = rawMemberId ? String(rawMemberId).trim() : '';
                    if (!newMemberId) {
                        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).not('member_id', 'is', null);
                        const seq = (count || 0) + 1;
                        const yy = String(new Date().getFullYear()).slice(2);
                        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
                        newMemberId = `KKJ-${yy}${mm}${String(seq).padStart(4, '0')}`;
                    }

                    // Buat akun auth dengan email dummy unik dari phone
                    const dummyEmail = `import_${phone.replace(/\D/g, '')}@kkj.local`;
                    const dummyPassword = crypto.randomUUID().substring(0, 16);

                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: dummyEmail,
                        password: dummyPassword,
                        options: {
                            data: {
                                full_name: String(rawName).trim(),
                                phone_number: phone,
                            }
                        }
                    });

                    // Restore admin session segera setelah signUp
                    if (adminSession) {
                        await supabase.auth.setSession({
                            access_token: adminSession.access_token,
                            refresh_token: adminSession.refresh_token,
                        });
                    }

                    if (signUpError || !signUpData.user) {
                        console.error("❌ Gagal signup:", rawName, signUpError?.message);
                        errorCount++;
                        continue;
                    }

                    const newUserId = signUpData.user.id;

                    // Upsert profil dengan data lengkap
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: newUserId,
                            member_id: newMemberId,
                            full_name: String(rawName).trim(),
                            phone: phone,
                            email: dummyEmail,
                            role: 'member',
                            status: 'active',
                            is_verified: true,
                            tapro_balance: c_tapro,
                            simpok_balance: c_simpok,
                            simwa_balance: c_simwa,
                            siqurma_balance: c_siqurma,
                            siwalima_balance: c_siwalima,
                            siuji_balance: c_siuji,
                            simade_balance: c_simade,
                            sipena_balance: c_sipena,
                            sihara_balance: c_sihara
                        });

                    if (!profileError) {
                        const recordTxNew = async (amt: number, t: string) => {
                            if (amt > 0) {
                                await supabase.from('transactions').insert({
                                    user_id: newUserId, type: 'deposit', amount: amt,
                                    status: 'completed', description: `Import Excel (Akun Baru): Saldo ${t}`,
                                    payment_method: 'system_import', transaction_type: t
                                });
                            }
                        };
                        await recordTxNew(c_tapro, 'tapro');
                        await recordTxNew(c_simpok, 'simpanan_pokok');
                        await recordTxNew(c_simwa, 'simpanan_wajib');
                        await recordTxNew(c_siqurma, 'siqurma');
                        await recordTxNew(c_siwalima, 'siwalima');
                        await recordTxNew(c_siuji, 'siuji');
                        await recordTxNew(c_simade, 'simade');
                        await recordTxNew(c_sipena, 'sipena');
                        await recordTxNew(c_sihara, 'sihara');
                        newUsersCount++;
                    } else {
                        console.error("❌ Gagal upsert profil:", rawName, profileError);
                        errorCount++;
                    }
                }
            }

            let msg = `Selesai! ${updatedUsersCount} Diperbarui, ${newUsersCount} Ditambahkan.`;
            if (skippedCount > 0) msg += ` ${skippedCount} Dilewati.`;
            if (errorCount > 0) msg += ` ${errorCount} Error.`;

            toast.success(msg, { id: toastId, duration: 6000 });
            fetchUsers();

        } catch (error: any) {
            console.error(error);
            toast.error(`Gagal import: ${error.message}`, { id: toastId, duration: 8000 });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white font-sans text-left">
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1 capitalize">Manajemen Anggota</h1>
                        <p className="text-xs font-bold text-slate-500">Verifikasi identitas ktp & kelola data anggota aktif.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeTab === 'active' && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv, .xlsx, .xls" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 px-6 bg-blue-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"><Upload size={16} /> Import</button>
                                <button onClick={handleExportCSV} className="p-2.5 px-6 bg-emerald-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"><Download size={16} /> Export Excel</button>
                            </>
                        )}
                        <button onClick={fetchUsers} className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"><RefreshCw size={20} className={cn("text-gray-400", loading && "animate-spin")} /></button>
                    </div>
                </div>
            </div>

            <div className="flex gap-8 mb-6 border-b border-gray-100">
                <button onClick={() => setActiveTab('pending')} className={cn("pb-4 px-2 font-semibold text-sm tracking-wide transition-all relative", activeTab === 'pending' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600")}>
                    Verifikasi baru {users.length > 0 && activeTab === 'pending' && <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] tracking-normal font-normal">{users.length}</span>}
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#136f42] animate-in slide-in-from-left duration-300"></div>}
                </button>
                <button onClick={() => setActiveTab('active')} className={cn("pb-4 px-2 font-semibold text-sm tracking-wide transition-all relative", activeTab === 'active' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600")}>
                    Data anggota aktif
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#136f42] animate-in slide-in-from-left duration-300"></div>}
                </button>
            </div>

            {activeTab === 'active' && (
                <div className="mb-6 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#136f42] transition-colors" size={18} />
                    <input type="text" placeholder="cari nama, niak, atau no hp..." className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 outline-none focus:border-[#136f42] focus:ring-2 focus:ring-green-50 bg-gray-50/50 transition-all font-normal text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/30 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-[10px] font-semibold text-gray-400">Anggota</th>
                                <th className="p-4 text-[10px] font-semibold text-gray-400">Kontak</th>
                                <th className="p-4 text-[10px] font-semibold text-gray-400">Registrasi</th>
                                {activeTab === 'active' && <th className="p-4 text-[10px] font-semibold text-gray-400">Saldo Tapro</th>}
                                <th className="p-4 text-[10px] font-semibold text-gray-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" size={32} /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-normal text-sm italic">Tidak ada data anggota ditemukan.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/20 transition-all group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center font-semibold text-[#136f42] text-xs">{u.full_name?.substring(0, 2)}</div>}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700 text-sm tracking-tight">{u.full_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono bg-gray-50 w-fit px-1.5 rounded mt-0.5">{u.member_id || 'menunggu niak'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-xs font-normal text-gray-600"><Phone size={12} className="text-[#136f42]" /> {u.phone}</div>
                                            <div className="text-[11px] text-gray-400 font-normal lowercase mt-0.5">{u.email || 'email kosong'}</div>
                                        </td>
                                        <td className="p-4 text-[11px] font-normal text-gray-500">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                                        {activeTab === 'active' && <td className="p-4 font-semibold text-gray-700 text-sm">{formatRupiah(u.tapro_balance || 0)}</td>}
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => triggerModal('reject', u.id, u.full_name)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-50 transition-all active:scale-95"><X size={18} /></button>
                                                        <button onClick={() => triggerModal('verify', u.id, u.full_name, u)} className="px-5 py-2 bg-[#136f42] text-white rounded-lg hover:bg-green-800 font-semibold text-[10px] flex items-center gap-2 transition-all active:scale-95"><Check size={14} /> Review Verifikasi</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => triggerModal('reset_pin', u.id, u.full_name)} className="px-4 py-2 border border-amber-100 text-amber-600 hover:bg-amber-50 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all"><KeyRound size={14} /> Reset Pin</button>
                                                        <button onClick={() => triggerModal('delete', u.id, u.full_name, u)} className="p-2 border border-rose-50 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-95"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DETAIL VERIFIKASI */}
            {showVerifyModal && selectedMember && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Review Pendaftaran</h3>
                                <p className="text-[10px] font-normal text-gray-400 mt-0.5">Pastikan foto ktp & bukti transfer di WA sesuai</p>
                            </div>
                            <button onClick={() => setShowVerifyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90"><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-gray-400 block text-left">Foto KTP Anggota</label>
                                <div className="aspect-video w-full bg-slate-50 rounded-xl overflow-hidden border border-gray-100 group relative">
                                    {selectedMember.ktp_url ? (
                                        <>
                                            <img
                                                src={`${supabase.storage.from('ktp-registrations').getPublicUrl(selectedMember.ktp_url).data.publicUrl}`}
                                                alt="KTP"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <a href={supabase.storage.from('ktp-registrations').getPublicUrl(selectedMember.ktp_url).data.publicUrl} target="_blank" rel="noreferrer" className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-semibold text-[10px] shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                                                    <Maximize2 size={14} /> Perbesar foto
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                            <AlertTriangle size={32} />
                                            <p className="font-medium text-[9px]">KTP belum diunggah</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-left">
                                    <p className="text-[9px] font-semibold text-gray-400 mb-1">Nama Pendaftar</p>
                                    <p className="text-base font-semibold text-gray-700 tracking-tight">{selectedMember.full_name}</p>
                                    <p className="text-xs font-normal text-[#136f42] mt-0.5">{selectedMember.phone}</p>
                                </div>
                                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 text-left">
                                    <p className="text-[9px] font-semibold text-green-600 mb-1">Status Keuangan</p>
                                    <p className="text-base font-semibold text-green-700 tracking-tight">Wajib Bayar</p>
                                    <p className="text-xs font-normal text-green-600 mt-0.5 italic">rp 250.000 (pas)</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-400 font-semibold text-[10px] rounded-xl hover:bg-gray-50 transition-all active:scale-95">Tunda</button>
                            <button
                                onClick={executeVerify}
                                disabled={isProcessing}
                                className="flex-[2] bg-[#136f42] text-white py-3 rounded-xl font-semibold text-[10px] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> AKTIFKAN ANGGOTA</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI LAINNYA */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center border border-gray-100">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm",
                            confirmModal.type === 'reject' ? 'bg-rose-50 text-rose-500' :
                                confirmModal.type === 'reset_pin' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                        )}>
                            {confirmModal.type === 'reject' ? <X size={28} /> : confirmModal.type === 'reset_pin' ? <KeyRound size={28} /> : <Trash2 size={28} />}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 tracking-tight mb-2">
                            {confirmModal.type === 'reject' ? 'TOLAK ANGGOTA?' : confirmModal.type === 'reset_pin' ? 'RESET PIN?' : 'HAPUS AKUN?'}
                        </h3>
                        <p className="text-xs text-gray-400 font-normal mb-8 leading-relaxed">
                            Konfirmasi tindakan untuk anggota <span className="text-gray-700 font-semibold">{confirmModal.userName}</span>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-3 bg-gray-50 text-gray-400 font-semibold rounded-lg text-[10px] active:scale-95 transition-all">Batal</button>
                            <button onClick={() => {
                                if (confirmModal.type === 'reject') executeReject();
                                else if (confirmModal.type === 'reset_pin') executeResetPin();
                                else if (confirmModal.type === 'delete') executeDeleteUser();
                            }} className={cn("py-3 text-white font-semibold rounded-lg text-[10px] active:scale-95 transition-all shadow-sm",
                                confirmModal.type === 'reset_pin' ? 'bg-amber-500' : 'bg-rose-600'
                            )}>LANJUTKAN</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};