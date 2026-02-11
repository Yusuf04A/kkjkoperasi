import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* =======================
    TYPE
======================= */
interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: string;
  color: 'blue' | 'yellow' | 'green' | 'biru_tua' | 'red';
}

/* =======================
    COLOR MAP
    Daftar warna yang didukung oleh UI
======================= */
const colorMap: Record<string, string> = {
  blue: 'bg-blue-600',
  yellow: 'bg-yellow-400',
  green: 'bg-green-600',
  biru_tua: 'bg-[#003366]', // Warna Biru Tua KKJ
  red: 'bg-red-600',       // Mendukung pilihan warna Merah
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

  // Duplikat data untuk looping infinite
  const newsLoop = [...news, ...news];

  /* =======================
      FETCH DARI SUPABASE
  ======================= */
  useEffect(() => {
    const fetchKabar = async () => {
      const { data, error } = await supabase
        .from('kabar_kkj')
        .select('id, title, description, type, color')
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
    if (!container || news.length === 0) return;

    const scrollSpeed = 0.5;
    let animationFrame: number;

    const scroll = () => {
      if (!isInteracting.current) {
        container.scrollLeft += scrollSpeed;

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
              className="min-w-[280px] snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              {/* Header Warna menggunakan Color Map yang sudah diperbarui */}
              <div
                className={`h-32 w-full ${colorMap[item.color] || 'bg-gray-500'} flex items-center justify-center text-white font-bold text-xs tracking-widest uppercase`}
              >
                {item.type}
              </div>

              <div className="p-4">
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          ))}

        {/* EMPTY STATE */}
        {!loading && news.length === 0 && (
          <div className="text-sm text-gray-400 py-10">
            Belum ada kabar terbaru
          </div>
        )}
      </div>
    </div>
  );
};