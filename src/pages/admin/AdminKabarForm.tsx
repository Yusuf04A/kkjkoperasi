import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, X, Layout, Megaphone, Palette, Image as ImageIcon, Trash2 } from 'lucide-react';
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
    image_url: '', // Tambahkan field image_url
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      const { data } = await supabase
        .from('kabar_kkj')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setForm(data);
        if (data.image_url) setImagePreview(data.image_url);
      }
    };
    fetchDetail();
  }, [id]);

  // Handler saat gambar dipilih
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validasi ukuran (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 2MB");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handler Hapus Gambar
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image_url: '' }); // Kosongkan URL di form
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading(id ? "Memperbarui kabar..." : "Menyimpan kabar baru...");

    try {
      let publicUrl = form.image_url;

      // 1. Upload Gambar jika ada file baru
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `kabar/${fileName}`; // Folder 'kabar' di bucket 'public' (sesuaikan bucket Anda)

        const { error: uploadError } = await supabase.storage
          .from('avatars') // GANTI DENGAN NAMA BUCKET ANDA (misal: 'public', 'images', dll)
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Dapatkan Public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        publicUrl = urlData.publicUrl;
      }

      // 2. Simpan Data ke Database
      const payload = { ...form, image_url: publicUrl };

      if (id) {
        await supabase.from('kabar_kkj').update(payload).eq('id', id);
      } else {
        await supabase.from('kabar_kkj').insert(payload);
      }

      toast.success("Kabar berhasil disimpan!", { id: toastId });
      navigate('/admin/kabar');
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal menyimpan: " + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
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
              
              <div className="flex items-center gap-2 text-[#003366] mb-2 font-bold text-sm uppercase tracking-wider">
                <Layout size={16} /> Detail Informasi
              </div>

              {/* JUDUL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Judul Kabar</label>
                <input
                  type="text"
                  placeholder="Masukkan judul kabar"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-[#003366] outline-none transition-all font-medium"
                  required
                />
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Deskripsi</label>
                <textarea
                  rows={4}
                  placeholder="Tulis deskripsi kabar di sini..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm resize-none focus:ring-4 focus:ring-blue-100 focus:border-[#003366] outline-none transition-all"
                  required
                />
              </div>

              {/* UPLOAD GAMBAR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                    <ImageIcon size={14} /> Gambar Kabar (Opsional)
                </label>
                
                {!imagePreview ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Klik untuk upload gambar</p>
                        <p className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG (Max 2MB)</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg"
                            >
                                Ganti
                            </button>
                            <button 
                                type="button" 
                                onClick={handleRemoveImage}
                                className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Hapus
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

              {/* GRID TIPE & WARNA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipe Kabar</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer font-bold"
                  >
                    <option value="PROMO">PROMO</option>
                    <option value="INFO">INFO</option>
                    <option value="RAT">RAT</option>
                    <option value="PROGRAM">PROGRAM</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                    <Palette size={14} /> Warna Header
                  </label>
                  <select
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer font-bold"
                  >
                    <option value="blue">Biru (Standar)</option>
                    <option value="biru_tua">Biru Tua (Eksklusif)</option>
                    <option value="yellow">Kuning Emas</option>
                    <option value="green">Hijau Syariah</option>
                    <option value="red">Merah Penting</option>
                  </select>
                </div>
              </div>

              {/* STATUS AKTIF */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group transition-colors hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#003366] rounded-lg focus:ring-[#003366] border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Publikasikan Sekarang</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Munculkan di aplikasi anggota</span>
                </div>
              </label>

              {/* BUTTONS */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#003366] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/kabar')}
                  className="px-6 border border-slate-200 text-slate-500 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} /> Batal
                </button>
              </div>
            </div>
          </form>

          {/* KOLOM KANAN: LIVE PREVIEW */}
          <div className="lg:sticky lg:top-28 space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] ml-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview (Tampilan Anggota)
            </div>
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden">
               {/* NEWS CARD REPLICA */}
               <div className="w-full max-w-[280px] mx-auto bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                  
                  {/* PREVIEW GAMBAR ATAU WARNA HEADER */}
                  {imagePreview ? (
                      <div className="h-32 relative">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Kabar Preview" />
                          <div className={cn(
                            "absolute top-2 right-2 px-2 py-1 rounded text-white text-[8px] font-bold tracking-widest uppercase",
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
                    <h4 className="font-bold text-slate-900 line-clamp-2 min-h-[2.5rem]">
                      {form.title || 'Judul Kabar Anda...'}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {form.description || 'Deskripsi singkat kabar akan muncul di sini...'}
                    </p>
                  </div>
               </div>
               
               <p className="text-center text-[10px] text-slate-400 mt-6 italic">
                 *Kartu ini adalah simulasi tampilan di Dashboard Anggota
               </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}