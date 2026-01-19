
import React, { useState, useRef, useEffect } from 'react';
import { Radio, Play, Square, Volume2, VolumeX, ExternalLink, Loader2, Music2 } from 'lucide-react';

export const RadioPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // URL Direta do Stream (Shoutcast/Icecast)
    // Nota: Muitos navegadores bloqueiam streams HTTP em sites HTTPS (Mixed Content).
    // Tentei usar a URL mais direta possível.
    const STREAM_URL = "https://ice.fabricahost.com.br/liberdadefmbelem";
    
    // URL do site fornecido pelo usuário (Fallback)
    const WEB_URL = "https://br.radio.net/s/fm-liberdade-belem";

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5; // Volume inicial 50%
        }
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            // Em streams de rádio, é melhor 'parar' desconectando para não acumular buffer,
            // mas pause() é suficiente para UX simples. Para retomar ao vivo, recarregamos.
            audioRef.current.src = ""; 
            audioRef.current.src = STREAM_URL;
            setIsPlaying(false);
            setIsLoading(false);
        } else {
            setError(false);
            setIsLoading(true);
            audioRef.current.load();
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        console.error("Erro ao tocar rádio:", err);
                        setError(true);
                        setIsLoading(false);
                        setIsPlaying(false);
                    });
            }
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end animate-in slide-in-from-bottom-4 duration-500">
            {/* Elemento de Áudio Invisível */}
            <audio 
                ref={audioRef} 
                src={STREAM_URL} 
                preload="none"
                onError={() => {
                    setError(true);
                    setIsLoading(false);
                    setIsPlaying(false);
                }}
            />

            {/* Container Principal */}
            <div 
                className={`bg-slate-900 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-2xl transition-all duration-300 overflow-hidden flex items-center ${expanded ? 'p-2 pr-4 gap-3 w-auto' : 'p-3 w-14 h-14 justify-center hover:scale-110 cursor-pointer'}`}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                onClick={() => !expanded && setExpanded(true)}
            >
                {/* Botão Play/Pause Principal */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                    }}
                    className={`relative flex items-center justify-center shrink-0 rounded-full transition-colors ${expanded ? 'w-10 h-10 bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'w-full h-full text-yellow-500'}`}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={expanded ? 20 : 24} />
                    ) : isPlaying ? (
                        <>
                            <Square size={expanded ? 18 : 20} fill="currentColor" />
                            {/* Equalizer Animation (apenas visual) */}
                            {!expanded && (
                                <span className="absolute -top-1 -right-1 flex gap-0.5 h-3 items-end">
                                    <span className="w-0.5 bg-green-500 h-2 animate-bounce"></span>
                                    <span className="w-0.5 bg-green-500 h-3 animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-0.5 bg-green-500 h-1 animate-bounce [animation-delay:0.2s]"></span>
                                </span>
                            )}
                        </>
                    ) : (
                        <Play size={expanded ? 20 : 24} fill="currentColor" className="ml-0.5" />
                    )}
                </button>

                {/* Controles Expandidos */}
                {expanded && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="flex flex-col">
                            <span className="text-yellow-500 font-bold text-xs whitespace-nowrap flex items-center gap-1">
                                <Radio size={12} /> Rádio Liberdade
                            </span>
                            <span className="text-[10px] text-slate-400">95.9 FM - Belém</span>
                            
                            {/* Mensagem de Erro (se stream falhar) */}
                            {error && (
                                <span className="text-[9px] text-red-400 leading-tight">
                                    Erro no stream. 
                                    <a href={WEB_URL} target="_blank" rel="noreferrer" className="underline ml-1">
                                        Ouvir no site
                                    </a>
                                </span>
                            )}
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                            <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                defaultValue="0.5"
                                onChange={handleVolumeChange}
                                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>

                        {/* External Link */}
                        <a 
                            href={WEB_URL} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-500 hover:text-yellow-500 transition-colors ml-1"
                            title="Abrir no site oficial"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={16} />
                        </a>
                    </div>
                )}
            </div>
            
            {/* Indicador "No Ar" (Floating Label quando tocando e minimizado) */}
            {isPlaying && !expanded && (
                <div className="absolute bottom-16 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur whitespace-nowrap border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></span>
                    No Ar
                </div>
            )}
        </div>
    );
};
