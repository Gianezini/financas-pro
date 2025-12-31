
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Transaction, PaymentMethod } from '../types';
import { TransactionType } from '../types';
import { useFinance } from '../context/FinanceContext';
import { TrashIcon, PlusIcon, SearchIcon, iconComponents, ListIcon, CheckIcon, StarIcon, ArrowLeftIcon } from '../constants';
import { CategoriesModal } from './CategoriesManager';
import { PaymentMethodsModal } from './PaymentMethodsManager';

export const RecurringUpdateModal = ({ onConfirmSingle, onConfirmFuture, onCancel }: { onConfirmSingle: () => void, onConfirmFuture: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[140] flex justify-center items-start pt-24 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Transação Recorrente</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Você alterou uma transação recorrente. Deseja aplicar esta alteração somente a este lançamento ou a este e a todos os futuros?
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500">
                    Cancelar
                </button>
                <button onClick={onConfirmSingle} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                    Somente Este
                </button>
                <button onClick={onConfirmFuture} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
                    Este e os Futuros
                </button>
            </div>
        </div>
    </div>
);

const CheckboxButton = ({ label, checked, onChange, activeColorClass, checkedBgClass, iconColorClass }: { label: string, checked: boolean, onChange: (val: boolean) => void, activeColorClass: string, checkedBgClass: string, iconColorClass: string }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex items-center justify-center gap-2.5 px-3 py-3 rounded-2xl border-2 transition-all flex-1 min-w-0 ${
            checked 
            ? `${activeColorClass} ${checkedBgClass} border-current shadow-sm` 
            : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
        }`}
    >
        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
            checked ? `${iconColorClass} border-transparent shadow-sm` : 'border-gray-300 dark:border-gray-600 bg-transparent'
        }`}>
            <CheckIcon className={`w-3.5 h-3.5 stroke-[4px] transition-all ${
                checked ? 'text-white scale-100' : 'text-gray-300 dark:text-gray-600 scale-90 opacity-40'
            }`} />
        </div>
        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight whitespace-normal break-words text-center flex-1 ${
            checked ? 'text-current' : 'text-gray-500 dark:text-gray-400'
        }`}>
            {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
        </span>
    </button>
);

interface TransactionFormProps {
    onSubmit: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    onClose: () => void;
    initialData?: Partial<Transaction>;
    onDeleteRequest: (transaction: Transaction) => void;
}

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onClose, initialData, onDeleteRequest }) => {
    const { categories, paymentMethods, cardClosingDay, showNotification, transactions, addTransaction } = useFinance();
    const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.Despesa);
    const [amount, setAmount] = useState(initialData?.amount?.toFixed(2) || '0.00');
    const [description, setDescription] = useState(initialData?.description || '');
    
    const getDefaultCategoryId = () => {
        if (initialData?.categoryId) return initialData.categoryId;
        if (type === TransactionType.Investimento) {
             const inv = categories.find(c => c.name.toLowerCase() === 'investimentos' || c.id === 'investments');
             return inv?.id || categories[0]?.id;
        }
        return categories.find(c => c.id === 'food')?.id || categories[0]?.id;
    };

    const [categoryId, setCategoryId] = useState(getDefaultCategoryId());
    const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : getLocalDateString());
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'PIX');
    
    const [categorySearch, setCategorySearch] = useState('');
    const [isCategoryListOpen, setIsCategoryListOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    const [paymentSearch, setPaymentSearch] = useState('');
    const [isPaymentListOpen, setIsPaymentListOpen] = useState(false);
    const [isPaymentManagerOpen, setIsPaymentManagerOpen] = useState(false);
    const paymentDropdownRef = useRef<HTMLDivElement>(null);

    const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
    const [frequency, setFrequency] = useState<'diaria' | 'semanal' | 'mensal'>(initialData?.frequency || 'mensal');
    const [endDate, setEndDate] = useState(initialData?.endDate ? initialData.endDate.split('T')[0] : '');
    const [isCardBillPayment, setIsCardBillPayment] = useState(initialData?.isCardBillPayment || false);
    const [isInvestmentWithdrawal, setIsInvestmentWithdrawal] = useState(initialData?.isInvestmentWithdrawal || false);
    
    const [billingCycleMessage, setBillingCycleMessage] = useState<{ text: string, color: string } | null>(null);

    // --- LÓGICA DE CONCILIAÇÃO DE FATURA ATUALIZADA ---
    const billAnalysis = useMemo(() => {
        if (!isCardBillPayment) return null;

        const paymentDate = new Date(date + 'T12:00:00');
        const paymentDay = paymentDate.getDate();
        
        let targetMonth = paymentDate.getMonth();
        let targetYear = paymentDate.getFullYear();

        // NOVA LÓGICA: Se o pagamento for feito ANTES do dia de fechamento, 
        // entende-se que é o pagamento do vencimento da fatura do mês anterior.
        if (paymentDay < cardClosingDay) {
            const tempDate = new Date(targetYear, targetMonth - 1, 1);
            targetMonth = tempDate.getMonth();
            targetYear = tempDate.getFullYear();
        }

        const currentMonthClosing = new Date(targetYear, targetMonth, cardClosingDay, 0, 0, 0);
        const prevMonthClosing = new Date(targetYear, targetMonth - 1, cardClosingDay, 0, 0, 0);

        const cycleTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return t.type === TransactionType.Despesa && 
                   t.paymentMethod === 'Cartão de Crédito' && 
                   d >= prevMonthClosing && 
                   d < currentMonthClosing;
        });

        const sum = cycleTransactions.reduce((acc, t) => acc + t.amount, 0);
        const currentInput = parseFloat(amount);
        const diff = currentInput - sum;

        return { 
            sum, 
            diff, 
            count: cycleTransactions.length,
            startDate: prevMonthClosing,
            endDate: new Date(currentMonthClosing.getTime() - 1000), // Segundo anterior ao fechamento
            isMatch: Math.abs(diff) < 0.01,
            isHigher: diff > 0.01,
            isLower: diff < -0.01
        };
    }, [isCardBillPayment, amount, date, transactions, cardClosingDay]);

    const handleCreateAdjustment = async () => {
        if (!billAnalysis || !billAnalysis.isHigher) return;

        const bankFeesCat = categories.find(c => c.id === 'bank_fees' || c.name.toLowerCase().includes('taxas bancárias')) || 
                           categories.find(c => c.id === 'others' || c.name.toLowerCase().includes('outros')) || 
                           categories[0];
        
        const adjustment = {
            type: TransactionType.Despesa,
            description: `Ajuste Fatura (Taxas/Anuidade)`,
            amount: billAnalysis.diff,
            categoryId: bankFeesCat.id,
            date: new Date().toISOString(), 
            paymentMethod: paymentMethod, 
            isCardBillPayment: false
        };

        await addTransaction(adjustment);
        showNotification(`Ajuste de ${formatCurrency(billAnalysis.diff)} registrado como despesa.`, 'success');
    };

    const paymentOptions = useMemo(() => {
        if (!paymentSearch.trim()) return paymentMethods;
        return paymentMethods.filter(opt => opt.name.toLowerCase().includes(paymentSearch.toLowerCase()));
    }, [paymentMethods, paymentSearch]);

    const filteredCategories = useMemo(() => {
        let list = categories;
        if (type === TransactionType.Investimento) {
            list = categories.filter(c => c.name.toLowerCase() === 'investimentos' || c.id === 'investments');
        } 
        if (!categorySearch.trim()) return list;
        return list.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
    }, [categories, type, categorySearch]);

    const selectedCategory = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);
    const selectedPaymentMethod = useMemo(() => paymentMethods.find(pm => pm.name === paymentMethod), [paymentMethods, paymentMethod]);

    useEffect(() => {
        if (type === TransactionType.Investimento) {
            const invCat = categories.find(c => c.name.toLowerCase() === 'investimentos' || c.id === 'investments');
            if (invCat) setCategoryId(invCat.id);
        }
    }, [type, categories]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryListOpen(false);
            }
            if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target as Node)) {
                setIsPaymentListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (type !== TransactionType.Investimento && !paymentMethods.some(pm => pm.name === paymentMethod)) {
            if (paymentMethods.length > 0) setPaymentMethod(paymentMethods[0].name);
        }
    }, [type, paymentMethod, paymentMethods]);

    useEffect(() => {
        if (type !== TransactionType.Despesa) setIsCardBillPayment(false);
        if (type !== TransactionType.Investimento) setIsInvestmentWithdrawal(false);
    }, [type]);
    
    useEffect(() => {
        if (paymentMethod === 'Cartão de Crédito' && date && type === TransactionType.Despesa) {
            const transactionDate = new Date(date + 'T00:00:00');
            const transactionDay = transactionDate.getDate();
            if (transactionDay < cardClosingDay) {
                setBillingCycleMessage({ text: 'Esse lançamento será considerado na fatura do mês atual.', color: 'text-red-500' });
            } else {
                setBillingCycleMessage({ text: 'Esse lançamento será considerado na fatura do mês seguinte.', color: 'text-blue-500' });
            }
        } else {
            setBillingCycleMessage(null);
        }
    }, [paymentMethod, date, cardClosingDay, type]);

    useEffect(() => {
        if (isCardBillPayment) {
            const billCat = categories.find(c => c.id === 'card_bill' || c.name.toLowerCase() === 'fatura do cartão') ||
                           categories.find(c => c.id === 'others' || c.name.toLowerCase().includes('outros'));
            
            if (billCat) setCategoryId(billCat.id);
            if (!description || description === 'Pagamento Fatura Cartão') {
                setDescription('Pagamento Fatura Cartão');
            }
        }
    }, [isCardBillPayment, categories]);
    

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const numericValue = Number(value) / 100;
        setAmount(numericValue.toFixed(2));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if(!parsedAmount || parsedAmount <= 0 || !description || (isRecurring && !endDate)) {
            showNotification('Preencha os campos obrigatórios corretamente.', 'error');
            return;
        }

        const now = new Date();
        const currentTimeStr = now.toTimeString().split(' ')[0]; 
        const finalDate = new Date(`${date}T${currentTimeStr}`);
        
        const transactionData = {
            type, 
            amount: parsedAmount, 
            description, 
            categoryId,
            date: finalDate.toISOString(),
            paymentMethod: type === TransactionType.Investimento ? 'N/A' : paymentMethod,
            isRecurring, isCardBillPayment, isInvestmentWithdrawal,
            frequency: isRecurring ? frequency : undefined,
            endDate: isRecurring ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
        };

        if (initialData?.id) {
            onSubmit({ ...transactionData, id: initialData.id, recurringId: initialData.recurringId });
        } else {
            onSubmit(transactionData);
        }
    };

    const handleDelete = () => {
        if (initialData) onDeleteRequest(initialData as Transaction);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start pt-12 sm:pt-24 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{initialData?.id ? 'Editar transação' : 'Novo lançamento'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 pr-2">
                    <div>
                        <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setType(TransactionType.Despesa)} className={`flex-1 px-4 py-2 text-[10px] font-bold border border-gray-200 rounded-l-md uppercase transition-all ${type === TransactionType.Despesa ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Despesa</button>
                            <button type="button" onClick={() => setType(TransactionType.Receita)} className={`flex-1 px-4 py-2 text-[10px] font-bold border border-gray-200 uppercase transition-all ${type === TransactionType.Receita ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Receita</button>
                            <button type="button" onClick={() => setType(TransactionType.Investimento)} className={`flex-1 px-4 py-2 text-[10px] font-bold border border-gray-200 rounded-r-md uppercase transition-all ${type === TransactionType.Investimento ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Investimento</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} disabled={isCardBillPayment} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 font-semibold" required />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm font-bold">R$</span>
                                </div>
                                <input 
                                    type="tel" 
                                    id="amount" 
                                    value={formatToBRL(Number(amount))} 
                                    onChange={handleAmountChange} 
                                    className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg" 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{isRecurring ? 'Data de início' : 'Data'}</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>

                    {isCardBillPayment && billAnalysis && (
                        <div className={`p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300 border ${
                            billAnalysis.isLower ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                            billAnalysis.isMatch ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                            'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <StarIcon className={`w-4 h-4 ${billAnalysis.isLower ? 'text-red-500' : billAnalysis.isMatch ? 'text-green-500' : 'text-orange-500'}`} />
                                <h4 className={`text-xs font-bold uppercase ${billAnalysis.isLower ? 'text-red-500' : billAnalysis.isMatch ? 'text-green-500' : 'text-orange-500'}`}>
                                    {billAnalysis.isLower ? 'Inconsistência Detectada' : 'Conciliação de Ciclo'}
                                </h4>
                            </div>
                            
                            <div className="mb-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-1">Período de compras:</p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 font-semibold bg-white/40 dark:bg-black/10 py-1 px-2 rounded-lg border border-gray-200/50 dark:border-white/5">
                                    {billAnalysis.startDate.toLocaleDateString('pt-BR')} até {billAnalysis.endDate.toLocaleDateString('pt-BR')}
                                </p>
                            </div>

                            <div className="flex justify-between text-xs mb-3">
                                <span className="text-gray-500 dark:text-gray-400">Total somado no ciclo:</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(billAnalysis.sum)}</span>
                            </div>

                            {billAnalysis.isHigher && (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-orange-700 dark:text-orange-400 leading-tight">
                                        Identificamos uma diferença de <strong>{formatCurrency(billAnalysis.diff)}</strong> (taxas, anuidade ou IOF).
                                    </p>
                                    <button 
                                        type="button" 
                                        onClick={handleCreateAdjustment}
                                        className="w-full py-2 bg-orange-500 text-white rounded-xl text-[10px] font-bold shadow-md hover:bg-orange-600 active:scale-95 transition-all"
                                    >
                                        LANÇAR DIFERENÇA COMO TAXAS
                                    </button>
                                </div>
                            )}

                            {billAnalysis.isLower && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-red-700 dark:text-red-400 leading-tight font-medium">
                                        O valor pago é <strong>menor</strong> que o registrado no sistema. 
                                        Isso pode ser um erro de digitação anterior ou um pagamento parcial.
                                    </p>
                                    <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                        <p className="text-[9px] text-red-600 dark:text-red-300 font-bold uppercase tracking-tighter">Dica:</p>
                                        <p className="text-[9px] text-gray-600 dark:text-gray-400 leading-tight">
                                            Revise seus lançamentos de "Cartão de Crédito" no <strong>Extrato</strong> deste ciclo e corrija o valor que estiver incorreto.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {billAnalysis.isMatch && (
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                                    <CheckIcon className="w-3 h-3" /> Valor da fatura bate 100% com os gastos!
                                </p>
                            )}
                        </div>
                    )}

                    {!isCardBillPayment && (
                        <div className="relative animate-in fade-in duration-300" ref={categoryDropdownRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <button 
                                        type="button"
                                        onClick={() => setIsCategoryListOpen(!isCategoryListOpen)}
                                        disabled={type === TransactionType.Investimento}
                                        className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-700/50 ${isCategoryListOpen ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedCategory && (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    {selectedCategory.customIcon ? (
                                                        <img src={selectedCategory.customIcon} className="w-full h-full object-contain" alt="" />
                                                    ) : (
                                                        React.createElement(iconComponents[selectedCategory.icon] || iconComponents.DotsHorizontalIcon, { 
                                                            className: "w-full h-full",
                                                            style: { color: selectedCategory.textColor }
                                                        })
                                                    )}
                                                </div>
                                            )}
                                            <span className="font-semibold text-sm">{selectedCategory?.name || 'Selecione...'}</span>
                                        </div>
                                        <svg className={`w-4 h-4 transition-transform ${isCategoryListOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    {isCategoryListOpen && (
                                        <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        autoFocus
                                                        placeholder="Buscar categoria..."
                                                        value={categorySearch}
                                                        onChange={(e) => setCategorySearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                                                    />
                                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                                                {filteredCategories.map(cat => {
                                                    const Icon = iconComponents[cat.icon] || iconComponents.DotsHorizontalIcon;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setCategoryId(cat.id);
                                                                setIsCategoryListOpen(false);
                                                                setCategorySearch('');
                                                            } }
                                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${cat.id === categoryId ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                        >
                                                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                                                {cat.customIcon ? (
                                                                    <img src={cat.customIcon} className="w-full h-full object-contain" alt="" />
                                                                ) : (
                                                                    <Icon className="w-full h-full" style={{ color: cat.textColor }} />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold">{cat.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => setIsCategoryManagerOpen(true)}
                                    className="p-2.5 bg-accent text-white rounded-md hover:bg-accent-light transition-all shadow-sm"
                                    title="Gerenciar categorias"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {type !== TransactionType.Investimento && (
                        <div className="relative" ref={paymentDropdownRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{type === TransactionType.Despesa ? 'Método de pagamento' : 'Método de recebimento'}</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <button 
                                        type="button"
                                        onClick={() => setIsPaymentListOpen(!isPaymentListOpen)}
                                        className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left ${isPaymentListOpen ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedPaymentMethod ? (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    {selectedPaymentMethod.customIcon ? (
                                                        <img src={selectedPaymentMethod.customIcon} className="w-full h-full object-contain" alt="" />
                                                    ) : (
                                                        React.createElement(iconComponents[selectedPaymentMethod.icon] || iconComponents.DotsHorizontalIcon, { 
                                                            className: "w-full h-full",
                                                            style: { color: selectedPaymentMethod.textColor }
                                                        })
                                                    )}
                                                </div>
                                            ) : <ListIcon className="w-4 h-4 text-gray-400" />}
                                            <span className="font-semibold text-sm">{paymentMethod}</span>
                                        </div>
                                        <svg className={`w-4 h-4 transition-transform ${isPaymentListOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isPaymentListOpen && (
                                        <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        autoFocus
                                                        placeholder="Buscar método..."
                                                        value={paymentSearch}
                                                        onChange={(e) => setPaymentSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                                                    />
                                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                                                {paymentOptions.map(opt => {
                                                    const Icon = iconComponents[opt.icon] || iconComponents.DotsHorizontalIcon;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setPaymentMethod(opt.name);
                                                                setIsPaymentListOpen(false);
                                                                setPaymentSearch('');
                                                            }}
                                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${opt.name === paymentMethod ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                        >
                                                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                                                {opt.customIcon ? (
                                                                    <img src={opt.customIcon} className="w-full h-full object-contain" alt="" />
                                                                ) : (
                                                                    <Icon className="w-full h-full" style={{ color: opt.textColor }} />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold">{opt.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsPaymentManagerOpen(true)}
                                    className="p-2.5 bg-accent text-white rounded-md hover:bg-accent-light transition-all shadow-sm"
                                    title="Gerenciar métodos de pagamento"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {billingCycleMessage && (
                                <p className={`text-xs mt-1 font-semibold ${billingCycleMessage.color}`}>{billingCycleMessage.text}</p>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                        {type === TransactionType.Despesa && (
                            <>
                                <CheckboxButton 
                                    label="Fatura do Cartão" 
                                    checked={isCardBillPayment} 
                                    onChange={setIsCardBillPayment}
                                    activeColorClass="text-orange-600 border-orange-500"
                                    checkedBgClass="bg-orange-500/10 dark:bg-orange-500/5"
                                    iconColorClass="bg-orange-500"
                                />
                                <CheckboxButton 
                                    label="Transação recorrente" 
                                    checked={isRecurring} 
                                    onChange={setIsRecurring}
                                    activeColorClass="text-blue-600 border-blue-500"
                                    checkedBgClass="bg-blue-500/10 dark:bg-blue-500/5"
                                    iconColorClass="bg-blue-500"
                                />
                            </>
                        )}

                        {type === TransactionType.Receita && (
                            <CheckboxButton 
                                label="Transação recorrente" 
                                checked={isRecurring} 
                                onChange={setIsRecurring}
                                activeColorClass="text-blue-600 border-blue-500"
                                checkedBgClass="bg-blue-500/10 dark:bg-blue-500/5"
                                iconColorClass="bg-blue-500"
                            />
                        )}

                        {type === TransactionType.Investimento && (
                            <>
                                <CheckboxButton 
                                    label="Retirada" 
                                    checked={isInvestmentWithdrawal} 
                                    onChange={setIsInvestmentWithdrawal}
                                    activeColorClass="text-red-600 border-red-500"
                                    checkedBgClass="bg-red-500/10 dark:bg-red-500/5"
                                    iconColorClass="bg-red-500"
                                />
                                <CheckboxButton 
                                    label="Transação recorrente" 
                                    checked={isRecurring} 
                                    onChange={setIsRecurring}
                                    activeColorClass="text-blue-600 border-blue-500"
                                    checkedBgClass="bg-blue-500/10 dark:bg-blue-500/5"
                                    iconColorClass="bg-blue-500"
                                />
                            </>
                        )}
                    </div>

                    {isRecurring && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label htmlFor="frequency" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Frequência</label>
                                    <select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value as any)} className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-xl font-semibold">
                                        <option value="diaria">Diária</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="mensal">Mensal</option>
                                    </select>
                                </div>
                                <div className="w-1/2">
                                    <label htmlFor="endDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data final</label>
                                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-semibold text-sm" required={isRecurring} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700 mt-2">
                        <div>
                            {initialData?.id && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="p-3 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all shadow-sm"
                                    aria-label="Excluir transação"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-none rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancelar</button>
                            <button type="submit" onClick={handleSubmit} className="inline-flex justify-center px-8 py-3 text-sm font-bold text-white bg-blue-600 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]">Salvar</button>
                        </div>
                    </div>
                </form>

                {isCategoryManagerOpen && (
                    <CategoriesModal onClose={() => setIsCategoryManagerOpen(false)} />
                )}
                {isPaymentManagerOpen && (
                    <PaymentMethodsModal onClose={() => setIsPaymentManagerOpen(false)} />
                )}
            </div>
        </div>
    );
};

export default TransactionForm;
