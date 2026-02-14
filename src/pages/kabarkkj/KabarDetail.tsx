import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, Share2, Megaphone, Clock, Tag } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface KabarData {
    id: string;
    title: string;
    description: string;
    type: string;
    color: string;
    image_url?: string | null;
    created_at: string;
}

const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    biru_tua: 'bg-[#003366]',
    yellow: 'bg-amber-500',
    green: 'bg-emerald-600',
    red: 'bg-rose-600',
};

export const KabarDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [kabar, setKabar] = useState<KabarData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKabar = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('kabar_kkj')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                toast.error("Kabar tidak ditemukan");
                navigate('/');
            } else {
                setKabar(data);
            }
            setLoading(false);
        };

        fetchKabar();
    }, [id, navigate]);

    const handleShare = async () => {
        if (navigator.share && kabar) {
            try {
                await navigator.share({
                    title: kabar.title,
                    text: kabar.description,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Share canceled');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link disalin ke clipboard!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#003366] border-t-transparent"></div>
            </div>
        );
    }

    if (!kabar) return null;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            
            {/* --- HEADER NAVIGATION --- */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors font-bold text-sm"
                >
                    <ArrowLeft size={20} /> Kembali
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* --- HERO CARD (INFLIP STYLE) --- */}
                <div className="bg-[#003366] rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[400px] flex flex-col md:flex-row items-center border border-yellow-500/20">
                    
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                    {/* CONTENT LEFT (TEXT) */}
                    <div className="flex-1 p-8 md:p-12 relative z-10 text-white flex flex-col justify-center h-full order-2 md:order-1">
                        
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm",
                                colorMap[kabar.color] || 'bg-blue-500'
                            )}>
                                {kabar.type}
                            </span>
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold tracking-wide">
                                <Calendar size={12} className="text-yellow-400" />
                                {new Date(kabar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-4xl font-[1000] leading-tight mb-4 tracking-tight">
                            {kabar.title}
                        </h1>

                        {/* Excerpt (Optional short desc if needed, or keeping it clean) */}
                        <div className="w-20 h-1 bg-yellow-400 rounded-full mb-6"></div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-auto">
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                                <Share2 size={16} /> Bagikan Kabar
                            </button>
                        </div>
                    </div>

                    {/* CONTENT RIGHT (IMAGE) */}
                    <div className="w-full md:w-[45%] h-64 md:h-[400px] p-4 md:p-6 order-1 md:order-2 relative z-10">
                        <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-lg border border-white/10 bg-black/20">
                            {kabar.image_url ? (
                                <img 
                                    src={kabar.image_url} 
                                    alt={kabar.title} 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                                    <Megaphone size={80} className="text-white/20 rotate-12" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- BODY CONTENT --- */}
                <div className="max-w-4xl mx-auto mt-10 px-2">
                    <div className="prose prose-lg prose-slate max-w-none">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Clock size={16} />
                            Diposting pukul {new Date(kabar.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                        
                        <div className="whitespace-pre-line text-slate-700 leading-relaxed font-medium text-base md:text-lg">
                            {kabar.description}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};