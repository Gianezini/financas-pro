
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XAxis, YAxis, Tooltip, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area, CartesianGrid,
    BarChart, Bar, Cell, LabelList, Legend
} from 'recharts';
import { TransactionType, type Transaction } from '../types';
import Card from './common/Card';
import { useFinance } from '../context/FinanceContext';
import { CalendarDaysIcon, ListIcon, ChartIcon } from '../constants';

interface ReportsProps {
  theme: string;
}

type Granularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ViewMode = 'chart' | 'table';
type SortKey = 'name' | 'valor';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatShortCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
}

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const Reports: React.FC<ReportsProps> = ({ theme }) => {
    const { transactions, categories, cardClosingDay } = useFinance();
    
    const [startDate, setStartDate] = useState(() => {
        const saved = localStorage.getItem('finpro_reports_start');
        if (saved) return saved;
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        const saved = localStorage.getItem('finpro_reports_end');
        return saved || new Date().toISOString().split('T')[0];
    });

    const [granularity, setGranularity] = useState<Granularity>(() => {
        const saved = localStorage.getItem('finpro_reports_granularity');
        return (saved as Granularity) || 'daily';
    });

    const [isAccumulated, setIsAccumulated] = useState(() => {
        const saved = localStorage.getItem('finpro_reports_accumulated');
        return saved === 'true';
    });

    const [visibleSeries, setVisibleSeries] = useState(() => {
        const saved = localStorage.getItem('finpro_reports_visible_series');
        if (saved) return JSON.parse(saved);
        return { receitas: true, despesas: true, investimentos: true };
    });

    const [categoryType, setCategoryType] = useState<TransactionType>(() => {
        const saved = localStorage.getItem('finpro_reports_cat_type');
        return (saved as TransactionType) || TransactionType.Despesa;
    });

    const [categoryView, setCategoryView] = useState<ViewMode>(() => {
        const saved = localStorage.getItem('finpro_reports_cat_view');
        return (saved as ViewMode) || 'chart';
    });

    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'valor', direction: 'desc' });

    useEffect(() => { localStorage.setItem('finpro_reports_start', startDate); }, [startDate]);
    useEffect(() => { localStorage.setItem('finpro_reports_end', endDate); }, [endDate]);
    useEffect(() => { localStorage.setItem('finpro_reports_granularity', granularity); }, [granularity]);
    useEffect(() => { localStorage.setItem('finpro_reports_accumulated', String(isAccumulated)); }, [isAccumulated]);
    useEffect(() => { localStorage.setItem('finpro_reports_cat_type', categoryType); }, [categoryType]);
    useEffect(() => { localStorage.setItem('finpro_reports_cat_view', categoryView); }, [categoryView]);
    useEffect(() => { localStorage.setItem('finpro_reports_visible_series', JSON.stringify(visibleSeries)); }, [visibleSeries]);

    const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

    const getEffectiveDate = (t: Transaction) => {
        const d = new Date(t.date);
        if (t.type === TransactionType.Despesa && t.paymentMethod === 'Cartão de Crédito') {
            if (d.getDate() >= cardClosingDay) {
                return new Date(d.getFullYear(), d.getMonth() + 1, 1, 12, 0, 0);
            }
        }
        return d;
    };

    const getGroupKey = (date: Date) => {
        const d = new Date(date);
        switch (granularity) {
            case 'daily':
                return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            case 'weekly':
                return `Sem ${getWeekNumber(d)}/${d.getFullYear().toString().slice(-2)}`;
            case 'monthly':
                const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear().toString().slice(-2)}`;
            case 'quarterly':
                const quarter = Math.floor(d.getMonth() / 3) + 1;
                return `T${quarter} ${d.getFullYear()}`;
            case 'yearly':
                return `${d.getFullYear()}`;
            default:
                return '';
        }
    };

    const evolutionData = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        
        const validTransactions = transactions.filter(t => !t.isCardBillPayment);

        const mappedTransactions = validTransactions.map(t => ({
            ...t,
            effectiveDate: getEffectiveDate(t)
        }));

        const filtered = mappedTransactions
            .filter(t => t.effectiveDate >= start && t.effectiveDate <= end)
            .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());

        const dataMap: Record<string, { receitas: number, despesas: number, investimentos: number }> = {};
        
        filtered.forEach(t => {
            const key = getGroupKey(t.effectiveDate);
            if (!dataMap[key]) dataMap[key] = { receitas: 0, despesas: 0, investimentos: 0 };
            
            if (t.type === TransactionType.Receita) dataMap[key].receitas += t.amount;
            else if (t.type === TransactionType.Despesa) dataMap[key].despesas += t.amount;
            else if (t.type === TransactionType.Investimento) {
                dataMap[key].investimentos += t.isInvestmentWithdrawal ? -t.amount : t.amount;
            }
        });

        const rawData = Object.entries(dataMap).map(([name, values]) => ({ name, ...values }));
        
        if (isAccumulated) {
            let accR = 0, accD = 0, accI = 0;
            return rawData.map(item => {
                accR += item.receitas;
                accD += item.despesas;
                accI += item.investimentos;
                return { ...item, receitas: accR, despesas: accD, investimentos: accI };
            });
        }

        return rawData;
    }, [transactions, startDate, endDate, granularity, isAccumulated, cardClosingDay]);
    
    const netWorthData = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        
        const mappedTransactions = transactions.map(t => ({
            ...t,
            effectiveDate: getEffectiveDate(t)
        }));

        const sortedAll = mappedTransactions.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
        
        let currentNetWorth = 0;
        const bucketValues: Record<string, number> = {};

        sortedAll.forEach(t => {
            if (t.type === TransactionType.Receita) currentNetWorth += t.amount;
            else if (t.type === TransactionType.Despesa && !t.isCardBillPayment) {
                 currentNetWorth -= t.amount;
            }
            
            if (t.effectiveDate >= start && t.effectiveDate <= end) {
                const key = getGroupKey(t.effectiveDate);
                bucketValues[key] = currentNetWorth;
            }
        });

        return Object.entries(bucketValues).map(([name, patrimonio]) => ({ name, patrimonio }));
    }, [transactions, startDate, endDate, granularity, cardClosingDay]);

    const categorySummaryData = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        const dataMap: Record<string, { valor: number, color: string }> = {};

        const validTransactions = transactions.filter(t => !t.isCardBillPayment);

        const mappedTransactions = validTransactions.map(t => ({
            ...t,
            effectiveDate: getEffectiveDate(t)
        }));

        const filtered = mappedTransactions.filter(t => {
            return t.effectiveDate >= start && t.effectiveDate <= end && t.type === categoryType;
        });

        filtered.forEach(t => {
            const category = categories.find(c => c.id === t.categoryId);
            const name = category?.name || 'Outros';
            const color = theme === 'dark' ? '#818cf8' : '#4f46e5'; 
            
            if (!dataMap[name]) {
                dataMap[name] = { valor: 0, color };
            }
            dataMap[name].valor += t.amount;
        });

        const result = Object.entries(dataMap).map(([name, data]) => ({ 
            name, 
            valor: data.valor, 
            color: data.color 
        }));

        result.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            }
            
            return sortConfig.direction === 'asc' 
                ? (valA as number) - (valB as number) 
                : (valB as number) - (valA as number);
        });

        return result;
    }, [transactions, categoryType, startDate, endDate, categories, theme, sortConfig, cardClosingDay]);

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleLegendClick = (o: any) => {
        const { dataKey } = o;
        const key = dataKey as keyof typeof visibleSeries;
        if (key && visibleSeries.hasOwnProperty(key)) {
            setVisibleSeries(prev => ({
                ...prev,
                [key]: !prev[key]
            }));
        }
    };

    const renderLegendText = (value: string, entry: any) => {
        const { dataKey } = entry;
        const isHidden = !visibleSeries[dataKey as keyof typeof visibleSeries];
        
        return (
            <span style={{ 
                textDecoration: isHidden ? 'line-through' : 'none', 
                opacity: isHidden ? 0.4 : 1,
                color: theme === 'dark' ? '#f8fafc' : '#1e293b'
            }}>
                {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
            </span>
        );
    };

    const capitalize = (text: string) => {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    };

    const customTooltipStyle = {
        backgroundColor: '#0f172a',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        padding: '12px'
    };

    const customLabelStyle = {
        color: '#94a3b8',
        fontSize: '11px',
        fontWeight: 'bold',
        marginBottom: '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
    };

    const customItemStyle = {
        color: '#f8fafc',
        fontSize: '13px',
        padding: '2px 0'
    };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-8">
          <div className="pt-2">
            {/* Título: Poppins semi-bold */}
            <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight mb-4">Relatórios</h1>
          </div>
          
          <div className="flex flex-row items-start justify-between gap-2 sm:gap-4 p-3 sm:py-3 sm:px-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl sm:rounded-[1.5rem] border border-gray-100 dark:border-gray-700/50 shadow-inner overflow-hidden">
            <div className="flex flex-col gap-1.5 sm:gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 px-1">
                    <CalendarDaysIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">Período</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full max-w-[100px] sm:max-w-[140px] px-2 py-1.5 sm:px-3 sm:py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold focus:ring-2 focus:ring-accent outline-none text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                    />
                    <span className="text-gray-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex-shrink-0 px-0.5">ATÉ</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full max-w-[100px] sm:max-w-[140px] px-2 py-1.5 sm:px-3 sm:py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold focus:ring-2 focus:ring-accent outline-none text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-1 flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 px-1">Visualização</span>
                <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as Granularity)}
                    className="px-2 py-1.5 sm:px-4 sm:py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-accent outline-none transition-all cursor-pointer shadow-sm min-w-[80px] sm:min-w-[130px] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.75rem' }}
                >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 space-y-8 w-full pb-24">
            
            <Card className="w-full overflow-hidden border-none shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight">Evolução do período</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Análise de fluxos financeiros por data de faturamento</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsAccumulated(!isAccumulated)}
                        className={`px-5 py-2 text-[10px] font-bold rounded-xl border transition-all shadow-sm ${
                            isAccumulated 
                            ? 'bg-white border-accent text-accent' 
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-accent/30'
                        }`}
                    >
                        ACUMULADO
                    </button>
                </div>
              </div>

              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInvestimentos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatShortCurrency(value)}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), capitalize(String(name))]}
                        contentStyle={customTooltipStyle}
                        labelStyle={customLabelStyle}
                        itemStyle={customItemStyle}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="center" 
                        height={40} 
                        iconType="circle" 
                        onClick={handleLegendClick}
                        formatter={renderLegendText}
                        wrapperStyle={{ 
                            paddingBottom: "10px",
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receitas" 
                        name="receitas"
                        stroke="#22c55e" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorReceitas)" 
                        hide={!visibleSeries.receitas}
                        animationDuration={1000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="despesas" 
                        name="despesas"
                        stroke="#ef4444" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorDespesas)" 
                        hide={!visibleSeries.despesas}
                        animationDuration={1000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="investimentos" 
                        name="investimentos"
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorInvestimentos)" 
                        hide={!visibleSeries.investimentos}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
            </Card>

            <Card className="w-full border-none shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight">Distribuição por Categoria</h2>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 flex-1">
                            <button 
                                onClick={() => setCategoryType(TransactionType.Receita)} 
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                                    categoryType === TransactionType.Receita 
                                    ? 'bg-green-500 text-white shadow-md' 
                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Receitas
                            </button>
                            <button 
                                onClick={() => setCategoryType(TransactionType.Despesa)} 
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                                    categoryType === TransactionType.Despesa 
                                    ? 'bg-red-500 text-white shadow-md' 
                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Despesas
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setCategoryView(categoryView === 'chart' ? 'table' : 'chart')}
                            className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all shadow-sm border border-accent/20"
                            title={categoryView === 'chart' ? "Ver Tabela" : "Ver Gráfico"}
                        >
                            {categoryView === 'chart' ? <ListIcon className="w-5 h-5" /> : <ChartIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="min-h-[300px]">
                    {categoryView === 'chart' ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={categorySummaryData} 
                                    layout="vertical"
                                    margin={{ top: 10, right: 100, left: 40, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category"
                                        dataKey="name"
                                        tickFormatter={capitalize}
                                        tick={{ fill: '#fff', fontSize: 10, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={80}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelFormatter={(label) => typeof label === 'string' ? capitalize(label) : label}
                                        contentStyle={customTooltipStyle}
                                        labelStyle={customLabelStyle}
                                        itemStyle={customItemStyle}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar 
                                        dataKey="valor" 
                                        radius={[0, 4, 4, 0]} 
                                        barSize={20}
                                        animationDuration={1000}
                                    >
                                        <LabelList 
                                          dataKey="valor" 
                                          position="right" 
                                          formatter={(value: number) => formatCurrency(value)}
                                          style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                          offset={10}
                                        />
                                        {categorySummaryData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={categoryType === TransactionType.Receita ? '#22c55e' : '#ef4444'} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="py-3 px-4">
                                            <button 
                                                onClick={() => handleSort('name')}
                                                className="group flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-accent transition-colors"
                                            >
                                                Categoria
                                                <span className={`transition-opacity ${sortConfig.key === 'name' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                                                    {sortConfig.key === 'name' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="py-3 px-4">
                                            <button 
                                                onClick={() => handleSort('valor')}
                                                className="group flex items-center gap-1 ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-accent transition-colors"
                                            >
                                                Total Acumulado
                                                <span className={`transition-opacity ${sortConfig.key === 'valor' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                                                    {sortConfig.key === 'valor' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorySummaryData.map((item, index) => {
                                        const total = categorySummaryData.reduce((acc, curr) => acc + curr.valor, 0);
                                        const percentage = total > 0 ? ((item.valor / total) * 100).toFixed(1) : '0';
                                        
                                        return (
                                            <tr key={index} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                                                <td className={`py-3 px-4 text-sm font-bold text-right ${categoryType === TransactionType.Receita ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatCurrency(item.valor)}
                                                </td>
                                                <td className="py-3 px-4 text-[10px] font-bold text-gray-400 text-right">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
                                    {categorySummaryData.length > 0 && (
                                        <tr className="bg-gray-100/50 dark:bg-gray-800/50 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                                            <td className="py-3 px-4 text-sm uppercase tracking-widest text-gray-800 dark:text-gray-100">Total</td>
                                            <td className={`py-3 px-4 text-sm text-right ${categoryType === TransactionType.Receita ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(categorySummaryData.reduce((acc, curr) => acc + curr.valor, 0))}
                                            </td>
                                            <td className="py-3 px-4 text-[10px] text-gray-400 text-right">100.0%</td>
                                        </tr>
                                    )}
                                    {categorySummaryData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-10 text-center text-gray-400 font-medium">Nenhum dado encontrado para este período.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="w-full border-none shadow-sm">
              <div className="flex flex-col mb-8">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight">Evolução do patrimônio</h2>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={netWorthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }} 
                        axisLine={false} 
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatShortCurrency(value)}
                        tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
                        axisLine={false} 
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={customTooltipStyle}
                        labelStyle={customLabelStyle}
                        itemStyle={customItemStyle}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="patrimonio" 
                        name="Patrimônio Total" 
                        stroke="#4f46e5" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
              </div>
            </Card>

        </div>
      </div>
    </div>
  );
};

export default Reports;
