import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import { ArrowLeft, Calendar, Share2, Megaphone, Clock, FileText } from 'lucide-react';
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

export const KabarDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [kabar, setKabar] = useState<KabarData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKabar = async () => {
            if (!id) return;
            try {
                // Endpoint Laravel: GET /kabar/{id}
                const response = await API.get(`/kabar/${id}`);
                setKabar(response.data);
            } catch (error) {
                toast.error("Kabar tidak ditemukan");
                navigate('/');
            } finally {
                setLoading(false);
            }
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
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#136f42] border-t-transparent"></div>
            </div>
        );
    }

    if (!kabar) return null;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            
            {/* --- HEADER NAVIGATION --- */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-500 hover:text-[#136f42] transition-colors font-bold text-sm group"
                >
                    <div className="text-lg font-bold text-gray-900">
                        <ArrowLeft size={16} />
                    </div>
                    Kembali ke Dashboard
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* --- HERO CARD (HIJAU HUTAN KONSISTEN) --- */}
                <div className="bg-[#136f42] rounded-[2.5rem] shadow-xl overflow-hidden relative min-h-[350px] flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 md:gap-12">
                    
                    {/* Background Accents (Pattern Halus) */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    {/* CONTENT LEFT (TEXT) */}
                    <div className="flex-1 relative z-10 text-white flex flex-col justify-center h-full w-full order-2 md:order-1">
                        
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm",
                                kabar.type === 'INFO' ? 'bg-rose-600' : 
                                kabar.type === 'PROMO' ? 'bg-emerald-500 text-white' : 'bg-[#aeea00] text-[#136f42]'
                            )}>
                                {kabar.type}
                            </span>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-white/90">
                                <Calendar size={12} className="text-[#aeea00]" />
                                {new Date(kabar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* Title - Rapi (Title Case) */}
                        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4 tracking-tight drop-shadow-md">
                            {kabar.title}
                        </h1>

                        {/* Lime Decoration Bar */}
                        <div className="w-16 h-1.5 bg-[#aeea00] rounded-full mb-8"></div>

                        {/* Share Button */}
                        <button 
                            onClick={handleShare}
                            className="w-fit flex items-center gap-2 bg-[#0f5c35] hover:bg-[#1a7a48] border border-white/10 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg"
                        >
                            <Share2 size={16} /> Bagikan Kabar
                        </button>
                    </div>

                    {/* CONTENT RIGHT (IMAGE) */}
                    <div className="w-full md:w-[420px] shrink-0 order-1 md:order-2 relative z-10 flex justify-center md:justify-end">
                        <div className="w-full aspect-video md:aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-2xl p-2 rotate-1 hover:rotate-0 transition-transform duration-500 border border-green-100">
                            <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-50 relative">
                                {kabar.image_url ? (
                                    <img 
                                        src={kabar.image_url} 
                                        alt={kabar.title} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
                                        <Megaphone size={64} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BODY CONTENT --- */}
                <div className="max-w-5xl mx-auto mt-8">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-[#136f42]" />
                                    Isi Kabar Koperasi
                                </h3>
                                <div className="h-1 w-10 bg-[#aeea00] rounded-full mt-2 ml-7"></div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg text-green-700 text-[10px] font-bold uppercase tracking-wider w-fit border border-green-100">
                                <Clock size={14} />
                                Diposting pukul {new Date(kabar.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                        </div>
                        
                        <article className="prose prose-slate max-w-none">
                            <p className="text-slate-600 leading-8 text-[15px] md:text-base font-medium whitespace-pre-line">
                                {kabar.description}
                            </p>
                        </article>
                    </div>
                </div>

            </div>
        </div>
    );
};