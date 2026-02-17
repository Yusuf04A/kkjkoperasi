import React, { useEffect, useState, useRef } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import { formatRupiah, cn } from '../../lib/utils';
import { 
    Plus, Pencil, ArrowLeft, Building, MapPin, 
    Save, X, Image as ImageIcon, 
    Trash2, TrendingUp, Loader2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface InflipProject {
    id: string | number;
    title: string;
    description: string;
    location: string;
    target_amount: number;
    collected_amount: number;
    funding_progress: number; // Menambahkan field dari Accessor Laravel
    min_investment: number;
    roi_percent: number;
    duration_months: number;
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
        try {
            const response = await API.get('/admin/inflip');
            setProjects(response.data || []);
        } catch (error) {
            toast.error("Gagal memuat proyek properti");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (project?: InflipProject) => {
        if (project) {
            setFormData(project);
            setImagePreview(project.image_url);
        } else {
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran maksimal 2MB");
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm("Yakin hapus proyek ini? Data investasi user mungkin akan terpengaruh.")) return;
        const toastId = toast.loading("Menghapus proyek...");
        try {
            await API.delete(`/admin/inflip/${id}`);
            toast.success("Proyek berhasil dihapus", { id: toastId });
            fetchProjects();
        } catch (error) {
            toast.error("Gagal menghapus proyek", { id: toastId });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Menyimpan data...");

        try {
            const uploadData = new FormData();
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
                if (value !== null && value !== undefined) {
                    uploadData.append(key, value);
                }
            });

            if (imageFile) uploadData.append('image', imageFile);

            if (formData.id) {
                uploadData.append('_method', 'PUT');
                await API.post(`/admin/inflip/${formData.id}`, uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await API.post('/admin/inflip', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success("Proyek berhasil disimpan!", { id: toastId });
            setIsModalOpen(false);
            fetchProjects();
        } catch (error: any) {
            toast.error("Gagal menyimpan", { id: toastId });
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
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Properti (INFLIP)</h1>
                        <p className="text-sm text-gray-500 font-medium">Kontrol portofolio investasi properti syariah</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="bg-[#003366] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={18} strokeWidth={3} /> Tambah Proyek
                    </button>
                </div>
            </div>

            {/* List Projects */}
            {loading ? (
                <div className="p-20 text-center flex flex-col items-center">
                    <Loader2 className="animate-spin text-[#003366] mb-4" size={40} />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Sinkronisasi Data...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center text-slate-300">
                    <Building size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase text-xs tracking-widest">Belum ada proyek investasi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((item) => (
                        <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col h-full">
                            <div className="h-52 relative bg-slate-100 shrink-0 overflow-hidden">
                                {item.image_url ? (
                                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={40}/></div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#003366] px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-1 uppercase tracking-tighter">
                                    <TrendingUp size={12} strokeWidth={3} /> ROI {item.roi_percent}%
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => handleOpenModal(item)} className="p-2 bg-white text-blue-600 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-colors"><Pencil size={16}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-rose-600 rounded-xl shadow-xl hover:bg-rose-600 hover:text-white transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2 tracking-tight">{item.title}</h3>
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                                    <MapPin size={12} className="text-[#136f42]" /> {item.location}
                                </div>

                                {/* PROGRESS BAR MENGGUNAKAN ACCESSOR LARAVEL */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Progres Pendanaan</span>
                                        <span className="text-[#003366]">
                                            {item.funding_progress}%
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#003366] to-blue-500 rounded-full transition-all duration-1000 shadow-sm" 
                                            style={{ width: `${item.funding_progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter mt-1">
                                        <span className="text-[#136f42]">{formatRupiah(item.collected_amount)}</span>
                                        <span className="text-slate-400">Target: {formatRupiah(item.target_amount)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 mt-auto">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl text-center border border-slate-100">
                                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">Min. Invest</p>
                                        <p className="text-[11px] font-black text-slate-800">{formatRupiah(item.min_investment)}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl text-center border border-slate-100">
                                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">Tenor</p>
                                        <p className="text-[11px] font-black text-slate-800 uppercase">{item.duration_months} Bulan</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM TETAP SAMA SEPERTI SEBELUMNYA */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom-10 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{formData.id ? 'Edit Proyek' : 'Proyek Inflip Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-600 transition-all hover:bg-rose-50"><X size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <label className="block w-full h-56 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-[#003366] transition-all group relative overflow-hidden shadow-inner">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-widest">Ganti Foto Proyek</div>
                                        </>
                                    ) : (
                                        <div className="text-center group-hover:scale-110 transition-transform">
                                            <ImageIcon className="mx-auto text-slate-200 mb-3" size={48}/>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Foto Proyek</p>
                                        </div>
                                    )}
                                </label>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Status Proyek</label>
                                    <select 
                                        value={formData.status} 
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all text-[#003366]"
                                    >
                                        <option value="open">Open (Berlangsung)</option>
                                        <option value="closed">Closed (Full Kuota)</option>
                                        <option value="completed">Completed (Selesai)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nama Proyek</label>
                                    <input type="text" required placeholder="Contoh: Renovasi Ruko BSD" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all" />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Lokasi Aset</label>
                                    <input type="text" required placeholder="Contoh: Tangerang Selatan" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Target Dana</label>
                                        <input 
                                            type="text" required 
                                            value={formData.target_amount ? formData.target_amount.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('target_amount', e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-800 outline-none" 
                                            placeholder="Rp" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Terkumpul</label>
                                        <input 
                                            type="text" required 
                                            value={formData.collected_amount ? formData.collected_amount.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('collected_amount', e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-800 outline-none" 
                                            placeholder="Rp" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">ROI (%)</label>
                                        <input type="number" step="0.1" required value={formData.roi_percent} onChange={(e) => setFormData({...formData, roi_percent: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-800 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tenor (Bln)</label>
                                        <input type="number" required value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-800 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Min. Invest</label>
                                        <input 
                                            type="text" required 
                                            value={formData.min_investment ? formData.min_investment.toLocaleString('id-ID') : ''} 
                                            onChange={(e) => handleNumberChange('min_investment', e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-[10px] text-slate-800 outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Deskripsi & Prospek</label>
                            <textarea 
                                rows={4}
                                value={formData.description || ''}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl font-medium text-sm text-slate-800 outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] transition-all resize-none"
                                placeholder="Jelaskan detail proyek..."
                            />
                        </div>

                        <div className="flex gap-4 pt-8">
                            <button type="submit" disabled={isSaving} className="flex-1 bg-[#003366] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Simpan Proyek</>}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 border border-slate-200 text-slate-400 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};