import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react';


export default function AdminKabarForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PROMO',
    color: 'blue',
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const { data } = await supabase
        .from('kabar_kkj')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setForm(data);
    };

    fetchDetail();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (id) {
      await supabase.from('kabar_kkj').update(form).eq('id', id);
    } else {
      await supabase.from('kabar_kkj').insert(form);
    }

    navigate('/admin/kabar');
  };

  return (
  <div className="min-h-screen bg-gray-50 py-10 px-4">
    <div className="max-w-lg mx-auto space-y-6">

      {/* HEADER */}
      {/* HEADER */}
<div>
  {/* TOMBOL KEMBALI (TAMBAHAN, TIDAK MENGHAPUS APA PUN) */}
  <button
    type="button"
    onClick={() => navigate('/admin/kabar')}
    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
  >
    <ArrowLeft size={18} />
    Kembali
  </button>
</div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Edit Kabar' : 'Tambah Kabar'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi informasi kabar yang akan ditampilkan ke anggota.
        </p>
      </div>

      {/* CARD FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border shadow-sm p-6 space-y-5"
      >

        {/* JUDUL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Judul Kabar
          </label>
          <input
            type="text"
            placeholder="Masukkan judul kabar"
            value={form.title}
            onChange={e =>
              setForm({ ...form, title: e.target.value })
            }
            className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* DESKRIPSI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            rows={4}
            placeholder="Tulis deskripsi singkat kabar"
            value={form.description}
            onChange={e =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* TIPE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Kabar
          </label>
          <select
            value={form.type}
            onChange={e =>
              setForm({ ...form, type: e.target.value })
            }
            className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="PROMO">PROMO</option>
            <option value="INFO">INFO</option>
            <option value="RAT">RAT</option>
            <option value="PROGRAM">PROGRAM</option>
          </select>
        </div>

        {/* WARNA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warna Header
          </label>
          <select
            value={form.color}
            onChange={e =>
              setForm({ ...form, color: e.target.value })
            }
            className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="blue">Biru</option>
            <option value="yellow">Kuning</option>
            <option value="green">Hijau</option>
          </select>
        </div>

        {/* AKTIF */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e =>
              setForm({
                ...form,
                is_active: e.target.checked,
              })
            }
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            Aktifkan kabar
          </span>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/kabar')}
            className="flex-1 border py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Batal
          </button>
        </div>

      </form>
    </div>
  </div>
);
}