
import React, { useState, useRef } from 'react';
import type { Goal } from '../types';
import { useFinance } from '../context/FinanceContext';
import { TrashIcon, XIcon, CameraIcon, StarIcon } from '../constants';

const EMOJI_OPTIONS = ['💰', '💲', '💵', '✈️', '🚗', '🏠', '🎓', '📱', '💻', '💍', '🍕', '🐾', '🎁', '🛒', '🚀', '🏖️'];

interface GoalFormProps {
    onSubmit: (goal: any) => void;
    onClose: () => void;
    initialData?: Goal | null;
}

const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const ReviewModal = ({ breakdown, sources, onClose }: { breakdown: string, sources?: any[], onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex justify-center items-center p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col p-8 relative animate-in zoom-in-95 duration-300 border border-purple-500/30">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <XIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <StarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sugestão completa da IA</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm sm:text-base text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                    {breakdown}
                </div>
                
                {sources && sources.length > 0 && (
                    <div className="pt-4">
                        <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-3 px-1">Fontes pesquisadas em tempo real</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sources.map((s: any, idx: number) => (
                                s.web ? (
                                    <a key={idx} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-500 transition-all group">
                                        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">{idx + 1}</div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate flex-1 group-hover:text-purple-500">{s.web.title}</span>
                                    </a>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button onClick={onClose} className="px-8 py-3.5 bg-purple-600 text-white font-bold rounded-2xl shadow-lg hover:bg-purple-700 transition-all active:scale-95">Fechar revisão</button>
            </div>
        </div>
    </div>
);

const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onClose, initialData }) => {
    const { deleteGoal, showNotification, requestConfirmation } = useFinance();
    const [name, setName] = useState(initialData?.name || '');
    const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount?.toFixed(2) || '0.00');
    const [deadline, setDeadline] = useState(initialData?.deadline ? initialData.deadline.split('T')[0] : '');
    const [icon, setIcon] = useState(initialData?.icon || '💰');
    const [customIcon, setCustomIcon] = useState<string | undefined>(initialData?.customIcon);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const numericValue = Number(value) / 100;
        setTargetAmount(numericValue.toFixed(2));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(targetAmount);
        if (!name || isNaN(parsedAmount) || parsedAmount <= 0 || !deadline) {
            showNotification('Preencha todos os campos corretamente.', 'error');
            return;
        }

        const goalData = {
            ...initialData,
            name,
            targetAmount: parsedAmount,
            deadline: new Date(deadline + 'T12:00:00').toISOString(),
            icon,
            customIcon,
        };

        onSubmit(goalData);
    };

    const handleDelete = () => {
        if (!initialData) return;
        requestConfirmation(
            'Excluir meta',
            'Tem certeza que deseja excluir esta meta? O progresso será perdido.',
            () => {
                deleteGoal(initialData.id);
                onClose();
                showNotification('Meta excluída');
            },
            true
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex justify-center items-start pt-6 sm:pt-24 p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md p-5 sm:p-8 relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                
                <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8 text-gray-800 dark:text-white tracking-tight">
                    {initialData ? 'Editar meta' : 'Nova meta'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Nome da meta</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-4 py-2.5 sm:py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold focus:ring-2 focus:ring-accent outline-none shadow-inner"
                            placeholder="Ex: Reserva de emergência"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Valor alvo</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-gray-400">R$</span>
                                <input 
                                    type="tel" 
                                    value={formatToBRL(parseFloat(targetAmount))} 
                                    onChange={handleAmountChange} 
                                    className="w-full pl-9 pr-3 py-2.5 sm:py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-accent outline-none shadow-inner"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Prazo</label>
                            <input 
                                type="date" 
                                value={deadline} 
                                onChange={e => setDeadline(e.target.value)} 
                                className="w-full px-3 py-2.5 sm:py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold focus:ring-2 focus:ring-accent outline-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 ml-1">Personalização</label>
                        
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/30 transition-all ${customIcon ? 'border-solid border-accent ring-4 ring-accent/10 shadow-lg' : ''}`}>
                                {customIcon ? (
                                    <img src={customIcon} className="w-8 h-8 sm:w-9 sm:h-9 object-contain" alt="Custom icon" />
                                ) : (
                                    <div className="text-xl sm:text-2xl flex items-center justify-center h-full w-full">{icon}</div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] font-medium text-white bg-accent rounded-lg sm:rounded-xl hover:bg-accent-light transition-all uppercase tracking-wider shadow-md active:scale-95"
                                >
                                    {customIcon ? 'Trocar imagem' : 'Importar png'}
                                </button>
                                {customIcon && (
                                    <button type="button" onClick={() => setCustomIcon(undefined)} className="text-[10px] font-semibold text-red-500 uppercase tracking-tighter hover:underline">Usar emojis</button>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png" className="hidden" />
                        </div>

                        {!customIcon && (
                            <div className="grid grid-cols-8 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700">
                                {EMOJI_OPTIONS.map(emoji => (
                                    <button 
                                        key={emoji} 
                                        type="button"
                                        onClick={() => setIcon(emoji)}
                                        className={`text-lg sm:text-xl h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl transition-all flex items-center justify-center aspect-square ${icon === emoji ? 'bg-accent shadow-lg shadow-accent/30 scale-110 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {initialData?.isAiGenerated && (
                        <button 
                            type="button"
                            onClick={() => setIsReviewOpen(true)}
                            className="w-full flex items-center justify-center gap-2.5 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl sm:rounded-2xl transition-all hover:bg-purple-100 dark:hover:bg-purple-900/40 group shadow-sm"
                        >
                            <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">Revisar sugestão da IA</span>
                        </button>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
                        {initialData && (
                            <button 
                                type="button" 
                                onClick={handleDelete}
                                className="p-3.5 sm:p-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl sm:rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm active:scale-95 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center flex-shrink-0"
                                title="Excluir meta"
                            >
                                <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        )}
                        <button 
                            type="submit"
                            className="flex-1 h-12 sm:h-14 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-xl sm:rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center px-6"
                        >
                            {initialData ? 'Atualizar meta' : 'Criar meta'}
                        </button>
                    </div>
                </form>
            </div>
            
            {isReviewOpen && (
                <ReviewModal 
                    breakdown={initialData?.aiBreakdown || ''} 
                    sources={initialData?.aiSources} 
                    onClose={() => setIsReviewOpen(false)} 
                />
            )}
        </div>
    );
};

export default GoalForm;
