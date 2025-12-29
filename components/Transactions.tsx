
import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { iconComponents, SearchIcon, XIcon } from '../constants';
import { useFinance } from '../context/FinanceContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonthYear = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    return `${weekday} - ${dayMonthYear}`;
};

const TransactionItem: React.FC<{ transaction: Transaction; onClick: () => void }> = ({ transaction, onClick }) => {
    const { categories } = useFinance();
    const [showInfo, setShowInfo] = useState(false);
    const category = categories.find(c => c.id === transaction.categoryId);
    const Icon = category ? iconComponents[category.icon] : () => null;
    
    let amountColor = 'text-gray-500';
    if (transaction.type === TransactionType.Receita) amountColor = 'text-green-500';
    else if (transaction.type === TransactionType.Despesa) amountColor = 'text-red-500';
    else if (transaction.type === TransactionType.Investimento) amountColor = 'text-blue-500';

    const isTransparent = category?.color === 'transparent';

    const formattedPaymentMethod = transaction.paymentMethod 
        ? transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1).toLowerCase()
        : '';

    const baseColor = category?.color.replace('text-', '').replace('-500', '') || 'gray';

    const transactionTime = new Date(transaction.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div onClick={onClick} className="flex items-center py-3 px-4 bg-white dark:bg-dark-sidebar rounded-xl mb-2 shadow-sm border border-transparent hover:border-accent/30 transition-all cursor-pointer w-full group relative">
            <div className={`p-2.5 rounded-xl mr-4 transition-transform group-hover:scale-110 flex items-center justify-center flex-shrink-0 ${
                isTransparent 
                ? 'bg-gray-100 dark:bg-gray-800' 
                : `${category?.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${category?.color.replace('text-', 'bg-').replace('-500', '-900/40')}`
            }`}>
                {category?.customIcon ? (
                    <img src={category.customIcon} className="w-5 h-5 object-contain" alt={category.name} />
                ) : (
                    <Icon className={`w-5 h-5 ${!isTransparent ? category?.color : ''}`} />
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="font-semibold font-['Montserrat'] text-gray-800 dark:text-white leading-tight truncate text-sm sm:text-base mb-1.5 tracking-tight">
                    {transaction.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                    {!transaction.isCardBillPayment && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight ${
                            isTransparent 
                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' 
                            : `bg-${baseColor}-50 text-${baseColor}-600 dark:bg-${baseColor}-900/30 dark:text-${baseColor}-400`
                        }`}>
                            {category?.name || 'Geral'}
                        </span>
                    )}
                    
                    {transaction.type === TransactionType.Investimento && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight text-white ${transaction.isInvestmentWithdrawal ? 'bg-red-500' : 'bg-green-500'}`}>
                            {transaction.isInvestmentWithdrawal ? 'Retirada' : 'Aporte'}
                        </span>
                    )}

                    {transaction.isCardBillPayment && (
                        <div className="relative flex items-center gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight bg-orange-500 text-white shadow-sm shadow-orange-500/20">
                                Fatura de Cartão
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                                onMouseEnter={() => setShowInfo(true)}
                                onMouseLeave={() => setShowInfo(false)}
                                className="p-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {transaction.isRecurring && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                            Recorrente
                        </span>
                    )}
                </div>
            </div>

            <div className="text-right ml-4 flex flex-col items-end space-y-1 shrink-0">
                <p className={`font-bold text-sm sm:text-lg leading-none ${amountColor}`}>
                    {transaction.type === TransactionType.Receita || (transaction.type === TransactionType.Investimento && transaction.isInvestmentWithdrawal) ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold leading-none">
                    {transaction.type === TransactionType.Investimento ? (transaction.isInvestmentWithdrawal ? 'Resgate' : 'Aporte') : formattedPaymentMethod}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-300 font-semibold leading-none tracking-tight">
                    {transactionTime}
                </p>
            </div>
        </div>
    );
}

type FutureFilterType = 'none' | 'nextMonth' | 'sixMonths' | 'all' | 'custom';

const filterOptions: { key: FutureFilterType; label: string }[] = [
    { key: 'none', label: 'Mês atual' },
    { key: 'nextMonth', label: 'Mês seguinte' },
    { key: 'sixMonths', label: 'Próximos 6 meses' },
    { key: 'all', label: 'Completo' },
    { key: 'custom', label: 'Personalizado' },
];

/**
 * Normaliza o texto removendo acentos e convertendo para minúsculo
 */
const normalizeText = (text: string) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const Transactions: React.FC = () => {
  const { transactions, openTransactionForm, categories } = useFinance();
  
  const [futureFilter, setFutureFilter] = useState<FutureFilterType>(() => {
      const saved = localStorage.getItem('finpro_extrato_filter');
      return (saved as FutureFilterType) || 'none';
  });

  const [customStartDate, setCustomStartDate] = useState(() => {
      return localStorage.getItem('finpro_extrato_start') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  });
  
  const [customEndDate, setCustomEndDate] = useState(() => {
      return localStorage.getItem('finpro_extrato_end') || new Date().toISOString().split('T')[0];
  });

  // Novos estados para Pesquisa
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
      localStorage.setItem('finpro_extrato_filter', futureFilter);
      localStorage.setItem('finpro_extrato_start', customStartDate);
      localStorage.setItem('finpro_extrato_end', customEndDate);
  }, [futureFilter, customStartDate, customEndDate]);

  const filteredTransactions = useMemo<Transaction[]>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let list: Transaction[] = [];

    // Primeiro aplica o filtro de período
    switch (futureFilter) {
        case 'all': 
            list = transactions;
            break;
        case 'custom':
            const start = new Date(customStartDate + 'T00:00:00');
            const end = new Date(customEndDate + 'T23:59:59');
            list = transactions.filter(t => { 
                const d = new Date(t.date); 
                return d >= start && d <= end; 
            });
            break;
        case 'nextMonth': 
            const startOfThis = new Date(currentYear, currentMonth, 1, 0, 0, 0);
            const endOfNext = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59);
            list = transactions.filter(t => {
                const d = new Date(t.date);
                return d >= startOfThis && d <= endOfNext;
            });
            break;
        case 'sixMonths':
            const startSix = new Date(currentYear, currentMonth, 1, 0, 0, 0);
            const endSix = new Date(currentYear, currentMonth + 7, 0, 23, 59, 59);
            list = transactions.filter(t => {
                const d = new Date(t.date);
                return d >= startSix && d <= endSix;
            });
            break;
        case 'none':
        default:
            const startOfCurrent = new Date(currentYear, currentMonth, 1, 0, 0, 0);
            const endOfCurrent = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
            list = transactions.filter(t => {
                const d = new Date(t.date);
                return d >= startOfCurrent && d <= endOfCurrent;
            });
            break;
    }

    // Depois aplica a pesquisa se houver query (COM SUPORTE A ACENTOS)
    if (searchQuery.trim()) {
        const query = normalizeText(searchQuery);
        list = list.filter(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const time = new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            return (
                normalizeText(t.description).includes(query) ||
                (cat && normalizeText(cat.name).includes(query)) ||
                t.amount.toString().includes(query) ||
                normalizeText(t.paymentMethod).includes(query) ||
                time.includes(query)
            );
        });
    }

    return list;
  }, [transactions, futureFilter, customStartDate, customEndDate, searchQuery, categories]);
  
  const groupedTransactions = useMemo<Record<string, Transaction[]>>(() => {
    return [...filteredTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce<Record<string, Transaction[]>>((acc, t) => {
      const d = new Date(t.date);
      const dateKey = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(t);
      return acc;
    }, {});
  }, [filteredTransactions]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight">Extrato</h1>
            <div className="flex items-center gap-2">
                <select
                    value={futureFilter}
                    onChange={(e) => setFutureFilter(e.target.value as FutureFilterType)}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all cursor-pointer shadow-sm"
                >
                    {filterOptions.map(({ key, label }) => (<option key={key} value={key}>{label}</option>))}
                </select>
                
                {/* Botão da Lupa */}
                <button 
                    onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        if (isSearchOpen) setSearchQuery(''); // Limpa ao fechar
                    }}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                        isSearchOpen 
                        ? 'bg-accent text-white border-accent' 
                        : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-accent'
                    }`}
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
            </div>
          </div>

          {/* Campo de Pesquisa Expandível */}
          {isSearchOpen && (
            <div className="mt-3 relative animate-in slide-in-from-top-2 duration-200">
                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-accent transition-colors" />
                    <input 
                        type="text"
                        autoFocus
                        placeholder="Pesquise por categoria, descrição, valor, etc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-accent/30 rounded-2xl text-sm font-semibold outline-none transition-all shadow-inner"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
          )}

          {futureFilter === 'custom' && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10 animate-in slide-in-from-top-2">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Início</span>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 self-end mb-2"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Fim</span>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-accent" />
                </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 w-full pb-24">
            {Object.keys(groupedTransactions).length > 0 ? (Object.entries(groupedTransactions) as [string, Transaction[]][])
            .sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([dateKey, transactionsOnDate]) => (
                <div key={dateKey} className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-sm font-semibold text-gray-600 dark:text-white capitalize">{formatDate(`${dateKey}T12:00:00`)}</h2>
                        <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                    </div>
                    <div className="space-y-1">
                        {transactionsOnDate.map(t => <TransactionItem key={t.id} transaction={t} onClick={() => openTransactionForm(t)} />)}
                    </div>
                </div>
            )) : (
                <div className="text-center py-32 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                        {searchQuery ? (
                            <SearchIcon className="h-10 w-10 text-gray-300" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        )}
                    </div>
                    <p className="text-gray-400 font-bold text-lg">
                        {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Sem registros para este período.'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                        {searchQuery ? 'Tente buscar por termos mais genéricos ou verifique o filtro de período.' : 'Tente mudar o filtro para "Completo" para ver seu histórico total ou agendamentos futuros.'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
