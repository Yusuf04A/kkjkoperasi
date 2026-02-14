import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, EyeOff, Trash2, ArrowLeft, Megaphone, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: 'PROMO' | 'INFO' | 'RAT' | 'PROGRAM';
  color: 'blue' | 'yellow' | 'green' | 'biru_tua' | 'red';
  is_active: boolean;
  created_at: string;
  image_url?: string | null; // 1. Tambahkan properti ini
}

export default function AdminKabar() {
  const [list, setList] = useState<KabarKKJ[]>([]);
  const [loading, setLoading] = useState(true);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    biru_tua: 'bg-[#003366]',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-600',
    red: 'bg-rose-600',
  };

  const fetchData = async () => {
    const { data } = await supabase
      .from('kabar_kkj')
      .select('*')
      .order('created_at', { ascending: false });

    setList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('kabar_kkj').update({ is_active: !active }).eq('id', id);
    fetchData();
  };

  const deleteKabar = async (id: string) => {
    if (!confirm('Yakin hapus kabar ini?')) return;
    await supabase.from('kabar_kkj').delete().eq('id', id);
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* STICKY TOP BAR */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manajemen Kabar</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Kelola pengumuman dan berita anggota</p>
            </div>
          </div>
          <Link
            to="/admin/kabar/tambah"
            className="bg-[#003366] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Kabar
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-4">
        {list.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
            <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Belum ada kabar</h3>
            <p className="text-gray-500 text-sm">Mulai buat pengumuman pertama Anda untuk anggota koperasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                
                {/* 2. LOGIKA TAMPILAN HEADER (GAMBAR ATAU WARNA) */}
                <div className={cn("h-40 relative overflow-hidden", !item.image_url && (colorMap[item.color] || 'bg-gray-600'))}>
                  
                  {item.image_url ? (
                    // JIKA ADA GAMBAR
                    <>
                        <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    </>
                  ) : (
                    // JIKA TIDAK ADA GAMBAR (Fallback Warna)
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Megaphone size={100} />
                    </div>
                  )}

                  {/* Badge & Tanggal */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 tracking-widest uppercase shadow-sm">
                        {item.type}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 text-white/90 text-[10px] font-medium tracking-wide">
                    <Clock size={12} />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                      {item.title}
                    </h3>
                    {item.is_active ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-gray-300 shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                    {item.description}
                  </p>

                  <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        item.is_active ? "bg-emerald-500" : "bg-gray-300"
                      )} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className="p-2 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors"
                        title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <Link
                        to={`/admin/kabar/edit/${item.id}`}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => deleteKabar(item.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}