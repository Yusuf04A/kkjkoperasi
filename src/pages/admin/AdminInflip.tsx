import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import {
    Plus, Pencil, ArrowLeft, Building, MapPin,
    Save, X, Image as ImageIcon,
    Trash2, TrendingUp, Package, Loader2, Info,
    Clock, Archive, CheckCircle, AlertCircle, Check, Eye, EyeOff
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
// 🔥 IMPORT LIBRARY KOMPRESI
import imageCompression from 'browser-image-compression';
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

// Sesuaikan Interface dengan Kolom Database Anda
interface InflipProject {
    id: string;
    title: string;
    description: string;
    location: string;
    target_amount: number;
    collected_amount: number;
    min_investment: number;
    roi_percent: number;      // Sesuai DB
    duration_months: number;  // Sesuai DB
    image_url: string | null;
    status: string;
    is_hidden: boolean;
}

export const AdminInflip = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'projects' | 'pending' | 'history'>('projects');
    const [projects, setProjects] = useState<InflipProject[]>([]);
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State (Default Value)
    const [formData, setFormData] = useState<Partial<InflipProject>>({
        title: '',
        description: '',
        location: '',
        roi_percent: 0,
        target_amount: 0,
        collected_amount: 0,
        min_investment: 0,
        duration_months: 0,
        image_url: '',
        status: 'open',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // 🔥 STATE UNTUK CUSTOM POPUP CONFIRMATION 🔥
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | null;
        investment: any;
    }>({
        isOpen: false,
        type: null,
        investment: null
    });

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
        } else {
            fetchInvestments();
        }
    }, [activeTab]);

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inflip_projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setProjects(data);
        setLoading(false);
    };

    const fetchInvestments = async () => {
        setLoading(true);
        let query = supabase
            .from('inflip_investments')
            .select(`*, profiles(full_name, member_id), inflip_projects(title, duration_months, roi_percent)`)
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.neq('status', 'pending');
        }

        const { data, error } = await query;
        if (!error && data) setInvestments(data);
        setLoading(false);
    };

    // --- HANDLERS ---
    const handleOpenModal = (project?: InflipProject) => {
        if (project) {
            setFormData(project);
            setImagePreview(project.image_url);
        } else {
            // Reset form untuk tambah baru
            setFormData({
                title: '', description: '', location: '', roi_percent: 0,
                target_amount: 0, collected_amount: 0, min_investment: 0,
                duration_months: 0, image_url: '', status: 'open'
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    // --- 🔥 FUNGSI HANDLER GAMBAR DENGAN KOMPRESI OTOMATIS 🔥 ---
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // 🔥 Validasi ukuran maksimal 10MB sebelum kompresi
            if (file.size > 10 * 1024 * 1024) {
                return toast.error("Ukuran file terlalu besar (maksimal 10MB)");
            }

            const toastId = toast.loading("Mengompres foto properti...");
            try {
                // Konfigurasi Kompresi
                const options = {
                    maxSizeMB: 1,           // Target ukuran maksimal 1MB hasil kompresi
                    maxWidthOrHeight: 1280, // Resolusi untuk properti agar detail
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(file, options);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
                toast.success("Foto berhasil dikompres & siap unggah!", { id: toastId });
            } catch (error) {
                toast.error("Gagal mengompres gambar", { id: toastId });
                // Fallback: tetap gunakan file asli jika kompresi gagal
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const triggerDelete = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setIsSaving(true);
        const toastId = toast.loading("Menghapus proyek...");

        try {
            // Cek dulu apakah ada investasi aktif di proyek ini
            const { data: investments } = await supabase
                .from('inflip_investments')
                .select('id')
                .eq('project_id', deleteModal.id)
                .limit(1);

            if (investments && investments.length > 0) {
                toast.error("Gagal menghapus! Proyek ini sudah memiliki data investasi dari anggota.", { id: toastId });
                setDeleteModal({ isOpen: false, id: null });
                return;
            }

            const { error } = await supabase.from('inflip_projects').delete().eq('id', deleteModal.id);

            if (error) {
                // If it's a foreign key error or constraint, catch it
                throw error;
            }

            toast.success("Proyek berhasil dihapus", { id: toastId });
            fetchProjects();
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menghapus, data sedang digunakan.", { id: toastId });
        } finally {
            setIsSaving(false);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const toggleVisibility = async (id: string, currentStatus: boolean) => {
        const toastId = toast.loading(currentStatus ? "Menampilkan proyek..." : "Menyembunyikan proyek...");
        const { error } = await supabase.from('inflip_projects').update({ is_hidden: !currentStatus }).eq('id', id);

        if (error) {
            toast.error("Gagal mengubah status: " + error.message, { id: toastId });
        } else {
            toast.success(currentStatus ? "Proyek ditampilkan ke User" : "Proyek disembunyikan dari User", { id: toastId });
            fetchProjects();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Menyimpan data...");

        try {
            let finalImageUrl = formData.image_url;

            // 1. Upload Gambar jika ada file baru (sudah dikompres sebelumnya)
            if (imageFile) {
                const fileName = `inflip/${Date.now()}-${imageFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage.from('shop_products').upload(fileName, imageFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('shop_products').getPublicUrl(fileName);
                finalImageUrl = urlData.publicUrl;
            }

            const payload = { ...formData, image_url: finalImageUrl };

            if (formData.id) {
                await supabase.from('inflip_projects').update(payload).eq('id', formData.id);
            } else {
                await supabase.from('inflip_projects').insert(payload);
            }

            toast.success("Proyek berhasil disimpan!", { id: toastId });
            setIsModalOpen(false);
            fetchProjects();
        } catch (error: any) {
            toast.error("Gagal: " + error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNumberChange = (field: keyof InflipProject, value: string) => {
        const rawValue = value.replace(/\D/g, '');
        setFormData({ ...formData, [field]: Number(rawValue) });
    };

    const triggerModal = (type: 'approve' | 'reject', investment: any) => {
        setConfirmModal({ isOpen: true, type, investment });
    };

    const executeApprove = async () => {
        const inv = confirmModal.investment;
        if (!inv) return;

        setIsSaving(true);
        const toastId = toast.loading("Memproses...");

        try {
            const { error: updateErr } = await supabase.from("inflip_investments").update({ status: "active" }).eq("id", inv.id);
            if (updateErr) throw updateErr;

            const { data: project, error: projFetchErr } = await supabase.from('inflip_projects').select('collected_amount').eq('id', inv.project_id).single();
            if (projFetchErr) throw projFetchErr;

            if (project) {
                const { error: projUpdErr } = await supabase.from('inflip_projects').update({ collected_amount: project.collected_amount + inv.amount }).eq('id', inv.project_id);
                if (projUpdErr) throw projUpdErr;
            }

            const { error: notifErr } = await supabase.from("notifications").insert({
                user_id: inv.user_id,
                title: "Investasi INFLIP Disetujui",
                message: `Investasi sebesar ${formatRupiah(inv.amount)} pada proyek ${inv.inflip_projects?.title} telah disetujui.`,
                type: "success"
            });
            if (notifErr) throw notifErr;

            toast.success("Disetujui!", { id: toastId });
            setConfirmModal({ isOpen: false, type: null, investment: null });
            fetchInvestments();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const executeReject = async () => {
        const inv = confirmModal.investment;
        if (!inv) return;

        setIsSaving(true);
        const toastId = toast.loading("Menolak...");
        try {
            const { error: updateErr } = await supabase.from("inflip_investments").update({ status: "rejected" }).eq("id", inv.id);
            if (updateErr) throw updateErr;

            const { data: userProfile, error: profileErr } = await supabase.from('profiles').select('tapro_balance').eq('id', inv.user_id).single();
            if (profileErr) throw profileErr;

            if (userProfile) {
                const { error: profUpdErr } = await supabase.from('profiles').update({ tapro_balance: userProfile.tapro_balance + inv.amount }).eq('id', inv.user_id);
                if (profUpdErr) throw profUpdErr;

                const { error: insertErr } = await supabase.from('transactions').insert({
                    user_id: inv.user_id,
                    type: 'topup',
                    amount: inv.amount,
                    status: 'success',
                    description: 'Refund INFLIP Ditolak Admin'
                });
                if (insertErr) throw insertErr;
            }
            toast.success("Ditolak & Dana Dikembalikan", { id: toastId });
            setConfirmModal({ isOpen: false, type: null, investment: null });
            fetchInvestments();
        } catch (err: any) {
            toast.error("Gagal menolak: " + err.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">

            {/* Header */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Manajemen INFLIP</h1>
                        <p className="text-xs font-bold text-slate-500 tracking-widest">Kelola portofolio investasi properti koperasi & Verifikasi Data Proyek Menunggu Konfirmasi</p>
                    </div>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2",
                        activeTab === 'projects' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Building size={16} /> Data Proyek
                    {activeTab === 'projects' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2",
                        activeTab === 'pending' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Clock size={16} /> Menunggu Konfirmasi
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2",
                        activeTab === 'history' ? "text-[#136f42]" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Archive size={16} /> Riwayat Investasi
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                </button>
            </div>

            {/* List Projects */}
            {activeTab === 'projects' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-[#136f42] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-green-700 transition-all active:scale-95"
                        >
                            <Plus size={18} /> Tambah Proyek
                        </button>
                    </div>
                    {loading ? (
                        <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div>
                    ) : projects.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                            <Building size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium lowercase italic">Belum ada proyek investasi yang ditambahkan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                    {/* Card Image */}
                                    <div className="h-48 relative bg-gray-200 shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={32} /></div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#136f42] px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                                            <TrendingUp size={12} /> ROI {item.roi_percent}%
                                        </div>
                                        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button onClick={() => toggleVisibility(item.id, item.is_hidden)} className={cn("p-1.5 bg-white rounded-lg shadow transition-colors", item.is_hidden ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600")}>
                                                {item.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => triggerDelete(item.id)} className="p-1.5 bg-white text-red-600 rounded-lg shadow hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                        {item.is_hidden && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                                <span className="bg-slate-900/80 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/20">DISEMBUNYIKAN</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2 tracking-tight">{item.title}</h3>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                                            <MapPin size={12} /> {item.location}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-500 lowercase">Terkumpul</span>
                                                <span className="text-[#136f42] font-black">
                                                    {item.target_amount > 0 ? Math.min(100, Math.round((item.collected_amount / item.target_amount) * 100)) : 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-[#136f42] rounded-full transition-all duration-1000"
                                                    style={{ width: `${item.target_amount > 0 ? Math.min(100, (item.collected_amount / item.target_amount) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                <span className="font-bold text-slate-700">{formatRupiah(item.collected_amount)}</span>
                                                <span>Target: {formatRupiah(item.target_amount)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 mt-auto">
                                            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                                <p className="text-[9px] text-gray-400 font-black">Min. Invest</p>
                                                <p className="text-xs font-bold text-slate-800 tracking-tighter">{formatRupiah(item.min_investment)}</p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                                <p className="text-[9px] text-gray-400 font-black">Tenor</p>
                                                <p className="text-xs font-bold text-slate-800 tracking-tighter">{item.duration_months} Bulan</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* List Investments (Pending & History) */}
            {(activeTab === 'pending' || activeTab === 'history') && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div>
                    ) : investments.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                {activeTab === 'pending' ? <Clock size={32} /> : <CheckCircle size={32} />}
                            </div>
                            <p>Tidak ada data transaksi di tab {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {investments.map((inv) => (
                                <div key={inv.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 text-[#136f42] rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                                                    <Building size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{inv.profiles?.full_name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em]">{inv.profiles?.member_id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest mb-1",
                                                    inv.status === 'active' || inv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        inv.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-amber-50 text-amber-600'
                                                )}>
                                                    {inv.status}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                                                    <Clock size={10} /> {format(new Date(inv.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                                <p className="text-[9px] text-slate-400 font-black tracking-widest mb-1">Nominal Investasi</p>
                                                <p className="text-2xl font-black text-[#136f42] tracking-tighter">{formatRupiah(inv.amount)}</p>
                                            </div>
                                            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 relative overflow-hidden">
                                                <p className="text-[9px] text-slate-400 font-black tracking-widest mb-1">Target Proyek</p>
                                                <p className="font-bold text-slate-700 tracking-tight truncate pr-8">{inv.inflip_projects?.title}</p>
                                                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded font-bold">ROI {inv.inflip_projects?.roi_percent}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTab === 'pending' && (
                                        <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8 border-slate-100 min-w-[220px]">
                                            <button
                                                onClick={() => triggerModal('approve', inv)}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> Setujui
                                            </button>
                                            <button
                                                onClick={() => triggerModal('reject', inv)}
                                                className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 border border-gray-200 max-h-[90vh] overflow-y-auto text-left">

                        <div className="flex justify-between items-center border-b pb-4 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{formData.id ? 'Edit Proyek Properti' : 'Tambah Proyek Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* KIRI: Gambar & Status */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                                        <ImageIcon size={14} className="text-[#136f42]" /> Foto Properti
                                    </label>
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">Maks 10MB</span>
                                </div>

                                <label className="block w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-[#136f42] transition-all group relative overflow-hidden bg-gray-50">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover animate-in fade-in" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black tracking-widest">Ganti Foto Proyek</div>
                                        </>
                                    ) : (
                                        <div className="text-center group-hover:scale-105 transition-transform duration-300 px-4">
                                            <ImageIcon className="mx-auto text-gray-300 mb-2" size={40} />
                                            <p className="text-sm font-bold text-gray-600 first-letter:uppercase">Pilih foto properti</p>
                                            <div className="mt-2 flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-400 tracking-tighter flex items-center justify-center gap-1">
                                                    <Info size={10} /> jpg, png, webp
                                                </p>
                                                <p className="text-[10px] font-black text-[#136f42] tracking-tighter">Otomatis Dikompres ke 1MB</p>
                                            </div>
                                        </div>
                                    )}
                                </label>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Status Proyek</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-white border border-gray-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-kkj-blue/10 focus:border-[#136f42] transition-all"
                                    >
                                        <option value="open">Open (Membuka Investasi)</option>
                                        <option value="closed">Closed (Target Terpenuhi)</option>
                                        <option value="completed">Completed (Proyek Selesai)</option>
                                    </select>
                                </div>
                            </div>

                            {/* KANAN: Input Data */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Nama Proyek</label>
                                    <input type="text" required placeholder="Misal: Perumahan Cluster Hijau" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-[#136f42] transition-all bg-gray-50/50" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Lokasi Proyek</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="text" required placeholder="Kota / Wilayah" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border border-gray-200 pl-10 pr-4 py-3.5 rounded-xl font-medium text-slate-800 outline-none focus:border-[#136f42] transition-all bg-gray-50/50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Target Dana (Rp)</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.target_amount ? formData.target_amount.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handleNumberChange('target_amount', e.target.value)}
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-black text-slate-800 outline-none focus:border-[#136f42] bg-gray-50/50"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Terkumpul (Rp)</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.collected_amount ? formData.collected_amount.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handleNumberChange('collected_amount', e.target.value)}
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-black text-[#136f42] outline-none focus:border-[#136f42] bg-gray-50/50"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">ROI (%)</label>
                                        <input type="number" step="0.1" required value={formData.roi_percent} onChange={(e) => setFormData({ ...formData, roi_percent: Number(e.target.value) })} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-[#136f42] bg-gray-50/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Tenor (Bln)</label>
                                        <input type="number" required value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-[#136f42] bg-gray-50/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Min. Invest</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.min_investment ? formData.min_investment.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handleNumberChange('min_investment', e.target.value)}
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-[#136f42] bg-gray-50/50"
                                            placeholder="Rp"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-1 mb-1.5 block">Deskripsi Detail Proyek</label>
                            <textarea
                                rows={3}
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border border-gray-200 p-4 rounded-2xl font-medium text-slate-800 outline-none focus:border-[#136f42] resize-none bg-gray-50/50"
                                placeholder="Jelaskan spesifikasi, rencana penggunaan dana, dan bagi hasil..."
                            />
                        </div>

                        <div className="flex gap-3 pt-6 mt-2">
                            <button type="submit" disabled={isSaving} className="flex-1 bg-[#136f42] text-white py-4 rounded-2xl font-black tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isSaving ? 'Menyimpan...' : 'Simpan Proyek'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border border-gray-200 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all text-[10px] tracking-widest">
                                Batal
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* 🔥 CUSTOM POPUP CONFIRMATION MODAL 🔥 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", confirmModal.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                            {confirmModal.type === 'approve' ? <Info size={32} /> : <AlertCircle size={32} />}
                        </div>

                        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
                            {confirmModal.type === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Investasi'}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-4 lowercase">
                            {confirmModal.type === 'approve'
                                ? `Setujui investasi sebesar ${formatRupiah(confirmModal.investment?.amount)} untuk anggota ${confirmModal.investment?.profiles?.full_name}?`
                                : `Tolak investasi ini? Saldo Tapro sebesar ${formatRupiah(confirmModal.investment?.amount)} akan dikembalikan secara otomatis ke anggota.`
                            }
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, type: null, investment: null })} className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button onClick={confirmModal.type === 'approve' ? executeApprove : executeReject} disabled={isSaving} className={cn("py-3.5 text-white font-black rounded-2xl text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform", confirmModal.type === 'approve' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-rose-600 shadow-rose-900/20')}>
                                {isSaving ? 'Proses...' : `Ya, ${confirmModal.type === 'approve' ? 'Setujui' : 'Tolak'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 MODAL DELETE PROYEK 🔥 */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-50 text-rose-600">
                            <AlertCircle size={32} />
                        </div>

                        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
                            Hapus Proyek
                        </h3>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-4 lowercase">
                            apakah anda yakin ingin menghapus proyek investasi ini? data yang telah dihapus tidak dapat dikembalikan.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button onClick={confirmDelete} disabled={isSaving} className="py-3.5 text-white bg-rose-600 shadow-rose-900/20 font-black rounded-2xl text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform">
                                {isSaving ? 'Proses...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};