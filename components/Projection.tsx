
import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import Card from './common/Card';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, type Transaction } from '../types';

interface ProjectionProps {
  theme: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const InfoRow = ({ title, amount, color, isNegativeRed = false }: { title: string; amount: number; color: string; isNegativeRed?: boolean }) => {
    const isDespesa = title.toLowerCase().includes('despesa');
    const isReceita = title.toLowerCase().includes('receita');
    const isInvestimento = title.toLowerCase().includes('investimento');
    
    let amountColorClass = 'text-gray-800 dark:text-gray-100';
    
    if (isDespesa && amount > 0) amountColorClass = 'text-red-500';
    else if (isReceita && amount > 0) amountColorClass = 'text-green-500';
    else if (isInvestimento) amountColorClass = 'text-blue-500';
    else if (isNegativeRed) {
        amountColorClass = amount >= 0 ? 'text-green-500' : 'text-red-500';
    }

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
                <div className={`w-1 h-8 sm:h-10 mr-3 rounded-full ${color}`}></div>
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{title}</p>
                </div>
            </div>
            <p className={`font-semibold text-base sm:text-lg ${amountColorClass}`}>
                {formatCurrency(amount)}
            </p>
        </div>
    );
};

const Projection: React.FC<ProjectionProps> = ({ theme }) => {
    const { transactions, totalBalance, initialInvestment, cardClosingDay } = useFinance();
    
    const [projectionMonths, setProjectionMonths] = useState<number>(() => {
        const saved = localStorage.getItem('finpro_proj_months');
        return saved ? Number(saved) : 12;
    });
    
    const [visibleSeries, setVisibleSeries] = useState(() => {
        const saved = localStorage.getItem('finpro_proj_visible');
        if (saved) return JSON.parse(saved);
        return {
            receitas: true,
            despesas: true,
            investimentos: true,
            saldo: true
        };
    });

    useEffect(() => {
        localStorage.setItem('finpro_proj_months', projectionMonths.toString());
    }, [projectionMonths]);

    useEffect(() => {
        localStorage.setItem('finpro_proj_visible', JSON.stringify(visibleSeries));
    }, [visibleSeries]);

    const tickColor = theme === 'dark' ? '#e2e8f0' : '#475569';

    const currentTotalInvested = useMemo(() => {
        const now = new Date();
        return transactions
            .filter(t => t.type === TransactionType.Investimento && new Date(t.date) <= now)
            .reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0) + initialInvestment;
    }, [transactions, initialInvestment]);

    const projectionData = useMemo(() => {
        const data: { name: string; receitas: number; despesas: number; investimentos: number; saldo: number; investimentoAcumulado: number }[] = [];
        let currentBalance = totalBalance;
        let currentInvested = currentTotalInvested;
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const mappedTransactions = transactions.map(t => {
            const d = new Date(t.date);
            let effectiveDate = d;
            if (t.type === TransactionType.Despesa && t.paymentMethod === 'Cartão de Crédito') {
                if (d.getDate() >= cardClosingDay) {
                    effectiveDate = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12, 0, 0);
                }
            }
            return { ...t, effectiveDate };
        });

        for (let i = 0; i < projectionMonths; i++) {
            const targetMonth = new Date(currentMonth);
            targetMonth.setMonth(targetMonth.getMonth() + i);
            
            const rawMonth = targetMonth.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            const formattedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
            const formattedYear = targetMonth.toLocaleDateString('pt-BR', { year: '2-digit' });
            const monthLabel = `${formattedMonth}/${formattedYear}`;

            const monthTransactions = mappedTransactions.filter(t => {
                return t.effectiveDate.getFullYear() === targetMonth.getFullYear() && 
                       t.effectiveDate.getMonth() === targetMonth.getMonth();
            });

            const monthRevenue = monthTransactions.filter(t => t.type === TransactionType.Receita).reduce((sum, t) => sum + t.amount, 0);
            const monthExpense = monthTransactions.filter(t => t.type === TransactionType.Despesa).reduce((sum, t) => sum + t.amount, 0);
            const monthInvestmentNet = monthTransactions
                .filter(t => t.type === TransactionType.Investimento)
                .reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0);
            
            if (i === 0) {
                 const today = new Date();
                 const futureTransactions = mappedTransactions.filter(t => {
                     return t.effectiveDate.getFullYear() === today.getFullYear() && 
                            t.effectiveDate.getMonth() === today.getMonth() && 
                            t.effectiveDate.getTime() > today.getTime();
                 });
                 const futureRevenue = futureTransactions.filter(t => t.type === TransactionType.Receita).reduce((sum, t) => sum + t.amount, 0);
                 const futureExpense = futureTransactions.filter(t => t.type === TransactionType.Despesa).reduce((sum, t) => sum + t.amount, 0);
                 const futureInvestmentNet = futureTransactions
                    .filter(t => t.type === TransactionType.Investimento)
                    .reduce((sum, t) => t.isInvestmentWithdrawal ? sum - t.amount : sum + t.amount, 0);
                 
                 currentBalance = totalBalance + futureRevenue - futureExpense - futureInvestmentNet;
                 currentInvested = currentTotalInvested + futureInvestmentNet;
            } else {
                 currentBalance += (monthRevenue - monthExpense - monthInvestmentNet);
                 currentInvested += monthInvestmentNet;
            }
            
            data.push({ 
                name: monthLabel, 
                receitas: monthRevenue, 
                despesas: monthExpense, 
                investimentos: monthInvestmentNet,
                saldo: currentBalance,
                investimentoAcumulado: currentInvested
            });
        }
        
        const totalReceitas = data.reduce((acc, item) => acc + item.receitas, 0);
        const totalDespesas = data.reduce((acc, item) => acc + item.despesas, 0);
        const totalInvestimentosNet = data.reduce((acc, item) => acc + item.investimentos, 0);
        
        return { 
            chartData: data, 
            totals: { 
                receitas: totalReceitas, 
                despesas: totalDespesas, 
                investimentos: totalInvestimentosNet,
                saldo: data[data.length-1]?.saldo || totalBalance, 
                investimentoTotalProjetado: data[data.length-1]?.investimentoAcumulado || currentTotalInvested,
                balanceOnPeriod: totalReceitas - totalDespesas - totalInvestimentosNet 
            } 
        };
    }, [transactions, totalBalance, currentTotalInvested, projectionMonths, cardClosingDay]);

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

    const customTooltipStyle = {
        backgroundColor: '#0f172a',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        padding: '12px'
    };

    const customLabelStyle = {
        color: '#94a3b8',
        fontSize: '12px',
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

    const periodOptions = [
        { value: 6, label: '6 meses' },
        { value: 12, label: '1 ano' },
        { value: 24, label: '2 anos' },
        { value: 60, label: '5 anos' }
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-full px-4 py-3 sm:px-8">
                    <div className="flex justify-between items-center mb-3">
                        {/* Título: Poppins semi-bold */}
                        <h1 className="text-xl md:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight leading-tight">Projeção de saldo e Investimentos</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">Período</span>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            {periodOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setProjectionMonths(opt.value)}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${projectionMonths === opt.value ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-8 space-y-6 w-full pb-24">
                    <Card className="w-full">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 border-b border-gray-100 dark:border-gray-800 pb-2">Resumo da Projeção ({periodOptions.find(o => o.value === projectionMonths)?.label})</h2>
                        <p className="text-[10px] text-gray-400 font-medium mb-4">* Gastos no cartão impactam o saldo apenas no mês de faturamento.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800">
                            <div>
                                <InfoRow title="Total de Receitas" amount={projectionData.totals.receitas} color="bg-green-500" />
                                <InfoRow title="Total de Despesas" amount={projectionData.totals.despesas} color="bg-red-500" />
                                <InfoRow title="Total de Investimentos" amount={projectionData.totals.investimentos} color="bg-blue-500" />
                            </div>
                            <div className="md:border-l md:pl-12 border-gray-100 dark:divide-gray-800 divide-gray-100">
                                <InfoRow title="Balanço no Período" amount={projectionData.totals.balanceOnPeriod} color="bg-sky-500" isNegativeRed />
                                <InfoRow title="Saldo Final Projetado" amount={projectionData.totals.saldo} color="bg-slate-500" isNegativeRed />
                                <InfoRow title="Investimento Total Projetado" amount={projectionData.totals.investimentoTotalProjetado} color="bg-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="w-full">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">Evolução Projetada</h2>
                         <ResponsiveContainer width="100%" height={450}>
                            <ComposedChart data={projectionData.chartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tickFormatter={(v) => formatShortCurrency(v)} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)} 
                                    contentStyle={customTooltipStyle}
                                    labelStyle={customLabelStyle}
                                    itemStyle={customItemStyle}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="center" 
                                    height={35} 
                                    iconType="circle" 
                                    onClick={handleLegendClick}
                                    formatter={renderLegendText}
                                    wrapperStyle={{ 
                                        top: -10, 
                                        left: 0, 
                                        paddingBottom: "5px",
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }} 
                                />
                                <Bar yAxisId="left" dataKey="receitas" fill="#22c55e" name="Receitas" radius={[4, 4, 0, 0]} hide={!visibleSeries.receitas} />
                                <Bar yAxisId="left" dataKey="despesas" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} hide={!visibleSeries.despesas} />
                                <Bar yAxisId="left" dataKey="investimentos" fill="#3b82f6" name="Investimentos" radius={[4, 4, 0, 0]} hide={!visibleSeries.investimentos} />
                                <Line yAxisId="left" type="monotone" dataKey="saldo" stroke="#4f46e5" strokeWidth={4} name="Saldo Acumulado" dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 8 }} hide={!visibleSeries.saldo} />
                            </ComposedChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-center">
                            <p className="text-[10px] text-gray-400 font-medium italic">* Clique nos itens da legenda acima para ocultar ou exibir as séries no gráfico.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const formatShortCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
}

export default Projection;
