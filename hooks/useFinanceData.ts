
// Add React import to fix 'Cannot find namespace React' error for React.ReactNode
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TransactionType, type Transaction, type Goal, type GoalTransaction, type AppNotification, type AppConfirmation, type User, type PaymentMethod, type Category } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PAYMENT_METHODS } from '../constants';
import { supabase } from '../services/supabase';

export const useFinanceData = (currentUser: User | null) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [goalTransactions, setGoalTransactions] = useState<GoalTransaction[]>([]);
    const [cardClosingDay, setCardClosingDayState] = useState<number>(25);
    const [isLoading, setIsLoading] = useState(false);
    
    const [initialBalance, setInitialBalance] = useState<number>(0);
    const [initialInvestment, setInitialInvestment] = useState<number>(0);

    const [notification, setNotification] = useState<AppNotification | null>(null);
    const [confirmation, setConfirmation] = useState<AppConfirmation | null>(null);

    const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
    const [transactionInitialData, setTransactionInitialData] = useState<Partial<Transaction> | undefined>(undefined);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const cleanMessage = typeof message === 'object' ? JSON.stringify(message) : String(message);
        setNotification({ message: cleanMessage, type });
        setTimeout(() => setNotification(null), 3500);
    }, []);

    const fetchAllData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const results = await Promise.allSettled([
                supabase.from('categories').select('*').eq('user_id', currentUser.id).order('name'),
                supabase.from('payment_methods').select('*').eq('user_id', currentUser.id).order('name'),
                supabase.from('transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }),
                supabase.from('goals').select('*').eq('user_id', currentUser.id).order('deadline'),
                supabase.from('goal_transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }),
                supabase.from('user_settings').select('*').eq('user_id', currentUser.id).maybeSingle()
            ]);

            const mapResult = (idx: number) => {
                const res = results[idx];
                if (res.status === 'fulfilled') return res.value;
                return { data: null, error: res.reason };
            };

            const { data: cats, error: catsErr } = mapResult(0);
            const { data: pms, error: pmsErr } = mapResult(1);
            const { data: trans, error: transErr } = mapResult(2);
            const { data: gS, error: gsErr } = mapResult(3);
            const { data: gTrans, error: gtErr } = mapResult(4);
            const { data: settings, error: setErr } = mapResult(5);

            if (settings) {
                setInitialBalance(parseFloat(settings.initial_balance) || 0);
                setInitialInvestment(parseFloat(settings.initial_investment) || 0);
                setCardClosingDayState(settings.card_closing_day || 25);
            }

            const mapCategory = (c: any): Category => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                color: c.color,
                textColor: c.text_color,
                customIcon: c.custom_icon
            });

            const mapPaymentMethod = (p: any): PaymentMethod => ({
                id: p.id,
                name: p.name,
                icon: p.icon,
                color: p.color,
                textColor: p.text_color,
                customIcon: p.custom_icon
            });

            const mapTransaction = (t: any): Transaction => ({
                id: t.id,
                type: t.type,
                description: t.description,
                amount: parseFloat(t.amount),
                categoryId: t.category_id,
                date: t.date,
                paymentMethod: t.payment_method,
                isRecurring: t.is_recurring,
                frequency: t.frequency,
                endDate: t.end_date,
                recurringId: t.recurring_id,
                isCardBillPayment: t.is_card_bill_payment,
                isInvestmentWithdrawal: t.is_investment_withdrawal
            });

            if (cats && cats.length === 0 && !catsErr) {
                const initialCats = INITIAL_CATEGORIES.map(c => ({ 
                    name: c.name, 
                    icon: c.icon, 
                    color: c.color,
                    text_color: c.textColor,
                    user_id: currentUser.id 
                }));
                const { data: insertedCats } = await supabase.from('categories').insert(initialCats).select();
                setCategories((insertedCats || []).map(mapCategory));
            } else if (cats) {
                setCategories((cats || []).map(mapCategory));
            }

            if (pms && pms.length === 0 && !pmsErr) {
                const initialPms = INITIAL_PAYMENT_METHODS.map(p => ({ 
                    name: p.name, 
                    icon: p.icon, 
                    color: p.color,
                    text_color: p.textColor,
                    user_id: currentUser.id 
                }));
                const { data: insertedPms } = await supabase.from('payment_methods').insert(initialPms).select();
                setPaymentMethods((insertedPms || []).map(mapPaymentMethod));
            } else if (pms) {
                setPaymentMethods((pms || []).map(mapPaymentMethod));
            }

            if (trans) setTransactions((trans || []).map(mapTransaction));
            
            if (gS) {
                const mappedGoals = (gS || []).map(g => ({
                    id: g.id,
                    name: g.name,
                    targetAmount: parseFloat(g.target_amount),
                    currentAmount: parseFloat(g.current_amount),
                    deadline: g.deadline,
                    creationDate: g.creation_date,
                    icon: g.icon,
                    customIcon: g.custom_icon,
                    isAiGenerated: g.is_ai_generated,
                    aiBreakdown: g.ai_breakdown,
                    aiSources: g.ai_sources || []
                }));
                setGoals(mappedGoals);
            }
            
            if (gTrans) {
                setGoalTransactions((gTrans || []).map(gt => ({
                    id: gt.id,
                    goalId: gt.goal_id,
                    amount: parseFloat(gt.amount),
                    date: gt.date,
                    description: gt.description
                })));
            }
        } catch (err: any) {
            console.error("Erro fatal ao carregar dados:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        if (!currentUser) return;
        try {
            const payloads = [];
            const recurringId = transaction.isRecurring ? crypto.randomUUID() : undefined;
            const baseData = {
                type: transaction.type,
                description: transaction.description,
                amount: transaction.amount,
                category_id: transaction.categoryId,
                payment_method: transaction.paymentMethod,
                is_card_bill_payment: transaction.isCardBillPayment || false,
                is_investment_withdrawal: transaction.isInvestmentWithdrawal || false,
                user_id: currentUser.id
            };
            if (transaction.isRecurring && transaction.endDate) {
                let currentDate = new Date(transaction.date);
                const endDate = new Date(transaction.endDate);
                while (currentDate <= endDate) {
                    payloads.push({
                        ...baseData,
                        date: currentDate.toISOString(),
                        is_recurring: true,
                        recurring_id: recurringId,
                        end_date: transaction.endDate,
                        frequency: transaction.frequency,
                    });
                    if (transaction.frequency === 'diaria') currentDate.setDate(currentDate.getDate() + 1);
                    else if (transaction.frequency === 'semanal') currentDate.setDate(currentDate.getDate() + 7);
                    else if (transaction.frequency === 'mensal') currentDate.setMonth(currentDate.getMonth() + 1);
                    else break;
                    if (payloads.length > 500) break; 
                }
            } else {
                payloads.push({ ...baseData, date: transaction.date, is_recurring: false });
            }
            const { error } = await supabase.from('transactions').insert(payloads);
            if (error) throw error;
            await fetchAllData();
            showNotification(transaction.isRecurring ? 'Recorrência registrada!' : 'Lançamento registrado!', 'success');
        } catch (err: any) {
            showNotification(`Erro: ${err.message || JSON.stringify(err)}`, 'error');
        }
    };

    const updateTransaction = async (updatedTransaction: Transaction, applyToFuture: boolean = false) => {
        if (!currentUser) return;
        try {
            const massPayload = {
                type: updatedTransaction.type,
                description: updatedTransaction.description,
                amount: updatedTransaction.amount,
                category_id: updatedTransaction.categoryId,
                payment_method: updatedTransaction.paymentMethod,
                is_card_bill_payment: updatedTransaction.isCardBillPayment || false,
                is_recurring: updatedTransaction.isRecurring || false,
                is_investment_withdrawal: updatedTransaction.isInvestmentWithdrawal || false,
                frequency: updatedTransaction.frequency,
                end_date: updatedTransaction.endDate
            };
            if (applyToFuture && updatedTransaction.recurringId) {
                const original = transactions.find(t => t.id === updatedTransaction.id);
                const originalDate = original?.date || updatedTransaction.date;
                await supabase.from('transactions').update({ ...massPayload, date: updatedTransaction.date }).eq('id', updatedTransaction.id);
                await supabase.from('transactions').update(massPayload).eq('recurring_id', updatedTransaction.recurringId).neq('id', updatedTransaction.id).gte('date', originalDate);
            } else {
                const { error } = await supabase.from('transactions').update({ ...massPayload, date: updatedTransaction.date }).eq('id', updatedTransaction.id);
                if (error) throw error;
            }
            await fetchAllData();
            showNotification('Lançamento atualizado');
        } catch (err: any) {
            showNotification(`Erro: ${err.message || JSON.stringify(err)}`, 'error');
        }
    };

    const totalBalance = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayDay = now.getDate();

        // Determina a PRÓXIMA data de fechamento baseada no dia de hoje
        const nextClosingDate = todayDay < cardClosingDay 
            ? new Date(year, month, cardClosingDay, 0, 0, 0)
            : new Date(year, month + 1, cardClosingDay, 0, 0, 0);

        const transSum = transactions
            .filter(t => new Date(t.date) <= now)
            .reduce((acc, t) => {
                const tDate = new Date(t.date);
                if (t.type === TransactionType.Receita) return acc + t.amount;
                if (t.type === TransactionType.Despesa) {
                    if (t.paymentMethod === 'Cartão de Crédito') {
                        // Se a compra foi feita hoje ou depois do fechamento que abre o próximo ciclo, 
                        // ela não é descontada do saldo "disponível" imediato.
                        if (tDate >= nextClosingDate) return acc;
                        return acc - t.amount;
                    }
                    if (t.isCardBillPayment) return acc;
                    return acc - t.amount;
                }
                if (t.type === TransactionType.Investimento) {
                    return t.isInvestmentWithdrawal ? acc + t.amount : acc - t.amount;
                }
                return acc;
            }, 0);
        return initialBalance + transSum;
    }, [transactions, initialBalance, cardClosingDay]);

    const addGoal = async (goal: Omit<Goal, 'id' | 'currentAmount' | 'creationDate'>) => {
        if (!currentUser) return;
        try {
            const sanitizedAiSources = Array.isArray(goal.aiSources) 
                ? goal.aiSources.map(s => (s && typeof s === 'object') ? JSON.parse(JSON.stringify(s)) : s)
                : [];

            const dbPayload: any = {
                name: goal.name,
                target_amount: goal.targetAmount,
                current_amount: 0,
                deadline: goal.deadline,
                creation_date: new Date().toISOString(),
                icon: goal.icon,
                is_ai_generated: goal.isAiGenerated || false,
                user_id: currentUser.id,
                ai_sources: sanitizedAiSources,
                ai_breakdown: goal.aiBreakdown
            };
            if (goal.customIcon) dbPayload.custom_icon = goal.customIcon;
            
            let { error } = await supabase.from('goals').insert([dbPayload]);
            
            if (error && error.message?.includes('ai_sources')) {
                delete dbPayload.ai_sources;
                delete dbPayload.ai_breakdown;
                const retry = await supabase.from('goals').insert([dbPayload]);
                error = retry.error;
            }

            if (error) throw error;
            
            await fetchAllData();
            if (!error) showNotification('Meta criada!', 'success');
        } catch (err: any) {
            console.error("Erro ao criar meta:", err);
            const errorMessage = err.message || JSON.stringify(err);
            showNotification('Erro ao criar meta: ' + errorMessage, 'error');
            throw err;
        }
    };

    const updateGoal = async (goal: Goal) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('goals').update({
                name: goal.name,
                target_amount: goal.targetAmount,
                deadline: goal.deadline,
                icon: goal.icon,
                custom_icon: goal.customIcon || null
            }).eq('id', goal.id);
            
            if (error) throw error;
            await fetchAllData();
            showNotification('Meta atualizada!');
        } catch (err: any) {
            showNotification('Erro ao atualizar meta: ' + (err.message || JSON.stringify(err)), 'error');
            throw err;
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            await fetchAllData();
            showNotification('Meta excluída');
        } catch (err: any) {
            showNotification('Erro ao excluir meta: ' + (err.message || JSON.stringify(err)), 'error');
        }
    };

    const addValueToGoal = async (goalId: string, amount: number, description: string) => {
        if (!currentUser) return;
        try {
            const { error: tErr } = await supabase.from('goal_transactions').insert([{
                goal_id: goalId,
                amount,
                date: new Date().toISOString(),
                description,
                user_id: currentUser.id
            }]);
            if (tErr) throw tErr;

            const goal = goals.find(g => g.id === goalId);
            if (goal) {
                const newAmount = goal.currentAmount + amount;
                const { error: uErr } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId);
                if (uErr) throw uErr;
            }
            await fetchAllData();
        } catch (err: any) {
            showNotification('Erro ao movimentar meta: ' + (err.message || JSON.stringify(err)), 'error');
        }
    };

    return {
        transactions, goals, budgets: [], categories, paymentMethods, goalTransactions, cardClosingDay,
        initialBalance, initialInvestment, totalBalance, isLoading, notification, confirmation,
        isTransactionFormOpen, transactionInitialData, transactionToDelete,
        isGoalFormOpen, goalToEdit,
        showNotification, resetAllData: async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                await supabase.from('goal_transactions').delete().eq('user_id', currentUser.id);
                await supabase.from('goals').delete().eq('user_id', currentUser.id);
                await supabase.from('transactions').delete().eq('user_id', currentUser.id);
                await supabase.from('categories').delete().eq('user_id', currentUser.id);
                await supabase.from('payment_methods').delete().eq('user_id', currentUser.id);
                await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
                await fetchAllData();
                showNotification('Plataforma resetada com sucesso!', 'success');
            } catch (err: any) {
                showNotification('Erro ao zerar informações: ' + (err.message || JSON.stringify(err)), 'error');
            } finally {
                setIsLoading(false);
            }
        }, 
        requestConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void, isDestructive = false, waitSeconds = 0) => {
            setConfirmation({ title, message, onConfirm, isDestructive, waitSeconds });
        }, 
        closeConfirmation: () => setConfirmation(null),
        addTransaction, updateTransaction, openTransactionForm: (data?: Partial<Transaction>) => {
            setTransactionInitialData(data);
            setIsTransactionFormOpen(true);
        }, 
        closeTransactionForm: () => {
            setIsTransactionFormOpen(false);
            setTransactionInitialData(undefined);
        }, 
        handleSaveTransaction: async (t: Omit<Transaction, 'id'> | Transaction) => {
            if ('id' in t) await updateTransaction(t as Transaction);
            else await addTransaction(t);
            setIsTransactionFormOpen(false);
        },
        requestDeleteTransaction: (t: Transaction) => setTransactionToDelete(t), 
        confirmDeleteTransaction: async (transaction?: Transaction, deleteAllFuture: boolean = false) => {
            const target = transaction || transactionToDelete;
            if (!target) return;
            try {
                if (deleteAllFuture && target.recurringId) {
                    await supabase.from('transactions').delete().eq('recurring_id', target.recurringId).gte('date', target.date);
                } else {
                    await supabase.from('transactions').delete().eq('id', target.id);
                }
                await fetchAllData();
                setTransactionToDelete(null);
                setIsTransactionFormOpen(false);
                showNotification('Lançamento excluído');
            } catch (err: any) {
                showNotification('Erro ao excluir: ' + (err.message || JSON.stringify(err)), 'error');
            }
        }, 
        cancelDeleteTransaction: () => setTransactionToDelete(null),
        addGoal, updateGoal, deleteGoal, addValueToGoal, 
        openGoalForm: (goal?: Goal) => {
            setGoalToEdit(goal || null);
            setIsGoalFormOpen(true);
        }, 
        closeGoalForm: () => {
            setIsGoalFormOpen(false);
            setGoalToEdit(null);
        },
        addCategory: async (cat: Omit<Category, 'id'>) => {
            if (!currentUser) return;
            await supabase.from('categories').insert([{ name: cat.name, icon: cat.icon, color: cat.color, text_color: cat.textColor, custom_icon: cat.customIcon, user_id: currentUser.id }]);
            await fetchAllData();
        }, 
        updateCategory: async (cat: Category) => {
            await supabase.from('categories').update({ name: cat.name, icon: cat.icon, color: cat.color, text_color: cat.textColor, custom_icon: cat.customIcon || null }).eq('id', cat.id);
            await fetchAllData();
        }, 
        deleteCategory: async (id: string) => {
            if (!currentUser) return;
            const fallback = categories.find(c => c.name.toLowerCase() === 'outro') || categories.find(c => c.id === 'others');
            if (fallback) {
                await supabase.from('transactions').update({ category_id: fallback.id }).eq('category_id', id);
            }
            await supabase.from('categories').delete().eq('id', id);
            await fetchAllData();
        },
        addPaymentMethod: async (pm: Omit<PaymentMethod, 'id'>) => {
            if (!currentUser) return;
            await supabase.from('payment_methods').insert([{ name: pm.name, icon: pm.icon, color: pm.color, text_color: pm.textColor, custom_icon: pm.customIcon, user_id: currentUser.id }]);
            await fetchAllData();
        }, 
        updatePaymentMethod: async (pm: PaymentMethod) => {
            await supabase.from('payment_methods').update({ name: pm.name, icon: pm.icon, color: pm.color, text_color: pm.textColor, custom_icon: pm.customIcon || null }).eq('id', pm.id);
            await fetchAllData();
        }, 
        deletePaymentMethod: async (id: string) => {
            if (!currentUser) return;
            const targetPm = paymentMethods.find(p => p.id === id);
            if (targetPm) {
                await supabase.from('transactions').update({ payment_method: 'Outro' }).eq('payment_method', targetPm.name);
            }
            await supabase.from('payment_methods').delete().eq('id', id);
            await fetchAllData();
        },
        setInitialBalances: async (balance: number, investment: number) => {
            if (!currentUser) return;
            await supabase.from('user_settings').upsert({ user_id: currentUser.id, initial_balance: balance, initial_investment: investment });
            setInitialBalance(balance);
            setInitialInvestment(investment);
            showNotification('Saldos iniciais atualizados!', 'success');
        },
        setCardClosingDay: async (day: number) => {
            if (!currentUser) return;
            setCardClosingDayState(day);
            await supabase.from('user_settings').upsert({ user_id: currentUser.id, card_closing_day: day });
            showNotification('Dia de fechamento atualizado!');
        }
    };
};
