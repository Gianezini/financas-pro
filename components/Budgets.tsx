
import React from 'react';
import type { Budget, Transaction } from '../types';
import { TransactionType } from '../types';
import { iconComponents } from '../constants';
import Card from './common/Card';
import { useFinance } from '../context/FinanceContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const BudgetCard: React.FC<{ budget: Budget; spent: number }> = ({ budget, spent }) => {
    const { categories } = useFinance();
    const category = categories.find(c => c.id === budget.categoryId);
    if (!category) return null;

    const progress = (spent / budget.limit) * 100;
    const progressBarColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500';
    const Icon = iconComponents[category.icon];

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 mr-3 flex items-center justify-center">
                        {category.customIcon ? (
                            <img src={category.customIcon} className="w-8 h-8 object-contain" alt={category.name} />
                        ) : (
                            <Icon className={`w-8 h-8 ${category.color}`} />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{category.name}</h3>
                </div>
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${progressBarColor.replace('bg-','bg-opacity-20 ')} ${progressBarColor.replace('bg-','text-')}`}>{progress.toFixed(0)}%</span>
            </div>
            <div className="mt-4">
                 <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>{formatCurrency(spent)}</span>
                    <span className="font-semibold">de {formatCurrency(budget.limit)}</span>
                </div>
            </div>
        </Card>
    );
};

const Budgets: React.FC = () => {
    const { budgets, transactions } = useFinance();
    const spentByCategory = React.useMemo(() => {
        return transactions.reduce((acc, t) => {
            if (t.type === TransactionType.Despesa) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [transactions]);
    
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-8">
            {/* Título: Poppins semi-bold */}
            <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight">Orçamentos</h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4">
            {budgets.map(budget => (
            <BudgetCard 
                key={budget.categoryId} 
                budget={budget} 
                spent={spentByCategory[budget.categoryId] || 0}
            />
            ))}
            {budgets.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-gray-400 font-medium">Nenhum orçamento configurado.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Budgets;
