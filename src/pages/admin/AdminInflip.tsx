import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    Plus, Pencil, ArrowLeft, Building, MapPin, 
    Save, X, Image as ImageIcon, 
    Trash2, TrendingUp, Package, Loader2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
// 🔥 IMPORT LIBRARY KOMPRESI
import imageCompression from 'browser-image-compression'; 

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
}

export const AdminInflip = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<InflipProject[]>([]);
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

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inflip_projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) setProjects(data);
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
            
            const toastId = toast.loading("Mengompres foto properti...");
            try {
                // Konfigurasi Kompresi
                const options = {
                    maxSizeMB: 1,           // Target ukuran maksimal 1MB
                    maxWidthOrHeight: 1280, // Resolusi sedikit lebih tinggi untuk properti agar detail
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(file, options);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
                toast.success("Foto diproses & diperkecil!", { id: toastId });
            } catch (error) {
                toast.error("Gagal mengompres gambar", { id: toastId });
                // Fallback: tetap gunakan file asli jika kompresi gagal
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin hapus proyek ini? Data investasi user mungkin akan terpengaruh.")) return;
        const { error } = await supabase.from('inflip_projects').delete().eq('id', id);
        if (error) toast.error("Gagal menghapus");
        else {
            toast.success("Proyek dihapus");
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

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            
            {/* Header */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Manajemen Properti (INFLIP)</h1>
                        <p className="text-sm text-gray-500 mt-1 lowercase">Kelola portofolio investasi properti koperasi</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="bg-[#003366] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-blue-900 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Tambah Proyek
                    </button>
                </div>
            </div>

            {/* List Projects */}
            {loading ? (
                <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></div>
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
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={32}/></div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#003366] px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                                    <TrendingUp size={12} /> ROI {item.roi_percent}%
                                </div>
                                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50 transition-colors"><Pencil size={14}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white text-red-600 rounded-lg shadow hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2 uppercase tracking-tight">{item.title}</h3>
                                <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                                    <MapPin size={12} /> {item.location}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500 lowercase">Terkumpul</span>
                                        <span className="text-[#003366] font-black">
                                            {item.target_amount > 0 ? Math.min(100, Math.round((item.collected_amount / item.target_amount) * 100)) : 0}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className="h-full bg-[#003366] rounded-full transition-all duration-1000" 
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
                                        <p className="text-[9px] text-gray-400 uppercase font-black">Min. Invest</p>
                                        <p className="text-xs font-bold text-slate-800 tracking-tighter">{formatRupiah(item.min_investment)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                        <p className="text-[9px] text-gray-400 uppercase font-black">Tenor</p>
                                        <p className="text-xs font-bold text-slate-800 tracking-tighter">{item.duration_months} Bulan</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 border border-gray-200 max-h-[90vh] overflow-y-auto">
                        
                        <div className="flex justify-between items-center border-b pb-4 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{formData.id ? 'Edit Proyek Properti' : 'Tambah Proyek Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* KIRI: Gambar & Status */}
                            <div className="space-y-4">
                                <label className="block w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-kkj-blue transition-all group relative overflow-hidden bg-gray-50">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover animate-in fade-in" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-widest">Ganti Foto Proyek</div>
                                        </>
                                    ) : (
                                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                            <ImageIcon className="mx-auto text-gray-300 mb-2" size={40}/>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unggah Foto Properti</p>
                                            <p className="text-[9px] text-slate-300 mt-1 uppercase font-bold italic">Otomatis Dikompres</p>
                                        </div>
                                    )}
                                </label>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Status Proyek</label>
                                    <select 
                                        value={formData.status} 
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full bg-white border border-gray-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-kkj-blue/10 focus:border-kkj-blue transition-all"
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Nama Proyek</label>
                                    <input type="text" required placeholder="Misal: Perumahan Cluster Hijau" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-kkj-blue transition-all bg-gray-50/50" />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Lokasi Proyek</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input type="text" required placeholder="Kota / Wilayah" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-200 pl-10 pr-4 py-3.5 rounded-xl font-medium text-slate-800 outline-none focus:border-kkj-blue transition-all bg-gray-50/50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Target Dana (Rp)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.target_amount ? formData.target_amount.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('target_amount', e.target.value)} 
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-black text-slate-800 outline-none focus:border-kkj-blue bg-gray-50/50" 
                                            placeholder="0" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Terkumpul (Rp)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.collected_amount ? formData.collected_amount.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('collected_amount', e.target.value)} 
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-black text-[#003366] outline-none focus:border-kkj-blue bg-gray-50/50" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">ROI (%)</label>
                                        <input type="number" step="0.1" required value={formData.roi_percent} onChange={(e) => setFormData({...formData, roi_percent: Number(e.target.value)})} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-kkj-blue bg-gray-50/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Tenor (Bln)</label>
                                        <input type="number" required value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: Number(e.target.value)})} className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-kkj-blue bg-gray-50/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Min. Invest</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.min_investment ? formData.min_investment.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('min_investment', e.target.value)} 
                                            className="w-full border border-gray-200 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:border-kkj-blue bg-gray-50/50" 
                                            placeholder="Rp" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Deskripsi Detail Proyek</label>
                            <textarea 
                                rows={3}
                                value={formData.description || ''}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full border border-gray-200 p-4 rounded-2xl font-medium text-slate-800 outline-none focus:border-kkj-blue resize-none bg-gray-50/50"
                                placeholder="Jelaskan spesifikasi, rencana penggunaan dana, dan bagi hasil..."
                            />
                        </div>

                        <div className="flex gap-3 pt-6 mt-2">
                            <button type="submit" disabled={isSaving} className="flex-1 bg-[#003366] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} {isSaving ? 'Menyimpan...' : 'Simpan Proyek'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border border-gray-200 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest">
                                Batal
                            </button>
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
};