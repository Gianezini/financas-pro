
import React, { useState, useEffect, useRef } from 'react';
import { Page, type ChatMessage, TransactionType, Transaction, User } from './types';
import { NAV_ITEMS, SunIcon, MoonIcon, UserIcon, PlusIcon, XIcon, PencilIcon, CameraIcon, TrashIcon, PhotoIcon } from './constants';
import { useFinanceData } from './hooks/useFinanceData';
import { FinanceContext } from './context/FinanceContext';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Budgets from './components/Budgets';
import Settings from './components/Settings';
import Chatbot from './components/Chatbot';
import Projection from './components/Projection';
import Login from './components/Login';
import TransactionForm, { RecurringUpdateModal } from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import CameraModal from './components/CameraModal';
import { extractReceiptInfo } from './services/geminiService';
import { supabase } from './services/supabase';

const NotificationToast = ({ message, type }: { message: string, type: 'success' | 'error' | 'info' }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] ${bgColor} text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold uppercase tracking-widest text-[10px] sm:text-xs animate-in slide-in-from-top-full duration-300 flex items-center gap-3 min-w-[280px] justify-center`}>
            {type === 'success' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            {type === 'error' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
            {message}
        </div>
    );
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel, isDestructive = false, waitSeconds = 0 }: { title: string, message: React.ReactNode, onConfirm: () => void, onCancel: () => void, isDestructive?: boolean, waitSeconds?: number }) => {
    const [timeLeft, setTimeLeft] = useState(waitSeconds);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] flex justify-center items-start pt-24 p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 sm:p-10 text-center animate-in zoom-in-95 duration-200">
                {isDestructive && (
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TrashIcon className="w-8 h-8" />
                    </div>
                )}
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white tracking-tight mb-3">{title}</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">{message}</div>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm} 
                        disabled={timeLeft > 0}
                        className={`w-full py-4 font-semibold text-white rounded-xl uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-accent hover:bg-accent-light shadow-accent/20'}`}
                    >
                        {timeLeft > 0 ? `Aguarde (${timeLeft}s)` : 'Confirmar'}
                    </button>
                    <button 
                        onClick={onCancel} 
                        className="w-full py-4 font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-none rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    
    const financeData = useFinanceData(currentUser);
    
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { sender: 'bot', text: 'Olá! Sou seu assistente financeiro. Como posso ajudar? Você pode me pedir para adicionar transações ou fazer perguntas sobre suas finanças.' }
    ]);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

    const [recurringAction, setRecurringAction] = useState<{ type: 'edit' | 'delete', transaction: Transaction, data?: any } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = window.localStorage.getItem('theme');
            return storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                if (session?.user) {
                    const user = {
                        id: session.user.id,
                        name: session.user.user_metadata?.name || 'Usuário',
                        email: session.user.email!,
                        photo: session.user.user_metadata?.photo_url || null
                    };
                    setCurrentUser(user);
                    localStorage.setItem('finpro_current_user', JSON.stringify(user));
                }
            } catch (err) {
                console.error("Erro ao verificar sessão:", err);
                const cached = localStorage.getItem('finpro_current_user');
                if (cached) {
                    try { setCurrentUser(JSON.parse(cached)); } catch (e) {}
                }
            } finally {
                setIsAppLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const user = {
                    id: session.user.id,
                    name: session.user.user_metadata?.name || 'Usuário',
                    email: session.user.email!,
                    photo: session.user.user_metadata?.photo_url || null
                };
                setCurrentUser(user);
                localStorage.setItem('finpro_current_user', JSON.stringify(user));
            } else {
                setCurrentUser(null);
                localStorage.removeItem('finpro_current_user');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('finpro_current_user', JSON.stringify(user));
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {}
        setCurrentUser(null);
        localStorage.removeItem('finpro_current_user');
        setCurrentPage(Page.Dashboard);
    };

    const processBase64Image = async (base64String: string, mimeType: string) => {
      setIsProcessingReceipt(true);
      try {
          const extractedData = await extractReceiptInfo(base64String, mimeType, financeData.categories);
          if (extractedData) {
              financeData.openTransactionForm({ ...extractedData, type: TransactionType.Despesa });
          } else {
              financeData.showNotification('Não foi possível extrair dados.', 'error');
          }
      } catch (error) {
          financeData.showNotification('Erro ao processar imagem.', 'error');
      } finally {
          setIsProcessingReceipt(false);
      }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              processBase64Image(base64, file.type);
          };
          reader.readAsDataURL(file);
      }
      if (event.target) event.target.value = '';
    };

    if (isAppLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-semibold animate-pulse">Iniciando Finanças Pro...</p>
            </div>
        );
    }

    if (!currentUser) return <Login onLogin={handleLogin} />;

    const renderPage = () => {
        switch (currentPage) {
            case Page.Dashboard: return <Dashboard />;
            case Page.Transactions: return <Transactions />;
            case Page.Reports: return <Reports theme={theme} />;
            case Page.Goals: return <Goals />;
            case Page.Budgets: return <Budgets />;
            case Page.Projection: return <Projection theme={theme} />;
            case Page.Settings: return <Settings currentUser={currentUser} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onLogout={handleLogout} />;
            default: return <Dashboard />;
        }
    };

    const onTransactionSubmit = async (t: any) => {
        if ('id' in t && t.recurringId) {
            setRecurringAction({ type: 'edit', transaction: t as Transaction, data: t });
        } else {
            await financeData.handleSaveTransaction(t);
        }
    };

    const onTransactionDeleteRequest = (t: Transaction) => {
        if (t.recurringId) {
            setRecurringAction({ type: 'delete', transaction: t });
        } else {
            financeData.requestDeleteTransaction(t);
        }
    };

    const onGoalSubmit = async (data: any) => {
        try {
            if (financeData.goalToEdit) {
                await financeData.updateGoal(data);
            } else {
                await financeData.addGoal(data);
            }
            financeData.closeGoalForm();
        } catch (err) {
            console.error("Falha ao salvar meta via formulário:", err);
        }
    };
    
    return (
        <FinanceContext.Provider value={{ financeData }}>
            <div className="flex h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
                {financeData.notification && <NotificationToast message={financeData.notification.message} type={financeData.notification.type} />}

                <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-dark-sidebar p-4 border-r border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-center px-2 pb-8 pt-4">
                        <img 
                            src="/Financas_pro.png" 
                            alt="Finanças Pro" 
                            className="w-40 h-auto object-contain" 
                        />
                    </div>
                    <nav className="flex-grow space-y-2">
                        {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-semibold transition-colors ${currentPage === page ? 'bg-accent text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                <Icon className="w-6 h-6" /><span>{label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {financeData.isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-dark-bg/50 z-[100] flex items-center justify-center backdrop-blur-sm">
                            <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {isProcessingReceipt && (
                        <div className="absolute inset-0 bg-black/60 z-[300] flex items-center justify-center backdrop-blur-md">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-16 h-16 border-4 border-white/20 border-t-accent rounded-full animate-spin"></div>
                                <div className="text-center">
                                    <h2 className="text-white text-xl font-black uppercase tracking-widest mb-2 animate-pulse">Lendo Recibo...</h2>
                                    <p className="text-white/60 text-xs font-medium uppercase tracking-tighter">A IA está processando os dados financeiros</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto pb-24 md:pb-0">{renderPage()}</div>
                </main>

                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around z-40 h-16">
                    {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${currentPage === page ? 'text-accent dark:text-accent-light' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Icon className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-semibold tracking-tight">{label}</span>
                        </button>
                    ))}
                </nav>

                {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} messages={chatMessages} setMessages={setChatMessages} financialData={financeData} />}
                {isCameraModalOpen && <CameraModal onCapture={(base64) => processBase64Image(base64, 'image/jpeg')} onClose={() => setIsCameraModalOpen(false)} />}
                
                {financeData.isTransactionFormOpen && <TransactionForm onSubmit={onTransactionSubmit} onClose={financeData.closeTransactionForm} initialData={financeData.transactionInitialData} onDeleteRequest={onTransactionDeleteRequest} />}
                {financeData.isGoalFormOpen && <GoalForm onSubmit={onGoalSubmit} onClose={financeData.closeGoalForm} initialData={financeData.goalToEdit} />}
                {financeData.confirmation && <ConfirmationModal title={financeData.confirmation.title} message={financeData.confirmation.message} isDestructive={financeData.confirmation.isDestructive} waitSeconds={financeData.confirmation.waitSeconds} onConfirm={() => { financeData.confirmation?.onConfirm(); financeData.closeConfirmation(); }} onCancel={financeData.closeConfirmation} />}
                {financeData.transactionToDelete && <ConfirmationModal title="Excluir Transação" message="Tem certeza?" isDestructive onConfirm={() => financeData.confirmDeleteTransaction(undefined, false)} onCancel={financeData.cancelDeleteTransaction} />}

                {recurringAction && (
                    <RecurringUpdateModal 
                        onCancel={() => setRecurringAction(null)}
                        onConfirmSingle={async () => {
                            if (recurringAction.type === 'edit') {
                                await financeData.updateTransaction(recurringAction.data as Transaction, false);
                                financeData.closeTransactionForm();
                            } else {
                                await financeData.confirmDeleteTransaction(recurringAction.transaction, false);
                            }
                            setRecurringAction(null);
                        }}
                        onConfirmFuture={async () => {
                            if (recurringAction.type === 'edit') {
                                await financeData.updateTransaction(recurringAction.data as Transaction, true);
                                financeData.closeTransactionForm();
                            } else {
                                await financeData.confirmDeleteTransaction(recurringAction.transaction, true);
                            }
                            setRecurringAction(null);
                        }}
                    />
                )}

                {!financeData.isTransactionFormOpen && !financeData.isGoalFormOpen && !isChatbotOpen && !isCameraModalOpen && (
                    <div className="fixed bottom-20 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-4 z-50">
                        {isFabMenuOpen && (
                            <div className="flex flex-col-reverse items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
                                <button onClick={() => { financeData.openTransactionForm(); setIsFabMenuOpen(false); }} title="Lançamento Manual" className="bg-blue-600 text-white p-3.5 rounded-full shadow-xl hover:bg-blue-700 transition-transform transform hover:scale-110 active:scale-95"><PencilIcon className="h-6 w-6" /></button>
                                <button onClick={() => { setIsCameraModalOpen(true); setIsFabMenuOpen(false); }} title="Tirar Foto" className="bg-emerald-600 text-white p-3.5 rounded-full shadow-xl hover:bg-emerald-700 transition-transform transform hover:scale-110 active:scale-95" disabled={isProcessingReceipt}><CameraIcon className="w-6 h-6" /></button>
                                <button onClick={() => { fileInputRef.current?.click(); setIsFabMenuOpen(false); }} title="Importar Galeria" className="bg-sky-500 text-white p-3.5 rounded-full shadow-xl hover:bg-sky-600 transition-transform transform hover:scale-110 active:scale-95" disabled={isProcessingReceipt}><PhotoIcon className="w-6 h-6" /></button>
                                <button onClick={() => { setIsChatbotOpen(true); setIsFabMenuOpen(false); }} title="Assistente IA" className="bg-purple-600 text-white p-3.5 rounded-full shadow-xl hover:bg-purple-700 transition-transform transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></button>
                            </div>
                        )}
                        <button onClick={() => setIsFabMenuOpen(prev => !prev)} className="bg-accent text-white p-4.5 rounded-full shadow-2xl hover:bg-indigo-700 transition-all transform hover:scale-110 active:scale-90 z-50 h-14 w-14 flex items-center justify-center">{isFabMenuOpen ? <XIcon className="h-7 w-7" /> : <PlusIcon className="h-7 w-7" />}</button>
                    </div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>
        </FinanceContext.Provider>
    );
};

export default App;
