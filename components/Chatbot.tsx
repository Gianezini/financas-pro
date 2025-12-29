
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Transaction, Goal, Category } from '../types';
import { chatWithBot, transcribeAudio, type ChatbotResponse } from '../services/geminiService';
import type { useFinanceData } from '../hooks/useFinanceData';
import { MicrophoneIcon, TrashIcon, CheckIcon, XIcon } from '../constants';

// Componente Visualizador de Som - Otimizado para Sensibilidade
const AudioVisualizer: React.FC<{ stream: MediaStream | null }> = ({ stream }) => {
    const [volumes, setVolumes] = useState<number[]>(new Array(8).fill(2));
    const animationRef = useRef<number | undefined>(undefined);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!stream) return;

        let audioContext: AudioContext;
        try {
            // Fix: Adicionando sampleRate no construtor do AudioContext para evitar erro de argumentos
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            
            // Aumentando a sensibilidade
            analyser.fftSize = 128;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.8;
            
            source.connect(analyser);
            analyserRef.current = analyser;
            
            const bufferLength = analyser.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            const update = async () => {
                // Garantir que o contexto esteja ativo (importante para navegadores modernos)
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                if (!analyserRef.current || !dataArrayRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                
                // Distribuir as 8 barras pelo espectro de frequências disponível
                const step = Math.floor(dataArrayRef.current.length / 8);
                const newVolumes = [];
                
                for (let i = 0; i < 8; i++) {
                    const value = dataArrayRef.current[i * step];
                    // Normalização para altura visual (min 2px, max 24px)
                    newVolumes.push(Math.max(2, (value / 255) * 24));
                }
                
                setVolumes(newVolumes);
                animationRef.current = requestAnimationFrame(update);
            };

            update();
        } catch (e) {
            console.error("Visualizer error:", e);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContext) audioContext.close();
        };
    }, [stream]);

    return (
        <div className="flex items-center gap-1 h-6">
            {volumes.map((vol, i) => (
                <div 
                    key={i} 
                    className="w-1 bg-red-500 rounded-full transition-all duration-75" 
                    style={{ height: `${vol}px` }}
                />
            ))}
        </div>
    );
};

interface ChatbotProps {
    onClose: () => void;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    financialData: ReturnType<typeof useFinanceData>;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, messages, setMessages, financialData }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const shouldSendRef = useRef<boolean>(true);
    
    const { addTransaction, categories, showNotification } = financialData;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const processMessage = async (text: string) => {
        const sanitizedText = String(text || "").trim();
        if (sanitizedText === '') return;
        
        const userMessage: ChatMessage = { sender: 'user', text: sanitizedText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const botResponse: ChatbotResponse = await chatWithBot(sanitizedText, messages, financialData);

            if (botResponse.functionCall) {
                const { name, args } = botResponse.functionCall;
                if (name === 'createTransaction' && args) {
                    try {
                        const amount = Number(args.amount) || 0;
                        const dateFromAI = String(args.date || new Date().toISOString().split('T')[0]);
                        const localDate = new Date(`${dateFromAI}T12:00:00`);

                        const newTransaction = {
                            type: args.type as any || 'despesa',
                            amount: amount,
                            description: String(args.description || 'Lançamento via IA'),
                            categoryId: String(args.categoryId || 'others'),
                            date: localDate.toISOString(),
                            paymentMethod: String(args.paymentMethod || 'Outro'),
                        };
                        
                        await addTransaction(newTransaction);
                        
                        const categoryName = categories.find(c => c.id === args.categoryId)?.name || 'Geral';
                        const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
                        const confirmationText = `✅ Lançamento realizado!\nTipo: ${args.type.toUpperCase()}\nValor: ${amountFormatted}\nDescrição: ${newTransaction.description}`;
                        
                        setMessages(prev => [...prev, { sender: 'bot', text: confirmationText }]);
                    } catch (err: any) {
                        setMessages(prev => [...prev, { sender: 'bot', text: `Ops, erro ao salvar: ${err.message}` }]);
                    }
                }
            } else if (botResponse.text) {
                setMessages(prev => [...prev, { sender: 'bot', text: String(botResponse.text) }]);
            }
        } catch (error: any) {
            console.error("Error chatting with bot:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: "Erro de conexão com a IA. Tente novamente." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (input.trim() === '' || isLoading) return;
        const textToSend = input;
        setInput('');
        processMessage(textToSend);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setActiveStream(stream);
            
            const supportedTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/aac'
            ];
            const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            shouldSendRef.current = true;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                if (shouldSendRef.current && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                    
                    // Diagnóstico de tamanho
                    const blobSizeKB = (audioBlob.size / 1024).toFixed(1);

                    if (audioBlob.size < 1500) { // Menos de 1.5KB é quase certo que não tem áudio
                        setMessages(prev => [...prev, { sender: 'bot', text: `O áudio capturado foi muito pequeno (${blobSizeKB}KB). Verifique se o microfone não está mudo no sistema.` }]);
                    } else {
                        setIsTranscribing(true);
                        setIsLoading(true);
                        try {
                            const transcription = await transcribeAudio(audioBlob);
                            if (transcription && transcription.trim() !== "") {
                                processMessage(transcription);
                            } else {
                                setMessages(prev => [...prev, { sender: 'bot', text: `Não captei fala no áudio (${blobSizeKB}KB). Tente falar um pouco mais alto.` }]);
                            }
                        } catch (err) {
                            setMessages(prev => [...prev, { sender: 'bot', text: "Erro ao processar áudio na IA. Tente digitar." }]);
                        } finally {
                            setIsTranscribing(false);
                            setIsLoading(false);
                        }
                    }
                }
                stream.getTracks().forEach(track => track.stop());
                setActiveStream(null);
                setIsRecording(false);
            };

            mediaRecorder.start(200); 
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access error:", err);
            setMessages(prev => [...prev, { sender: 'bot', text: "Não consegui acesso ao seu microfone. Verifique as configurações do navegador." }]);
        }
    };

    const stopRecording = (shouldSend: boolean = true) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            shouldSendRef.current = shouldSend;
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="fixed inset-x-2 bottom-[72px] top-2 md:inset-x-auto md:top-auto md:bottom-28 md:right-10 md:w-[400px] md:h-[600px] bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Assistente IA</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <XIcon className="h-6 w-6" />
                </button>
            </header>

            <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] hidden sm:flex">IA</div>
                        )}
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${msg.sender === 'user' ? 'bg-accent text-white rounded-br-none shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600 shadow-sm'}`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(msg.text)}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm hidden sm:flex">IA</div>
                         <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 rounded-bl-none border border-gray-200 dark:border-gray-600 shadow-sm">
                             <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isTranscribing ? 'Analisando voz...' : 'IA Pensando...'}</span>
                                 <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Ouvindo...</span>
                                <AudioVisualizer stream={activeStream} />
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => stopRecording(false)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Cancelar"><TrashIcon className="h-5 w-5" /></button>
                                <button onClick={() => stopRecording(true)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Enviar"><CheckIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            placeholder="Diga: 'Recebi 2000 reais de bônus'"
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    )}
                    
                    {!isRecording && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={startRecording} 
                                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full hover:bg-gray-200 disabled:opacity-50" 
                                disabled={isLoading}
                                title="Falar"
                            >
                                <MicrophoneIcon className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={handleSend} 
                                className="p-3 bg-accent text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 shadow-md" 
                                disabled={isLoading || input.trim() === ''}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}

export default Chatbot;
