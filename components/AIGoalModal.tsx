
import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { askClarifyingQuestions, estimateGoalCost } from '../services/geminiService';
import { StarIcon, XIcon, CameraIcon } from '../constants';

const EMOJI_OPTIONS = ['💰', '💲', '💵', '✈️', '🚗', '🏠', '🎓', '📱', '💻', '💍', '🍕', '🐾', '🎁', '🛒', '🚀', '🏖️'];

const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center my-8 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-widest animate-pulse">A IA está processando...</p>
    </div>
);

const AIGoalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addGoal, showNotification } = useFinance();
    const [step, setStep] = useState(1); // 1: initial, 2: clarify, 3: suggestion, 4: finalize
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Step 1 state
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');

    // Step 2 state
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Step 3 & 4 state
    const [aiResponse, setAiResponse] = useState<{ breakdown: string; totalAmount: number; sources: any[] }>({ breakdown: '', totalAmount: 0, sources: [] });
    const [finalName, setFinalName] = useState('');
    const [finalAmount, setFinalAmount] = useState('0');
    const [icon, setIcon] = useState('💰');
    const [customIcon, setCustomIcon] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 4) {
            setFinalName(name);
            setFinalAmount(aiResponse.totalAmount.toFixed(2));
        }
    }, [step, name, aiResponse.totalAmount]);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const clarifyingQuestions = await askClarifyingQuestions(description);
        setQuestions(clarifyingQuestions);
        setStep(2);
        setIsLoading(false);
    };

    const handleClarificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        let fullPrompt = `${description}\n\nInformações adicionais:\n`;
        questions.forEach(q => {
            fullPrompt += `- ${q}: ${answers[q] || 'Não informado'}\n`;
        });
        
        const result = await estimateGoalCost(fullPrompt);
        setAiResponse(result);
        setStep(3);
        setIsLoading(false);
    };

    const handleSaveGoal = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const deadlineDate = new Date(date + 'T12:00:00');
        const parsedAmount = parseFloat(finalAmount);

        if (!finalName || isNaN(parsedAmount) || parsedAmount <= 0) {
            showNotification('Preencha os campos corretamente.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const goalData = {
                name: finalName,
                targetAmount: parsedAmount,
                currentAmount: 0,
                icon,
                customIcon,
                deadline: deadlineDate.toISOString(),
                isAiGenerated: true,
                aiBreakdown: aiResponse.breakdown,
                aiSources: aiResponse.sources,
            };
            await addGoal(goalData);
            onClose();
        } catch (err) {
            console.error("Falha ao salvar meta da IA:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomIcon(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const formatToBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const numericValue = Number(value) / 100;
        setFinalAmount(numericValue.toFixed(2));
    };
    
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="goal-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Nome da meta</label>
                            <input type="text" id="goal-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem para o Japão" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold" required />
                        </div>
                        <div>
                            <label htmlFor="goal-date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Data alvo</label>
                            <input type="date" id="goal-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold" required />
                        </div>
                        <div>
                            <label htmlFor="goal-desc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Descreva sua meta</label>
                            <textarea 
                                id="goal-desc" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows={3} 
                                placeholder="Ex: Quero viajar para o Japão em Dezembro de 2025 e ficar 1 semana a passeio." 
                                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-blue-500 dark:border-blue-500 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-semibold transition-all" 
                                required 
                            />
                            <p className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 font-medium mt-1.5 ml-1 italic">
                                * A IA se baseará nesse campo para auxiliar na criação da meta.
                            </p>
                        </div>
                        <div className="flex justify-end pt-2">
                             <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-purple-600 border border-transparent rounded-xl shadow-md hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95">
                                Próximo passo
                             </button>
                        </div>
                    </form>
                );
            case 2:
                return (
                     <form onSubmit={handleClarificationSubmit} className="space-y-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Para uma estimativa mais precisa, por favor, responda a algumas perguntas:</p>
                        {questions.map((q, index) => (
                            <div key={index}>
                                <label htmlFor={`q-${index}`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{q}</label>
                                <input
                                    type="text"
                                    id={`q-${index}`}
                                    value={answers[q] || ''}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                                />
                            </div>
                        ))}
                         <div className="flex justify-between items-center pt-2">
                             <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-all">Voltar</button>
                             <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-purple-600 border border-transparent rounded-xl shadow-md hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95">
                                Estimar custo
                            </button>
                        </div>
                    </form>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                             <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-4">Sugestão detalhada da IA</h3>
                             <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl text-sm sm:text-base text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-mono max-h-[55vh] md:max-h-[65vh] overflow-y-auto leading-relaxed shadow-inner">
                                {aiResponse.breakdown}
                             </div>
                        </div>
                        
                        {aiResponse.sources.length > 0 && (
                            <div className="pt-2">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fontes da pesquisa em tempo real:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {aiResponse.sources.map((s, i) => s.web && (
                                        <a key={i} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-[10px] font-semibold text-blue-500 hover:border-blue-400 transition-all truncate max-w-[200px]">
                                            {s.web.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                             <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-all">Voltar</button>
                             <button type="button" onClick={() => setStep(4)} className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-purple-600 border border-transparent rounded-xl shadow-lg hover:bg-purple-700 transition-all active:scale-95">
                                Tudo certo, prosseguir
                            </button>
                        </div>
                    </div>
                );
            case 4:
                 return (
                    <form onSubmit={handleSaveGoal} className="space-y-4 md:space-y-5">
                        <div className="md:max-w-md mx-auto">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Nome da meta</label>
                            <input 
                                type="text" 
                                value={finalName} 
                                onChange={e => setFinalName(e.target.value)} 
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent outline-none shadow-inner transition-all"
                                placeholder="Ex: Comprar iPhone"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:max-w-md mx-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Valor alvo</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">R$</span>
                                    <input 
                                        type="tel" 
                                        value={formatToBRL(parseFloat(finalAmount))} 
                                        onChange={handleAmountChange} 
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent outline-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Prazo</label>
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)} 
                                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent outline-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="md:max-w-lg mx-auto">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase tracking-wider">Personalização</label>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/30 transition-all ${customIcon ? 'border-solid border-accent ring-4 ring-accent/10 shadow-lg' : ''}`}>
                                    {customIcon ? (
                                        <img src={customIcon} className="w-8 h-8 object-contain" alt="Custom icon" />
                                    ) : (
                                        <div className="text-xl flex items-center justify-center h-full w-full">{icon}</div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 text-[10px] font-bold text-white bg-accent rounded-lg hover:bg-accent-light transition-all uppercase tracking-wider shadow-md active:scale-95"
                                    >
                                        {customIcon ? 'Trocar imagem' : 'Importar png'}
                                    </button>
                                    {customIcon && (
                                        <button type="button" onClick={() => setCustomIcon(undefined)} className="text-[10px] font-bold text-red-500 uppercase tracking-tighter hover:underline">Usar emojis</button>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png" className="hidden" />
                            </div>

                            {!customIcon && (
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button 
                                            key={emoji} 
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={`text-xl h-10 w-10 md:h-11 md:w-11 rounded-xl transition-all flex items-center justify-center aspect-square ${icon === emoji ? 'bg-accent shadow-lg shadow-accent/30 scale-110 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="md:max-w-md mx-auto pt-2">
                            <button 
                                type="button"
                                onClick={() => setStep(3)}
                                className="w-full flex items-center justify-center gap-2.5 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl transition-all hover:bg-purple-100 dark:hover:bg-purple-900/40 group shadow-sm"
                            >
                                <StarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Revisar sugestão da IA</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 md:max-w-md mx-auto">
                             <button type="submit" disabled={isSaving} className="flex-1 py-3.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Criar meta agora'}
                            </button>
                        </div>
                    </form>
                );
            default:
                return null;
        }
    };
    
    // Define a largura do modal baseada no passo atual
    const modalMaxWidth = step === 3 ? 'md:max-w-4xl' : (step === 4 ? 'md:max-w-2xl' : 'md:max-w-md');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-start pt-12 sm:pt-24 p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className={`bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full ${modalMaxWidth} p-6 sm:p-10 relative animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700 transition-all`}>
                 <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl shadow-sm">
                        <StarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight leading-none">Criar meta com IA</h2>
                    </div>
                </div>
                <div className="max-h-fit overflow-visible">
                   {isLoading ? <LoadingSpinner /> : renderStep()}
                </div>
            </div>
        </div>
    );
};

export default AIGoalModal;
