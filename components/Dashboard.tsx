
import React, { useMemo, useState } from 'react';
import { TransactionType, type Transaction } from '../types';
import { useFinance } from '../context/FinanceContext';
import Card from './common/Card';
import { EyeIcon, EyeOffIcon, XIcon, iconComponents } from '../constants';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDateSimple = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
};

const VariationIndicator = ({ value, isVisible }: { value: number; isVisible: boolean }) => {
  if (!isVisible) return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 w-fit">
        <span className="text-[10px] font-medium text-gray-400 tracking-tight">--%</span>
        <span className="text-[8px] font-medium text-gray-400/50 uppercase tracking-tighter whitespace-nowrap">Mês anterior</span>
    </div>
  );
  
  if (isNaN(value) || !isFinite(value)) return null;
  
  const isZero = Math.abs(value) < 0.1;
  const isPositive = value >= 0;
  const absValue = Math.abs(value).toFixed(1);

  // Caso não haja variação: Cinza, sem fundo, texto reduzido
  if (isZero) {
    return (
        <div className="flex items-center gap-1.5 px-1 py-0.5 w-fit">
            <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-medium text-gray-400 tracking-tight">0.0%</span>
            </div>
            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-700 opacity-30"></div>
            <span className="text-[8px] font-medium text-gray-400 uppercase tracking-tighter whitespace-nowrap">Mês anterior</span>
        </div>
    );
  }

  const colorClass = isPositive 
    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30' 
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg w-fit border animate-in fade-in duration-500 ${colorClass}`}>
      <div className="flex items-center gap-0.5">
        <span className="text-[13px] font-black leading-none">{isPositive ? '↑' : '↓'}</span>
        <span className="text-[10px] font-medium tracking-tighter">{absValue}%</span>
      </div>
      <div className="w-px h-2.5 bg-current opacity-20"></div>
      <span className="text-[7.5px] font-medium uppercase tracking-tighter opacity-80 whitespace-nowrap">Mês anterior</span>
    </div>
  );
};

// Modal de Detalhamento de Transações
const TransactionDetailModal = ({ 
    title, 
    transactions, 
    color,
    onClose 
}: { 
    title: string; 
    transactions: Transaction[]; 
    color: string;
    onClose: () => void 
}) => {
    const { categories } = useFinance();

    const grouped = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dark-sidebar w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border-x border-t border-gray-100 dark:border-gray-800 relative">
                
                {/* Sinalizador Superior */}
                <div className={`h-1.5 w-full ${color} absolute top-0 left-0 z-20`}></div>
                
                <header className="p-6 pb-4 pt-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-dark-sidebar/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-semibold font-['Poppins'] text-gray-800 dark:text-white leading-tight">{title}</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Detalhamento dos Lançamentos</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {sortedDates.map(date => (
                        <div key={date} className="mb-6 last:mb-0">
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 border-b border-gray-50 dark:border-gray-800/50 pb-1">
                                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                            </h3>
                            <div className="space-y-3">
                                {grouped[date].map(t => {
                                    const cat = categories.find(c => c.id === t.categoryId);
                                    const Icon = cat ? iconComponents[cat.icon] : () => null;
                                    const isRevenue = t.type === TransactionType.Receita || (t.type === TransactionType.Investimento && t.isInvestmentWithdrawal);
                                    
                                    return (
                                        <div key={t.id} className="flex items-center gap-3 group">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                cat?.color === 'transparent' ? 'bg-gray-100 dark:bg-gray-800' : 
                                                cat?.color.replace('text-', 'bg-').replace('-500', '-100') + ' dark:' + cat?.color.replace('text-', 'bg-').replace('-500', '-900/40')
                                            }`}>
                                                {cat?.customIcon ? (
                                                    <img src={cat.customIcon} className="w-5 h-5 object-contain" alt="" />
                                                ) : <Icon className={`w-5 h-5 ${cat?.color !== 'transparent' ? cat?.color : ''}`} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate tracking-tight">{t.description}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.paymentMethod !== 'N/A' ? t.paymentMethod : (t.isInvestmentWithdrawal ? 'Resgate' : 'Aporte')}</p>
                                            </div>
                                            <p className={`text-sm font-bold whitespace-nowrap ${isRevenue ? 'text-green-500' : 'text-red-500'}`}>
                                                {isRevenue ? '+' : '-'} {formatCurrency(t.amount)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                
                <footer className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total no grupo</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                            {formatCurrency(transactions.reduce((acc, t) => {
                                const isRevenue = t.type === TransactionType.Receita || (t.type === TransactionType.Investimento && t.isInvestmentWithdrawal);
                                return isRevenue ? acc + t.amount : acc - t.amount;
                            }, 0))}
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const InfoRow = ({ 
    title, 
    amount, 
    color, 
    description, 
    amountColorOverride, 
    isVisible,
    onClick,
    hasTransactions
}: { 
    title: string; 
    amount: number; 
    color: string; 
    description?: string; 
    amountColorOverride?: string; 
    isVisible: boolean;
    onClick?: () => void;
    hasTransactions?: boolean;
}) => {
    const isNegative = title.toLowerCase().includes('despesa');
    const isPositive = title.toLowerCase().includes('receita');
    const isInvestment = title.toLowerCase().includes('investimento');
    const isCard = title.toLowerCase().includes('fatura');
    
    let amountColorClass = amountColorOverride || 'text-gray-800 dark:text-gray-100';

    if (!amountColorOverride) {
      if (isNegative && amount > 0) amountColorClass = 'text-red-500';
      if (isPositive) amountColorClass = 'text-green-500';
      if (isInvestment) amountColorClass = 'text-blue-500';
      if (isCard) {
          amountColorClass = color.includes('orange') ? 'text-orange-500' : 'text-purple-500';
      }
    }

    return (
        <div 
            onClick={hasTransactions ? onClick : undefined}
            className={`flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl transition-all ${
                hasTransactions 
                    ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 active:scale-[0.99]' 
                    : 'opacity-80'
            }`}
        >
            <div className="flex items-center">
                <div className={`w-1 h-8 sm:h-10 mr-3 rounded-full ${color}`}></div>
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-tight">{title}</p>
                    {description && <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <p className={`font-bold text-base sm:text-lg tracking-tight ${amountColorClass}`}>
                    {isVisible ? formatCurrency(amount) : 'R$ •••,••'}
                </p>
                {hasTransactions && isVisible && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { transactions, totalBalance, cardClosingDay, initialInvestment, initialBalance } = useFinance();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [detailedView, setDetailedView] = useState<{ title: string; list: Transaction[]; color: string } | null>(null);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    // Fix: Using getMonth() instead of non-existent month() property on Date object
    const month = now.getMonth();
    
    const currentMonthLabelLong = `${now.toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + now.toLocaleString('pt-BR', { month: 'long' }).slice(1)}/${year}`;

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
    const thisMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
    });

    const isCC = (t: Transaction) => t.type === TransactionType.Despesa && t.paymentMethod === 'Cartão de Crédito';
    const currentMonthClosing = new Date(year, month, cardClosingDay, 0, 0, 0);
    const prevMonthClosing = new Date(year, month - 1, cardClosingDay, 0, 0, 0);

    // Listas para detalhamento
    const listIncome = thisMonthTransactions.filter(t => t.type === TransactionType.Receita);
    const listExpenses = thisMonthTransactions.filter(t => t.type === TransactionType.Despesa && t.paymentMethod !== 'Cartão de Crédito' && !t.isCardBillPayment);
    const listInvestments = thisMonthTransactions.filter(t => t.type === TransactionType.Investimento);
    const listCurrentCard = transactions.filter(t => isCC(t) && new Date(t.date) >= prevMonthClosing && new Date(t.date) < currentMonthClosing);
    
    const allFutureTransactions = transactions.filter(t => new Date(t.date) > now);
    const listPendingIncome = allFutureTransactions.filter(t => t.type === TransactionType.Receita);
    const listPendingExpenses = allFutureTransactions.filter(t => t.type === TransactionType.Despesa && t.paymentMethod !== 'Cartão de Crédito' && !t.isCardBillPayment);
    const listPendingInvestments = allFutureTransactions.filter(t => t.type === TransactionType.Investimento);
    const listPlanningCard = transactions.filter(t => isCC(t) && new Date(t.date) >= currentMonthClosing);

    const prevMonthEnd = new Date(year, month, 0);
    const prevTotalBalance = transactions
        .filter(t => new Date(t.date) <= prevMonthEnd)
        .reduce((acc, t) => {
            if (t.type === TransactionType.Receita) return acc + t.amount;
            if (t.type === TransactionType.Despesa && !t.isCardBillPayment) return acc - t.amount;
            return acc;
        }, 0) + initialBalance;

    const balanceVariation = prevTotalBalance !== 0 ? ((totalBalance - prevTotalBalance) / Math.abs(prevTotalBalance)) * 100 : 0;

    const currentTotalInvested = transactions
        .filter(t => t.type === TransactionType.Investimento && new Date(t.date) <= now)
        .reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0) + initialInvestment;

    const prevTotalInvested = transactions
        .filter(t => t.type === TransactionType.Investimento && new Date(t.date) <= prevMonthEnd)
        .reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0) + initialInvestment;

    const investmentVariation = prevTotalInvested !== 0 ? ((currentTotalInvested - prevTotalInvested) / Math.abs(prevTotalInvested)) * 100 : 0;

    return { 
        currentMonthLabelLong,
        balanceVariation,
        investmentVariation,
        currentTotalInvested,
        // Listas completas
        listIncome, listExpenses, listInvestments, listCurrentCard,
        listPendingIncome, listPendingExpenses, listPendingInvestments, listPlanningCard,
        // Somatórios
        monthIncome: listIncome.reduce((sum, t) => sum + t.amount, 0),
        monthExpenses: listExpenses.reduce((sum, t) => sum + t.amount, 0),
        monthInvestments: listInvestments.reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0),
        currentCardBill: listCurrentCard.reduce((sum, t) => sum + t.amount, 0),
        pendingIncome: listPendingIncome.reduce((sum, t) => sum + t.amount, 0),
        pendingExpenses: listPendingExpenses.reduce((sum, t) => sum + t.amount, 0),
        pendingInvestments: listPendingInvestments.reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0),
        planningCardBill: listPlanningCard.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, totalBalance, cardClosingDay, initialInvestment, initialBalance]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-8 flex items-center justify-between min-h-[64px]">
          <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight shrink-0">Dashboard</h1>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="bg-accent px-3 py-1.5 sm:px-4 rounded-xl shadow-lg border border-accent/20">
                <span className="text-[10px] sm:text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    {dashboardData.currentMonthLabelLong}
                </span>
             </div>

             <button 
                onClick={() => setIsBalanceVisible(!isBalanceVisible)} 
                className="p-2 text-gray-400 hover:text-accent dark:hover:text-accent-light transition-colors bg-gray-100 dark:bg-gray-800 rounded-xl"
             >
                {isBalanceVisible ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 space-y-6 w-full pb-24">
            
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <Card className="border-l-4 border-green-500 py-3 sm:py-6 flex flex-col justify-between min-h-[100px] sm:min-h-[140px]">
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Saldo disponível</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate tracking-tight leading-tight">
                            {isBalanceVisible ? formatCurrency(totalBalance) : 'R$ •••,••'}
                        </p>
                    </div>
                    <div className="mt-1.5 sm:mt-4">
                        <VariationIndicator value={dashboardData.balanceVariation} isVisible={isBalanceVisible} />
                    </div>
                </Card>
                <Card className="border-l-4 border-blue-500 py-3 sm:py-6 flex flex-col justify-between min-h-[100px] sm:min-h-[140px]">
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Total investido</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate tracking-tight leading-tight">
                            {isBalanceVisible ? formatCurrency(dashboardData.currentTotalInvested) : 'R$ •••,••'}
                        </p>
                    </div>
                    <div className="mt-1.5 sm:mt-4">
                        <VariationIndicator value={dashboardData.investmentVariation} isVisible={isBalanceVisible} />
                    </div>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Visão geral do mês</h2>
                    <div className="space-y-1 flex-1">
                        <InfoRow 
                            title="Receitas" 
                            amount={dashboardData.monthIncome} 
                            color="bg-green-500" 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listIncome.length > 0}
                            onClick={() => setDetailedView({ title: 'Receitas do Mês', list: dashboardData.listIncome, color: 'bg-green-500' })}
                        />
                        <InfoRow 
                            title="Despesas" 
                            amount={dashboardData.monthExpenses} 
                            color="bg-red-500" 
                            isVisible={isBalanceVisible} 
                            description="Pagamentos sem cartão de crédito" 
                            hasTransactions={dashboardData.listExpenses.length > 0}
                            onClick={() => setDetailedView({ title: 'Despesas do Mês', list: dashboardData.listExpenses, color: 'bg-red-500' })}
                        />
                        <InfoRow 
                            title="Investimentos" 
                            amount={dashboardData.monthInvestments} 
                            color="bg-blue-500" 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listInvestments.length > 0}
                            onClick={() => setDetailedView({ title: 'Investimentos do Mês', list: dashboardData.listInvestments, color: 'bg-blue-500' })}
                        />
                        <InfoRow 
                            title="Fatura atual do cartão" 
                            amount={dashboardData.currentCardBill} 
                            color="bg-orange-500" 
                            isVisible={isBalanceVisible} 
                            description={`Gastos até o dia ${cardClosingDay - 1}`}
                            hasTransactions={dashboardData.listCurrentCard.length > 0}
                            onClick={() => setDetailedView({ title: 'Fatura Atual', list: dashboardData.listCurrentCard, color: 'bg-orange-500' })}
                        />
                    </div>
                </Card>

                <Card className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Planejamento</h2>
                    <div className="space-y-1 flex-1">
                        <InfoRow 
                            title="Receitas pendentes" 
                            amount={dashboardData.pendingIncome} 
                            color="bg-green-500" 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listPendingIncome.length > 0}
                            onClick={() => setDetailedView({ title: 'Receitas Planejadas', list: dashboardData.listPendingIncome, color: 'bg-green-500' })}
                        />
                        <InfoRow 
                            title="Despesas pendentes" 
                            amount={dashboardData.pendingExpenses} 
                            color="bg-red-500" 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listPendingExpenses.length > 0}
                            onClick={() => setDetailedView({ title: 'Despesas Planejadas', list: dashboardData.listPendingExpenses, color: 'bg-red-500' })}
                        />
                        <InfoRow 
                            title="Investimento planejado" 
                            amount={dashboardData.pendingInvestments} 
                            color="bg-blue-500" 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listPendingInvestments.length > 0}
                            onClick={() => setDetailedView({ title: 'Investimentos Planejados', list: dashboardData.listPendingInvestments, color: 'bg-blue-500' })}
                        />
                        <InfoRow 
                            title="Próxima fatura do cartão" 
                            amount={dashboardData.planningCardBill} 
                            color="bg-purple-500" 
                            description={`Gastos a partir do dia ${cardClosingDay}`} 
                            isVisible={isBalanceVisible} 
                            hasTransactions={dashboardData.listPlanningCard.length > 0}
                            onClick={() => setDetailedView({ title: 'Próxima Fatura', list: dashboardData.listPlanningCard, color: 'bg-purple-500' })}
                        />
                    </div>
                </Card>
            </div>
        </div>
      </div>

      {detailedView && (
        <TransactionDetailModal 
            title={detailedView.title} 
            transactions={detailedView.list} 
            color={detailedView.color}
            onClose={() => setDetailedView(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
