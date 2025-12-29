
import React, { useState } from 'react';
import type { Goal } from '../types';
import { useFinance } from '../context/FinanceContext';
import { XIcon } from '../constants';

interface GoalAddValueFormProps {
    goal: Goal;
    onClose: () => void;
}

const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(value));
};

const GoalAddValueForm: React.FC<GoalAddValueFormProps> = ({ goal, onClose }) => {
    const { addValueToGoal, showNotification } = useFinance();
    const [amount, setAmount] = useState('0.00');
    const [isNegative, setIsNegative] = useState(false);
    const [description, setDescription] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const digitsOnly = val.replace(/\D/g, '');
        const numericValue = Number(digitsOnly) / 100;
        setAmount(numericValue.toFixed(2));
    };

    const toggleSign = () => {
        setIsNegative(!isNegative);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericVal = parseFloat(amount);
        const finalVal = isNegative ? -numericVal : numericVal;

        if (numericVal === 0) {
            showNotification('Informe um valor válido.', 'error');
            return;
        }

        if (isNegative && numericVal > goal.currentAmount) {
            showNotification(`Saldo insuficiente na meta. Você possui ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}`, 'error');
            return;
        }

        const finalDesc = description.trim() || (isNegative ? 'Retirada da meta' : 'Aporte na meta');

        addValueToGoal(goal.id, finalVal, finalDesc);
        showNotification(
            isNegative 
                ? `R$ ${numericVal.toFixed(2)} retirados de ${goal.name}.` 
                : `R$ ${numericVal.toFixed(2)} adicionados a ${goal.name}!`, 
            'success'
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex justify-center items-start pt-12 sm:pt-24 p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="text-center mb-6">
                    <span className="text-4xl block mb-2">{goal.icon}</span>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Movimentar {goal.name}</h2>
                    <div className="mt-2">
                        <span className="text-xs opacity-70 text-gray-500 dark:text-gray-400">Saldo atual: </span>
                        <span className="text-base font-bold ml-1 text-gray-700 dark:text-gray-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <button 
                                type="button"
                                onClick={() => setIsNegative(false)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl border-2 transition-all ${!isNegative ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                            >
                                Aporte (+)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsNegative(true)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl border-2 transition-all ${isNegative ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                            >
                                Retirada (-)
                            </button>
                        </div>

                        <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                                {isNegative ? '- R$' : 'R$'}
                            </span>
                            <input 
                                type="tel" 
                                value={formatToBRL(parseFloat(amount))} 
                                autoFocus
                                onChange={handleAmountChange} 
                                className={`w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-2xl font-bold focus:ring-2 focus:ring-accent outline-none text-gray-800 dark:text-white ${isNegative ? 'text-red-600 dark:text-red-400' : ''}`}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Descrição opcional</label>
                        <input 
                            type="text" 
                            value={description} 
                            placeholder={isNegative ? "Ex: Saque para emergência" : "Ex: Aporte mensal"}
                            onChange={e => setDescription(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="submit"
                            className={`w-full py-4 text-sm font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 ${isNegative ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}
                        >
                            {isNegative ? 'Confirmar retirada' : 'Confirmar aporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalAddValueForm;
