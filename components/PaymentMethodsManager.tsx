
import React, { useState, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { PaymentMethod, IconName } from '../types';
import { 
    iconComponents, PlusIcon, 
    XIcon, CameraIcon, SearchIcon, TrashIcon, CheckIcon, LockIcon, PhotoIcon
} from '../constants';
import { ModalWrapper } from './CategoriesManager';

const ICON_GROUPS: { title: string, icons: IconName[] }[] = [
    { title: 'Financeiro', icons: ['CashIcon', 'BankIcon', 'ReceiptPercentIcon', 'BoltIcon'] },
];

const getPaymentMethodStyles = (pm: Partial<PaymentMethod>) => {
    const bgColor = 'rgba(0, 0, 0, 0.2)';
    const txtColor = pm.textColor || 'rgba(255, 255, 255, 0.8)';

    return {
        bg: '',
        style: {
            backgroundColor: bgColor,
            color: txtColor,
            border: 'none'
        },
        iconStyle: {
            color: txtColor
        }
    };
};

const PaymentMethodButton: React.FC<{ pm: PaymentMethod, onClick: () => void }> = ({ pm, onClick }) => {
    const Icon = iconComponents[pm.icon] || iconComponents.DotsHorizontalIcon;
    const styles = getPaymentMethodStyles(pm);

    return (
        <button 
            className="flex items-center space-x-2 text-left p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-[52px]"
            onClick={onClick}
        >
            <div 
                className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
                style={styles.style}
            >
                {pm.customIcon ? (
                    <img src={pm.customIcon} className="w-9 h-9 object-contain" alt={pm.name} />
                ) : (
                    <Icon className="w-5 h-5" style={styles.iconStyle} />
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center h-full">
                <p className="font-semibold leading-[1.1] text-[11px] line-clamp-2 text-gray-800 dark:text-white">
                    {pm.name}
                </p>
            </div>
        </button>
    );
};

const PaymentMethodForm: React.FC<{ 
    method?: Partial<PaymentMethod>, 
    onSave: (pm: any) => void, 
    onCancel: () => void,
    onDelete?: (id: string) => void
}> = ({ method, onSave, onCancel, onDelete }) => {
    const { paymentMethods, showNotification } = useFinance();
    const [name, setName] = useState(method?.name || '');
    const [icon, setIcon] = useState<IconName>(method?.icon || 'CashIcon');
    const [textColor, setTextColor] = useState(method?.textColor || 'rgba(255, 255, 255, 0.8)');
    const [customIcon, setCustomIcon] = useState<string | undefined>(method?.customIcon);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isProtected = useMemo(() => {
        if (!method?.id) return false;
        return method.id === 'pm_other' || method.name?.toLowerCase() === 'outro';
    }, [method]);

    const existingCustomIcons = useMemo(() => {
        const icons = new Set<string>();
        paymentMethods.forEach(pm => {
            if (pm.customIcon) icons.add(pm.customIcon);
        });
        return Array.from(icons);
    }, [paymentMethods]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomIcon(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteCustomIconFromSystem = () => {
        setCustomIcon(undefined);
        showNotification('Ícone removido do editor. Salve para confirmar.', 'info');
    };

    const IconPreview = iconComponents[icon] || iconComponents.DotsHorizontalIcon;
    const styles = getPaymentMethodStyles({ textColor });

    return (
        <ModalWrapper title={method?.id ? 'Editar Método' : 'Novo Método'} onClose={onCancel} maxWidth="max-w-xl">
            <div className="space-y-6 pb-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-semibold flex items-center gap-2">
                        Nome {isProtected && <LockIcon className="w-3.5 h-3.5 text-orange-500" />}
                    </label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        disabled={isProtected}
                        className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-semibold transition-all ${isProtected ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}`}
                        placeholder="Ex: PicPay..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-semibold">Personalização do ícone</label>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="relative w-12 h-12">
                                {customIcon ? (
                                    <div className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white flex items-center justify-center text-gray-300 shadow-inner">
                                        <LockIcon className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="color" 
                                            value={textColor.startsWith('rgba') ? '#ffffff' : textColor} 
                                            onChange={e => setTextColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                                            style={{ backgroundColor: textColor.startsWith('rgba') ? '#ffffff' : textColor }}
                                        />
                                    </>
                                )}
                            </div>
                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Cor do ícone</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Pré-visualização</label>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-6 bg-gray-300/80 dark:bg-gray-700/80 rounded-2xl border border-gray-100 dark:border-gray-600 flex-1 shadow-inner min-h-[100px]">
                            <div className="flex flex-col items-center gap-2">
                                <div 
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all shadow-sm"
                                    style={styles.style}
                                >
                                    {customIcon ? (
                                        <img src={customIcon} className="w-10 h-10 object-contain" alt="Selected icon" />
                                    ) : (
                                        <IconPreview className="w-10 h-10" style={styles.iconStyle} />
                                    )}
                                </div>
                                {customIcon && (
                                    <button 
                                        type="button" 
                                        onClick={deleteCustomIconFromSystem}
                                        className="text-[10px] font-bold text-red-500 uppercase hover:underline tracking-tighter transition-all"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center bg-accent text-white px-5 py-4 rounded-xl hover:bg-accent-light hover:scale-105 active:scale-95 transition-all flex-shrink-0 h-full"
                        >
                            <PhotoIcon className="w-6 h-6 mb-1 opacity-90" />
                            <span className="text-[9px] uppercase leading-tight tracking-tighter">Enviar</span>
                            <span className="text-[9px] uppercase leading-tight tracking-tighter">Ícone</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png" className="hidden" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Galeria de ícones</label>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 max-h-[250px] overflow-y-auto space-y-4">
                        
                        {existingCustomIcons.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Importados</h4>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {existingCustomIcons.map((iconData, idx) => {
                                        const isActive = customIcon === iconData;
                                        return (
                                            <button 
                                                key={`custom-${idx}`}
                                                type="button"
                                                onClick={() => setCustomIcon(iconData)}
                                                className={`aspect-square rounded-lg flex items-center justify-center transition-all bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 ${
                                                    isActive 
                                                        ? 'border-blue-500 shadow-sm scale-105' 
                                                        : 'border-transparent dark:border-gray-600'
                                                }`}
                                            >
                                                <img src={iconData} className="w-6 h-6 object-contain" alt={`Custom ${idx}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-600 w-full mt-6 mb-4"></div>
                            </div>
                        )}

                        {ICON_GROUPS.map(group => (
                            <div key={group.title}>
                                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">{group.title}</h4>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {group.icons.map(iconKey => {
                                        const Icon = iconComponents[iconKey];
                                        const isActive = icon === iconKey && !customIcon;
                                        return (
                                            <button 
                                                key={iconKey}
                                                type="button"
                                                onClick={() => { setIcon(iconKey); setCustomIcon(undefined); }}
                                                className={`aspect-square rounded-lg flex items-center justify-center transition-all bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 ${
                                                    isActive 
                                                        ? 'border-blue-500 shadow-sm scale-105' 
                                                        : 'border-transparent dark:border-gray-600'
                                                }`}
                                            >
                                                <Icon className={isActive ? 'scale-110 text-blue-500' : ''} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col pt-4 border-t border-gray-100 dark:border-gray-700">
                    {method?.id && isProtected && (
                        <div className="mb-4">
                            <p className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 italic leading-tight">
                                Este método é essencial para a integridade dos dados e não pode ser removido ou ter seu nome alterado.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end items-center">
                        {method?.id && !isProtected && onDelete && (
                            <button 
                                type="button"
                                onClick={() => onDelete(method.id!)}
                                className="p-2 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all mr-auto shadow-sm"
                                title="Excluir Método"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-none rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={() => onSave({ ...method, name, icon, color: 'transparent', textColor, customIcon })}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 font-semibold"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
};

export const PaymentMethodsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { paymentMethods, updatePaymentMethod, addPaymentMethod, deletePaymentMethod, requestConfirmation, transactions } = useFinance();
    const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPm = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return paymentMethods;
        return paymentMethods.filter(pm => pm.name.toLowerCase().includes(query));
    }, [paymentMethods, searchQuery]);

    const categorizedList = useMemo(() => {
        const imported = filteredPm.filter(pm => !!pm.customIcon);
        const system = filteredPm.filter(pm => !pm.customIcon);
        return { imported, system };
    }, [filteredPm]);

    return (
        <ModalWrapper title="Gerenciar métodos de pagamento" onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col h-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" /> Novo método
                    </button>
                    <div className="relative flex-1">
                        <input 
                            type="text"
                            placeholder="Buscar método..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                        />
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>
                
                <div className="max-h-[450px] overflow-y-auto pr-2 space-y-6">
                    {categorizedList.imported.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Importados</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categorizedList.imported.map(pm => (
                                    <PaymentMethodButton key={pm.id} pm={pm} onClick={() => setEditingPm(pm)} />
                                ))}
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 w-full mt-6"></div>
                        </div>
                    )}

                    {categorizedList.system.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Sistema</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categorizedList.system.map(pm => (
                                    <PaymentMethodButton key={pm.id} pm={pm} onClick={() => setEditingPm(pm)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredPm.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-sm font-semibold text-gray-400">Nenhum método encontrado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {(editingPm || isAdding) && (
                    <PaymentMethodForm 
                        method={editingPm || {}} 
                        onSave={(pm) => {
                            if (editingPm) updatePaymentMethod(pm);
                            else addPaymentMethod(pm);
                            setEditingPm(null);
                            setIsAdding(false);
                        }}
                        onCancel={() => {
                            setEditingPm(null);
                            setIsAdding(false);
                        }}
                        onDelete={(id) => {
                            const targetPm = paymentMethods.find(p => p.id === id);
                            const count = targetPm ? transactions.filter(t => t.paymentMethod === targetPm.name).length : 0;
                            const textVinculo = count === 1 ? 'transação vinculada' : 'transações vinculadas';

                            const msg = count > 0 
                                ? (
                                    <>
                                        Este método de pagamento possui <span className="text-red-500 font-bold">{count} {textVinculo}</span>. Se você excluir, todos esses registros serão movidos para o método "Outro". Deseja continuar?
                                    </>
                                )
                                : `Deseja realmente excluir este método de pagamento?`;

                            requestConfirmation(
                                'Excluir Método',
                                msg,
                                () => {
                                    deletePaymentMethod(id);
                                    setEditingPm(null);
                                },
                                true,
                                count > 0 ? 5 : 0
                            );
                        }}
                    />
                )}
            </div>
        </ModalWrapper>
    );
};
