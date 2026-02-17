import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import { ArrowLeft, Save, X, Layout, Megaphone, Palette, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminKabarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PROMO',
    color: 'blue',
    is_active: true,
    image_url: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map warna untuk Live Preview
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    biru_tua: 'bg-[#003366]',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-600',
    red: 'bg-rose-600',
  };

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        // Endpoint Laravel: GET /admin/kabar/{id}
        const response = await API.get(`/admin/kabar/${id}`);
        if (response.data) {
          setForm(response.data);
          if (response.data.image_url) setImagePreview(response.data.image_url);
        }
      } catch (error) {
        toast.error("Gagal memuat detail kabar");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading(id ? "Memperbarui kabar..." : "Menyimpan kabar baru...");

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('color', form.color);
      formData.append('is_active', form.is_active ? '1' : '0');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (id) {
        // Karena Laravel terkadang bermasalah dengan PUT + FormData (Multipart), 
        // kita gunakan method spoofing _method: PUT
        formData.append('_method', 'PUT');
        await API.post(`/admin/kabar/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await API.post('/admin/kabar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success("Kabar berhasil disimpan!", { id: toastId });
      navigate('/admin/kabar');
    } catch (error: any) {
      const msg = error.response?.data?.message || "Gagal menyimpan";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#003366]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      {/* STICKY HEADER */}
      <div className="bg-white border-b sticky top-0 z-20 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/kabar')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="text-[#003366]" size={20} />
              {id ? 'Edit Kabar' : 'Tambah Kabar Baru'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* KOLOM KIRI: FORM */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center gap-2 text-[#003366] mb-2 font-black text-xs uppercase tracking-[0.2em]">
                <Layout size={14} /> Detail Informasi
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Judul Kabar</label>
                <input
                  type="text"
                  placeholder="Masukkan judul kabar"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#003366] outline-none transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Deskripsi</label>
                <textarea
                  rows={4}
                  placeholder="Tulis deskripsi kabar di sini..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm resize-none focus:ring-4 focus:ring-blue-50 focus:border-[#003366] outline-none transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1 tracking-widest">
                    <ImageIcon size={12} /> Gambar Kabar (Opsional)
                </label>
                
                {!imagePreview ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-[#003366] transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
                            <ImageIcon size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Klik untuk upload gambar</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Format: JPG, PNG (Max 2MB)</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 group shadow-lg">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                            >
                                Ganti
                            </button>
                            <button 
                                type="button" 
                                onClick={handleRemoveImage}
                                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                <Trash2 size={14} /> Hapus
                            </button>
                        </div>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Tipe Kabar</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer font-black text-[#003366] bg-slate-50"
                  >
                    <option value="PROMO">PROMO</option>
                    <option value="INFO">INFO</option>
                    <option value="RAT">RAT</option>
                    <option value="PROGRAM">PROGRAM</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1 tracking-widest">
                    <Palette size={12} /> Warna Header
                  </label>
                  <select
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer font-black text-[#003366] bg-slate-50"
                  >
                    <option value="blue">Biru (Standar)</option>
                    <option value="biru_tua">Biru Tua (Eksklusif)</option>
                    <option value="yellow">Kuning Emas</option>
                    <option value="green">Hijau Syariah</option>
                    <option value="red">Merah Penting</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group transition-colors hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#003366] rounded-lg focus:ring-[#003366] border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-700">Publikasikan Sekarang</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Munculkan di aplikasi anggota</span>
                </div>
              </label>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#003366] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/kabar')}
                  className="px-6 border border-slate-200 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} /> Batal
                </button>
              </div>
            </div>
          </form>

          {/* KOLOM KANAN: LIVE PREVIEW */}
          <div className="lg:sticky lg:top-28 space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] ml-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview (Tampilan Anggota)
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden flex justify-center">
               <div className="w-full max-w-[280px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  
                  {imagePreview ? (
                      <div className="h-32 relative">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Kabar Preview" />
                          <div className={cn(
                            "absolute top-2 right-2 px-2 py-1 rounded text-white text-[8px] font-black tracking-widest uppercase shadow-sm",
                            colorMap[form.color]
                          )}>
                              {form.type}
                          </div>
                      </div>
                  ) : (
                      <div className={cn(
                        "h-32 flex items-center justify-center text-white font-black text-[10px] tracking-[0.3em] uppercase transition-colors duration-500",
                        colorMap[form.color] || 'bg-slate-400'
                      )}>
                        {form.type || 'TIPE'}
                      </div>
                  )}

                  <div className="p-5 space-y-2">
                    <h4 className="font-black text-slate-900 line-clamp-2 min-h-[2.5rem] tracking-tight leading-tight">
                      {form.title || 'Judul Kabar Anda...'}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed font-medium italic">
                      {form.description || 'Deskripsi singkat kabar akan muncul di sini...'}
                    </p>
                  </div>
               </div>
            </div>
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
               Koperasi Karya Kita Jaya Digital System
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}