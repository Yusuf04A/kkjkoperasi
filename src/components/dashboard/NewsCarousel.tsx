import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom'; // Pastikan import Link

/* =======================
    TYPE
======================= */
interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: string;
  color: 'blue' | 'yellow' | 'green' | 'biru_tua' | 'red';
  image_url?: string | null; // Tambahkan properti ini
}

/* =======================
    COLOR MAP
======================= */
const colorMap: Record<string, string> = {
  blue: 'bg-blue-600',
  yellow: 'bg-yellow-400',
  green: 'bg-green-600',
  biru_tua: 'bg-[#003366]',
  red: 'bg-red-600',
};

/* =======================
    SKELETON CARD
======================= */
const SkeletonCard = () => (
  <div className="min-w-[280px] snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-32 bg-gray-200"></div>
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const NewsCarousel = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<KabarKKJ[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);

  // Duplikat data untuk looping infinite (hanya jika data > 1)
  const newsLoop = news.length > 1 ? [...news, ...news] : news;

  /* =======================
      FETCH DARI SUPABASE
  ======================= */
  useEffect(() => {
    const fetchKabar = async () => {
      // Tambahkan 'image_url' di select
      const { data, error } = await supabase
        .from('kabar_kkj')
        .select('id, title, description, type, color, image_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error) {
        setNews(data as KabarKKJ[] || []);
      }

      setLoading(false);
    };

    fetchKabar();
  }, []);

  /* =======================
      AUTO SCROLL LOGIC
  ======================= */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || news.length <= 1) return; // Jangan scroll jika item cuma 1 atau 0

    const scrollSpeed = 0.5;
    let animationFrame: number;

    const scroll = () => {
      if (!isInteracting.current) {
        container.scrollLeft += scrollSpeed;

        // Reset scroll jika sudah mencapai setengah (karena duplikasi data)
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [news]);

  return (
    <div className="py-6 px-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">
          Kabar KKJ Hari Ini
        </h3>
      </div>

      {/* HORIZONTAL SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        onMouseEnter={() => (isInteracting.current = true)}
        onMouseLeave={() => (isInteracting.current = false)}
        onTouchStart={() => (isInteracting.current = true)}
        onTouchEnd={() => (isInteracting.current = false)}
        className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide scroll-smooth"
      >
        {/* LOADING STATE */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}

        {/* DATA NEWS */}
        {!loading &&
          newsLoop.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="min-w-[280px] w-[280px] snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              {/* HEADER: GAMBAR ATAU WARNA */}
              <div className="h-32 w-full relative overflow-hidden">
                {item.image_url ? (
                  // Jika ada gambar
                  <>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient Overlay tipis agar badge terlihat */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </>
                ) : (
                  // Jika tidak ada gambar (Fallback Warna)
                  <div className={`w-full h-full flex items-center justify-center ${colorMap[item.color] || 'bg-gray-500'}`}>
                    {/* Hiasan ikon background */}
                    <ImageIcon className="text-white/20 w-16 h-16 absolute -bottom-4 -right-4 rotate-12" />
                  </div>
                )}

                {/* BADGE TIPE (Pojok Kanan Atas) */}
                <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg tracking-widest uppercase shadow-sm">
                  {item.type}
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-4 flex flex-col h-[110px]">
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                  {item.description}
                </p>

                {/* Tombol Baca Selengkapnya (Opsional) */}
                <Link to={`/kabar/${item.id}`} className="mt-auto pt-2 flex items-center gap-1 text-[10px] font-bold text-[#003366] hover:underline cursor-pointer w-fit">
                  Baca Selengkapnya <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}

        {/* EMPTY STATE */}
        {!loading && news.length === 0 && (
          <div className="w-full text-center text-sm text-gray-400 py-10 border-2 border-dashed border-gray-100 rounded-xl">
            Belum ada kabar terbaru
          </div>
        )}
      </div>
    </div>
  );
};