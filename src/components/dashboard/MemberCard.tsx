import React from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';

interface MemberCardProps {
    name: string;
    memberId: string;
}

export const MemberCard: React.FC<MemberCardProps> = ({ name, memberId }) => {
    return (
        <div className="w-full px-4 pt-6 pb-12 bg-kkj-blue rounded-b-[2.5rem] relative overflow-hidden shadow-lg">
            {/* Background Pattern Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-kkj-gold opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

            {/* Card Content */}
            <div className="relative z-10 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-sm font-light text-gray-300 mb-1">Selamat Datang,</h1>
                        <h2 className="text-xl font-bold tracking-wide">{name}</h2>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                        {/* Logo Placeholder - Text KKJ */}
                        <span className="font-bold text-kkj-gold text-lg">KKJ</span>
                    </div>
                </div>

                {/* Digital Card Representation */}
                <div className="bg-gradient-to-r from-[#144272] to-[#0A2647] p-5 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group">
                    {/* Holographic effect line */}
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shimmer transition-all duration-1000"></div>

                    <div className="flex justify-between items-center">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Nomor Anggota</p>
                                <p className="font-mono text-lg tracking-widest text-kkj-gold drop-shadow-sm">{memberId}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                                <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full border border-green-500/30">
                                    Anggota Aktif
                                </span>
                            </div>
                        </div>

                        {/* QR Code Area */}
                        <div className="bg-white p-2 rounded-lg">
                            <QrCode className="text-black" size={48} />
                        </div>
                    </div>

                    {/* Action Buttons (Unduh/Bagikan) [cite: 37] */}
                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] transition-colors">
                            <Download size={12} /> Unduh
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] transition-colors">
                            <Share2 size={12} /> Bagikan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};