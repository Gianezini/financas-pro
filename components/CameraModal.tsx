
import React, { useRef, useState, useEffect } from 'react';
import { XIcon } from '../constants';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function startCamera() {
      try {
        const constraints = {
          video: {
            facingMode: 'environment', // Tenta usar a câmera traseira
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
        setIsLoading(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ajusta o canvas para o tamanho real do vídeo capturado
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Botão Fechar */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-[210] p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all"
      >
        <XIcon className="w-6 h-6" />
      </button>

      {/* Viewfinder */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[205]">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-white text-xs font-bold uppercase tracking-widest animate-pulse font-['Montserrat']">Iniciando Lente...</p>
          </div>
        )}
        
        {error ? (
          <div className="p-8 text-center z-[205]">
            <p className="text-red-400 font-bold mb-4 font-['Montserrat']">{error}</p>
            <button onClick={onClose} className="px-6 py-3 bg-white text-black font-bold rounded-xl font-['Montserrat']">Voltar</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Guia de Captura e Instrução */}
        {!isLoading && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 sm:p-12">
             {/* Texto de Instrução acima da área */}
             <div className="mb-6 px-5 py-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                <p className="text-white text-[10px] sm:text-xs font-semibold font-['Montserrat'] uppercase tracking-wider text-center">
                  Enquadre o recibo na área abaixo
                </p>
             </div>

             {/* Área de Captura Aumentada */}
             <div className="w-full max-w-md aspect-[3/4.5] sm:aspect-[3/4] border-2 border-white/40 rounded-[2.5rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
                {/* Cantoneiras de foco */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg"></div>
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg"></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg"></div>
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg"></div>
             </div>
          </div>
        )}
      </div>

      {/* Controles de Captura */}
      {!isLoading && !error && (
        <div className="absolute bottom-8 w-full flex items-center justify-center z-[210]">
          <button 
            onClick={capturePhoto}
            className="group relative w-20 h-20 flex items-center justify-center transition-transform active:scale-90"
          >
            {/* Anel Externo */}
            <div className="absolute inset-0 border-4 border-white rounded-full"></div>
            {/* Anel de Preenchimento */}
            <div className="w-16 h-16 bg-white rounded-full border-4 border-transparent group-hover:bg-gray-100 transition-colors"></div>
          </button>
        </div>
      )}

      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraModal;
