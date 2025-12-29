
import React, { useState, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { PaymentMethod, IconName } from '../types';
import { 
    iconComponents, PlusIcon, 
    XIcon, CameraIcon, SearchIcon, TrashIcon
} from '../constants';
import { ModalWrapper } from './CategoriesManager';

const COLOR_OPTIONS = [
    'transparent', 'text-red-500', 'text-orange-500', 'text-yellow-500', 
    'text-green-500', 'text-blue-500', 'text-indigo-500', 
    'text-purple-500', 'text-pink-500', 'text-gray-500'
];

const ICON_GROUPS: { title: string, icons: IconName[] }[] = [
    { title: 'Financeiro', icons: ['CashIcon', 'TicketIcon', 'BankIcon', 'ReceiptPercentIcon'] },
];

const PaymentMethodButton: React.FC<{ pm: PaymentMethod, onClick: () => void }> = ({ pm, onClick }) => {
    const Icon = iconComponents[pm.icon] || iconComponents.DotsHorizontalIcon;
    const isTransparent = pm.color === 'transparent';
    return (
        <button 
            className="flex items-center space-x-2 text-left p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-[52px]"
            onClick={onClick}
        >
            <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                isTransparent 
                    ? 'bg-gray-100 dark:bg-gray-800' 
                    : `${pm.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${pm.color.replace('text-', 'bg-').replace('-500', '-900/40')}`
            }`}>
                {pm.customIcon ? (
                    <img src={pm.customIcon} className="w-6 h-6 object-contain" alt={pm.name} />
                ) : (
                    <Icon className="w-5 h-5" />
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center h-full">
                <p className="font-semibold text-gray-800 dark:text-white leading-[1.1] text-[11px] line-clamp-2">
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
    const { paymentMethods } = useFinance();
    const [name, setName] = useState(method?.name || '');
    const [icon, setIcon] = useState<IconName>(method?.icon || 'CashIcon');
    const [color, setColor] = useState(method?.color || 'text-blue-500');
    const [customIcon, setCustomIcon] = useState<string | undefined>(method?.customIcon);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isProtected = method?.id && ['pm_pix', 'pm_cash', 'pm_other'].includes(method.id);

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

    return (
        <ModalWrapper title={method?.id ? 'Editar Método' : 'Novo Método'} onClose={onCancel} maxWidth="max-w-xl">
            <div className="space-y-6 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-semibold transition-all"
                            placeholder="Ex: PicPay..."
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map(c => (
                                <button 
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${
                                        color === c 
                                            ? 'border-blue-500 scale-110 ring-2 ring-blue-500/20' 
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    } ${c === 'transparent' ? 'bg-gray-200 dark:bg-gray-600' : c.replace('text-', 'bg-')}`}
                                >
                                    {c === 'transparent' && <XIcon className="w-4 h-4 text-gray-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Ícone Personalizado (PNG)</label>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/30 transition-all ${customIcon ? 'border-solid border-accent ring-4 ring-accent/10' : ''}`}>
                            {customIcon ? (
                                <img src={customIcon} className="w-8 h-8 object-contain" alt="Custom icon" />
                            ) : (
                                <CameraIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-[10px] font-semibold text-white bg-accent rounded-md hover:bg-accent-light transition-all uppercase"
                        >
                            {customIcon ? 'Trocar' : 'Enviar PNG'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png" className="hidden" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Galeria de Ícones</label>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 max-h-[250px] overflow-y-auto space-y-4">
                        
                        {existingCustomIcons.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                <h4 className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-2 px-1">Importados</h4>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {existingCustomIcons.map((iconData, idx) => {
                                        const isActive = customIcon === iconData;
                                        return (
                                            <button 
                                                key={`custom-${idx}`}
                                                type="button"
                                                onClick={() => setCustomIcon(iconData)}
                                                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                                                    isActive 
                                                        ? 'bg-blue-600 text-white shadow-md scale-105 border-transparent' 
                                                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                                }`}
                                            >
                                                <img src={iconData} className={`w-6 h-6 object-contain ${isActive ? 'brightness-0 invert' : ''}`} alt={`Custom ${idx}`} />
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
                                                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                                                    isActive 
                                                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                                                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                                }`}
                                            >
                                                <Icon className={isActive ? 'scale-110' : ''} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
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
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 font-semibold">
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={() => onSave({ ...method, name, icon, color, customIcon })}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 font-semibold"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export const PaymentMethodsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { paymentMethods, updatePaymentMethod, addPaymentMethod, deletePaymentMethod, requestConfirmation } = useFinance();
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
        <ModalWrapper title="Gerenciar Métodos de Pagamento" onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col h-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" /> Novo Método
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
                            <h4 className="text-[10px] font-semibold text-gray-400 tracking-widest mb-3 px-1">Importados</h4>
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
                            <h4 className="text-[10px] font-semibold text-gray-400 tracking-widest mb-3 px-1">Sistema</h4>
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
                            requestConfirmation(
                                'Excluir Método',
                                'Deseja excluir este método de pagamento?',
                                () => {
                                    deletePaymentMethod(id);
                                    setEditingPm(null);
                                },
                                true
                            );
                        }}
                    />
                )}
            </div>
        </ModalWrapper>
    );
};
