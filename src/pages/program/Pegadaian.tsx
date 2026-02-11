import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';

export const Pegadaian = () => {
  const navigate = useNavigate();

  // STATE SIMULASI
  const [beratEmas, setBeratEmas] = useState(10); // gram
  const [hargaPerGram, setHargaPerGram] = useState(1_000_000);
  const [persentaseTaksiran, setPersentaseTaksiran] = useState(85); // %
  const [tenor, setTenor] = useState(3); // bulan
  const [ujrahPerBulan, setUjrahPerBulan] = useState(1.2); // %

  // PERHITUNGAN
  const nilaiEmas = beratEmas * hargaPerGram;
  const maksimalPinjaman = (nilaiEmas * persentaseTaksiran) / 100;
  const totalUjrah = (maksimalPinjaman * ujrahPerBulan / 100) * tenor;
  const totalPelunasan = maksimalPinjaman + totalUjrah;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* HEADER (KONSISTEN DENGAN TAMASA & INFLIP) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-kkj-blue" />
        </button>

        <h1 className="text-lg font-bold text-kkj-blue">
          PEGADAIAN - Gadai Emas Syariah
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-10 space-y-10">

        {/* HERO SECTION */}
        <div className="bg-[#0B2B4B] text-white rounded-2xl shadow-xl p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">
                Gadai Emas Syariah
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Program Pegadaian KKJ membantu anggota memperoleh dana cepat
                dengan jaminan emas. Dikelola menggunakan akad syariah
                tanpa riba, hanya dikenakan biaya ujrah (jasa penitipan).
              </p>
            </div>
          </div>
        </div>

        {/* SIMULASI */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="text-kkj-blue" />
            <h2 className="font-bold text-lg">
              Simulasi Gadai Emas
            </h2>
          </div>

          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium">Berat Emas (gram)</label>
              <input
                type="number"
                value={beratEmas}
                onChange={(e) => setBeratEmas(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Harga Emas per Gram</label>
              <input
                type="number"
                value={hargaPerGram}
                onChange={(e) => setHargaPerGram(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Persentase Taksiran (%)</label>
              <input
                type="number"
                value={persentaseTaksiran}
                onChange={(e) => setPersentaseTaksiran(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tenor (bulan)</label>
              <input
                type="number"
                value={tenor}
                onChange={(e) => setTenor(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ujrah per Bulan (%)</label>
              <input
                type="number"
                step="0.1"
                value={ujrahPerBulan}
                onChange={(e) => setUjrahPerBulan(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            {/* HASIL */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p>Nilai Emas: <span className="font-bold">{formatRupiah(nilaiEmas)}</span></p>
              <p>Maksimal Pinjaman: <span className="font-bold text-kkj-blue">{formatRupiah(maksimalPinjaman)}</span></p>
              <p>Total Ujrah: <span className="font-bold">{formatRupiah(totalUjrah)}</span></p>
              <p>Total Pelunasan: <span className="font-bold text-red-600">{formatRupiah(totalPelunasan)}</span></p>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-kkj-blue text-white px-6 py-3 rounded-xl shadow hover:opacity-90 transition">
            Ajukan Gadai Sekarang
          </button>
        </div>

      </div>
    </div>
  );
};
