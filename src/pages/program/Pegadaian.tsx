import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';

export const Pegadaian = () => {
  const navigate = useNavigate();

  // STATE SIMULASI
  const [beratEmas, setBeratEmas] = useState(10);
  const [hargaPerGram, setHargaPerGram] = useState(1_000_000);
  const [persentaseTaksiran, setPersentaseTaksiran] = useState(85);
  const [tenor, setTenor] = useState(3);
  const [ujrahPerBulan, setUjrahPerBulan] = useState(1.2);

  // VALIDASI AMAN
  const safeBerat = Math.max(beratEmas, 0);
  const safeHarga = Math.max(hargaPerGram, 0);
  const safeTaksiran = Math.max(persentaseTaksiran, 0);
  const safeTenor = Math.max(tenor, 0);
  const safeUjrah = Math.max(ujrahPerBulan, 0);

  // PERHITUNGAN
  const nilaiEmas = safeBerat * safeHarga;
  const maksimalPinjaman = (nilaiEmas * safeTaksiran) / 100;
  const totalUjrah = (maksimalPinjaman * safeUjrah / 100) * safeTenor;
  const totalPelunasan = maksimalPinjaman + totalUjrah;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* HEADER */}
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
                dengan jaminan emas. Menggunakan akad syariah tanpa riba,
                hanya dikenakan biaya ujrah (jasa penitipan).
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
              <p>
                Nilai Emas:
                <span className="font-bold ml-2">
                  {formatRupiah(nilaiEmas)}
                </span>
              </p>

              <p>
                Maksimal Pinjaman:
                <span className="font-bold text-kkj-blue ml-2">
                  {formatRupiah(maksimalPinjaman)}
                </span>
              </p>

              <p>
                Total Ujrah:
                <span className="font-bold ml-2">
                  {formatRupiah(totalUjrah)}
                </span>
              </p>

              <p>
                Total Pelunasan:
                <span className="font-bold text-red-600 ml-2">
                  {formatRupiah(totalPelunasan)}
                </span>
              </p>
            </div>

            {/* BUTTON DI DALAM BORDER */}
            <button className="w-full mt-6 bg-kkj-blue text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
              Ajukan Gadai Sekarang
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
