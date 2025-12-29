
import React, { useState, useRef } from 'react';
import Card from './common/Card';
import { useFinance } from '../context/FinanceContext';
import { 
    iconComponents, PencilIcon, CalendarDaysIcon, 
    SunIcon, MoonIcon, HomeIcon, CashIcon, TrashIcon, SparklesIcon, ReceiptPercentIcon, BanknoteIcon, XIcon, WalletIcon
} from '../constants';
import { CategoriesModal, ModalWrapper } from './CategoriesManager';
import { PaymentMethodsModal } from './PaymentMethodsManager';
import type { User } from '../types';

const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const handleCurrencyInputChange = (value: string, setter: (val: string) => void) => {
    const digitsOnly = value.replace(/\D/g, '');
    const numericValue = Number(digitsOnly) / 100;
    setter(numericValue.toFixed(2));
};

const SettingsCard = ({ title, icon, onClick, isDestructive = false }: { title: string, icon: React.ReactNode, onClick: () => void, isDestructive?: boolean }) => (
    <Card 
        className={`flex items-center space-x-3 cursor-pointer border border-transparent transition-all hover:shadow-lg active:scale-95 ${
            isDestructive 
                ? 'hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-500/30' 
                : 'hover:bg-white dark:hover:bg-dark-sidebar hover:border-accent/30'
        } !p-3 sm:!p-3.5`}
        onClick={onClick}
    >
        <div className={`p-1.5 rounded-lg flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 h-11 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-accent/10 text-accent dark:text-accent-light'}`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
        </div>
        <div className="flex-1 min-w-0 text-left">
            <h3 className={`font-semibold text-sm sm:text-base leading-tight ${isDestructive ? 'text-red-800 dark:text-red-300' : 'text-gray-800 dark:text-white'}`}>{title}</h3>
        </div>
    </Card>
);

const InitialBalanceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { initialBalance, initialInvestment, setInitialBalances } = useFinance();
    const [balanceStr, setBalanceStr] = useState(initialBalance.toFixed(2));
    const [investmentStr, setInvestmentStr] = useState(initialInvestment.toFixed(2));
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await setInitialBalances(parseFloat(balanceStr), parseFloat(investmentStr));
        setIsSaving(false);
        onClose();
    };

    return (
        <ModalWrapper title="Saldos iniciais" onClose={onClose}>
            <div className="space-y-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Configure os valores que você já possui em mãos para que o sistema comece a calcular a partir deles.
                </p>
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-widest mb-1.5 ml-1">Saldo em conta / dinheiro</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">R$</span>
                        <input 
                            type="tel" 
                            disabled={isSaving}
                            value={formatToBRL(parseFloat(balanceStr))} 
                            onChange={e => handleCurrencyInputChange(e.target.value, setBalanceStr)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-bold focus:ring-2 focus:ring-accent outline-none text-gray-800 dark:text-white disabled:opacity-50"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-widest mb-1.5 ml-1">Total já investido (aportes)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">R$</span>
                        <input 
                            type="tel" 
                            disabled={isSaving}
                            value={formatToBRL(parseFloat(investmentStr))} 
                            onChange={e => handleCurrencyInputChange(e.target.value, setInvestmentStr)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-bold focus:ring-2 focus:ring-accent outline-none text-gray-800 dark:text-white disabled:opacity-50"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full py-4 font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sincronizando...
                            </>
                        ) : 'Gravar saldos'}
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

const ProfileModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const { showNotification } = useFinance();
    const [name, setName] = useState(user.name || '');
    const [photo, setPhoto] = useState(user.photo);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => setPhoto(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = () => {
        const updatedUser = { ...user, name, photo };
        localStorage.setItem('finpro_current_user', JSON.stringify(updatedUser));
        
        showNotification('Perfil atualizado localmente! Use Supabase Auth para persistência real.', 'success');
        onClose();
        window.location.reload(); 
    };

    const displayName = name || 'Usuário';

    return (
        <ModalWrapper title="Editar perfil" onClose={onClose}>
            <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <img 
                            src={photo || `https://ui-avatars.com/api/?name=${(displayName).replace(' ','+')}&background=random`} 
                            alt="Foto" 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl" 
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full shadow-lg">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome de exibição</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-semibold" 
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 font-semibold">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 font-semibold">
                        Salvar alterações
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

interface SettingsProps {
    theme: string;
    toggleTheme: () => void;
    onLogout: () => void;
    currentUser: User | null;
}

const Settings: React.FC<SettingsProps> = ({ theme, toggleTheme, onLogout, currentUser }) => {
  const [view, setView] = useState('main');
  
  if (!currentUser) return null;

  const userName = currentUser.name || 'Usuário';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="w-full px-4 py-3 sm:px-8">
                {/* Título: Poppins semi-bold */}
                <h1 className="text-lg sm:text-2xl font-semibold font-['Poppins'] text-gray-800 dark:text-white tracking-tight">Configurações</h1>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 w-full pb-24">
                <div className="animate-in fade-in duration-300 space-y-3">
                    <div className="flex items-center gap-2 w-full">
                        <Card className="flex-1 bg-accent border-none relative overflow-hidden text-left !p-3 sm:!p-4 rounded-xl sm:rounded-2xl h-20 sm:h-22 flex items-center">
                            <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 w-full">
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={currentUser.photo || `https://ui-avatars.com/api/?name=${(userName).replace(' ','+')}&background=random`} 
                                        alt="Foto" 
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30 shadow-xl" 
                                    />
                                    <button onClick={() => setView('profile')} className="absolute -bottom-1 -right-1 p-0.5 bg-white text-accent rounded-full shadow-lg">
                                        <PencilIcon className="w-2 h-2" />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm sm:text-base font-semibold text-white truncate leading-tight">{userName}</h2>
                                    <p className="text-[11px] sm:text-xs text-white/90 font-medium truncate mt-0.5">
                                        {currentUser.email}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        
                        <button 
                            onClick={toggleTheme}
                            className="w-20 h-20 sm:w-22 sm:h-22 bg-white dark:bg-dark-sidebar rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 border border-transparent hover:border-accent/30"
                        >
                            <div className="p-2 rounded-lg bg-accent/10 text-accent dark:text-accent-light">
                                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
                        <SettingsCard title="Categorias" icon={<HomeIcon />} onClick={() => setView('categories')} />
                        <SettingsCard title="Métodos de pagamento" icon={<BanknoteIcon />} onClick={() => setView('paymentMethods')} />
                        <SettingsCard title="Saldo e investimento inicial" icon={<CashIcon />} onClick={() => setView('initialBalance')} />
                        <SettingsCard title="Cartão de crédito" icon={<CalendarDaysIcon />} onClick={() => setView('creditCard')} />
                        <SettingsCard title="Zerar informações do app" icon={<TrashIcon />} onClick={() => setView('reset')} isDestructive />
                        <SettingsCard title="Sair da conta" icon={<XIcon />} onClick={onLogout} isDestructive />
                    </div>
                </div>
            </div>
        </div>

        {view === 'profile' && <ProfileModal user={currentUser} onClose={() => setView('main')} />}
        {view === 'initialBalance' && <InitialBalanceModal onClose={() => setView('main')} />}
        {view === 'categories' && <CategoriesModal onClose={() => setView('main')} />}
        {view === 'paymentMethods' && <PaymentMethodsModal onClose={() => setView('main')} />}
        {view === 'reset' && <ResetDataModal onClose={() => setView('main')} />}
        {view === 'creditCard' && <CreditCardModal onClose={() => setView('main')} />}
    </div>
  );
};

const ResetDataModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { resetAllData, requestConfirmation } = useFinance();
    const handleReset = () => {
        requestConfirmation(
            'Zerar plataforma',
            'Esta operação apagará todos os seus registros financeiros deste usuário de forma definitiva.',
            () => {
                resetAllData();
                onClose();
            },
            true
        );
    };
    return (
        <ModalWrapper title="Reset total" onClose={onClose}>
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <TrashIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 tracking-tight">Cuidado extremo!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Esta operação é definitiva e apagará todos os seus registros deste usuário.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={handleReset} className="w-full py-3 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-red-600/20">
                        Zerar meus dados
                    </button>
                    <button onClick={onClose} className="w-full py-3 font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-all text-[10px]">
                        Cancelar
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

const CreditCardModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { cardClosingDay, setCardClosingDay, showNotification } = useFinance();
    const [day, setDay] = useState(cardClosingDay);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (day >= 1 && day <= 28) {
            setIsSaving(true);
            await setCardClosingDay(day);
            setIsSaving(false);
            onClose();
        } else {
            showNotification('Escolha um dia entre 1 e 28.', 'error');
        }
    };
    return (
        <ModalWrapper title="Cartão de crédito" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Defina o dia do fechamento para calcular automaticamente em qual fatura seus gastos mensais serão lançados.
                </p>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-semibold">Dia do fechamento</label>
                    <input 
                        type="number" 
                        disabled={isSaving}
                        value={day} 
                        onChange={e => setDay(parseInt(e.target.value) || 1)} 
                        min="1" 
                        max="28" 
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center font-semibold text-lg disabled:opacity-50" 
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" disabled={isSaving} onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 font-semibold disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSaving} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Gravando...
                            </>
                        ) : 'Gravar ciclo'}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
};

export default Settings;
