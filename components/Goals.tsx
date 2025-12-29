
import React, { useState, useMemo } from 'react';
import type { Goal, GoalTransaction } from '../types';
import Card from './common/Card';
import { useFinance } from '../context/FinanceContext';
import { PlusIcon, CheckIcon, StarIcon } from '../constants';
import AIGoalModal from './AIGoalModal';
import GoalAddValueForm from './GoalAddValueForm';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

const GoalCard: React.FC<{ goal: Goal; onEdit: (goal: Goal) => void; onAddValue: (goal: Goal) => void; }> = ({ goal, onEdit, onAddValue }) => {
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const progress = (goal.targetAmount > 0) ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 100;
    
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDate = new Date(goal.creationDate); startDate.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(goal.deadline); deadlineDate.setHours(0, 0, 0, 0);
    
    const totalTime = deadlineDate.getTime() - startDate.getTime();
    const elapsedTime = today.getTime() - startDate.getTime();
    const timeProgress = totalTime > 0 ? Math.min(100, (elapsedTime / totalTime) * 100) : (today >= deadlineDate ? 100 : 0);
    
    const dayDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
        <Card className={`group relative border-2 transition-all duration-300 h-full flex flex-col shadow-sm overflow-hidden ${
            isCompleted 
                ? 'border-green-500 hover:border-green-600' 
                : (goal.isAiGenerated 
                    ? 'border-purple-200 dark:border-purple-900/30 hover:border-purple-600 dark:hover:border-purple-500 hover:shadow-purple-500/10' 
                    : 'border-transparent hover:border-accent')
        }`}>
            {isCompleted && (
                <div className="absolute -top-[3px] -left-[3px] bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-tl-none rounded-br-2xl shadow-md z-10 flex items-center gap-1.5 animate-in slide-in-from-top-left duration-300">
                    <CheckIcon className="w-3.5 h-3.5 stroke-[3px]" /> Meta concluída!
                </div>
            )}
            
            <div className={`flex items-start justify-between mb-4 transition-all ${isCompleted ? 'mt-6' : ''}`}>
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white leading-tight line-clamp-2 min-h-[2.5rem]">{goal.name}</h3>
                    {goal.isAiGenerated && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <StarIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Sugerido por IA</span>
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    {goal.customIcon ? (
                        <img src={goal.customIcon} className="w-full h-full object-contain" alt={goal.name} />
                    ) : (
                        <span className="text-2xl leading-none">{goal.icon}</span>
                    )}
                </div>
            </div>

            <div className="space-y-5 flex-1">
                <div>
                    <div className="flex justify-between mb-1.5 items-end">
                        <span className="text-xs font-bold text-gray-400 tracking-widest">Progresso</span>
                        <span className={`text-sm font-black transition-colors ${isCompleted ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
                            {progress.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                        <div className={`${isCompleted ? 'bg-green-500' : 'bg-accent'} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs font-bold text-gray-400 mt-2 uppercase tracking-tight">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between mb-1.5 items-end">
                        <span className="text-xs font-bold text-gray-400 tracking-widest">Tempo restante</span>
                        <span className={`text-xs sm:text-sm font-bold ${dayDiff <= 0 ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                            {dayDiff <= 0 ? `Finalizado em ${formatDate(goal.deadline)}` : `Faltam ${dayDiff} dias`}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className={`${dayDiff <= 0 ? 'bg-gray-300 dark:bg-gray-700' : 'bg-slate-400'} h-full rounded-full transition-all duration-700`} style={{ width: `${timeProgress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => onAddValue(goal)} 
                    className={`px-3 py-3.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-accent-light'}`}
                >
                    Aportar
                </button>
                <button onClick={() => onEdit(goal)} className="px-3 py-3.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-all active:scale-95">Editar</button>
            </div>
        </Card>
    );
}

const Goals: React.FC = () => {
    const { goals, openGoalForm, goalTransactions } = useFinance();
    const [view, setView] = useState<'manage' | 'extract'>('manage');
    const [showCompleted, setShowCompleted] = useState(false);
    const [isAIGoalModalOpen, setIsAIGoalModalOpen] = useState(false);
    const [goalToAporte, setGoalToAporte] = useState<Goal | null>(null);

    const filteredGoals = useMemo(() => {
        return goals.filter(g => showCompleted || g.currentAmount < g.targetAmount)
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [goals, showCompleted]);

    const sortedHistory = useMemo(() => {
        return [...goalTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [goalTransactions]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-8">
          <div className="flex justify-between items-center mb-4">
            {/* Título: Poppins semi-bold */}
            <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight">Minhas Metas</h1>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="show-comp" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent" />
                <label htmlFor="show-comp" className="text-xs font-bold text-gray-400 cursor-pointer select-none tracking-tighter">Concluídas</label>
            </div>
          </div>
          
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 w-full overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <button 
                    onClick={() => openGoalForm()} 
                    className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-white bg-blue-600 border border-transparent rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                >
                    <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3px]" /> Novo
                </button>
                <button 
                    onClick={() => setIsAIGoalModalOpen(true)} 
                    className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
                >
                    <StarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Assistente IA
                </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl shadow-inner ml-auto border border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button 
                    onClick={() => setView('manage')} 
                    className={`px-2.5 sm:px-4 py-1.5 text-[9px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        view === 'manage' 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    Metas
                </button>
                <button 
                    onClick={() => setView('extract')} 
                    className={`px-2.5 sm:px-4 py-1.5 text-[9px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        view === 'extract' 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    Extrato
                </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 w-full pb-24">
            {view === 'manage' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredGoals.map(goal => (
                        <GoalCard 
                            key={goal.id} 
                            goal={goal} 
                            onEdit={openGoalForm} 
                            onAddValue={(g) => setGoalToAporte(g)} 
                        />
                    ))}
                    {filteredGoals.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlusIcon className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-bold">Nenhuma meta pendente no momento.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-7xl mx-auto space-y-4">
                    <h2 className="text-xs font-bold text-gray-400 mb-4 px-1 tracking-widest">Histórico de movimentações</h2>
                    {sortedHistory.map(transaction => {
                        const goal = goals.find(g => g.id === transaction.goalId);
                        const isNegative = transaction.amount < 0;
                        const isUpdate = transaction.description.includes('Valor alvo');
                        
                        return (
                            <div key={transaction.id} className="bg-white dark:bg-dark-sidebar p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-accent/30 transition-all w-full">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-sm ${
                                        isUpdate ? 'bg-purple-100 dark:bg-purple-900/30' :
                                        isNegative ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'
                                    }`}>
                                        {goal?.customIcon ? (
                                            <img src={goal.customIcon} className="w-6 h-6 object-contain" alt="" />
                                        ) : (
                                            goal?.icon || '💰'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-gray-800 dark:text-white leading-tight truncate">
                                            {transaction.description}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-tight">
                                            {goal?.name} • {formatDate(transaction.date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className={`text-base font-black ${
                                        isUpdate ? 'text-purple-600' :
                                        isNegative ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                        {isNegative ? '' : '+'}{formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {sortedHistory.length === 0 && (
                        <div className="text-center py-24 bg-white dark:bg-dark-sidebar rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
                            <p className="text-gray-400 font-black text-lg">Nenhum histórico registrado ainda.</p>
                            <p className="text-gray-400 text-xs mt-1 font-medium">Seus aportes e retiradas aparecerão aqui.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      {isAIGoalModalOpen && <AIGoalModal onClose={() => setIsAIGoalModalOpen(false)} />}
      {goalToAporte && <GoalAddValueForm goal={goalToAporte} onClose={() => setGoalToAporte(null)} />}
    </div>
  );
};

export default Goals;
