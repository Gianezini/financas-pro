
import React, { useState, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Category, IconName } from '../types';
import { 
    iconComponents, PencilIcon, PlusIcon, 
    XIcon, CameraIcon, SearchIcon, TrashIcon, CheckIcon, LockIcon, PhotoIcon
} from '../constants';

const ICON_GROUPS: { title: string, icons: IconName[] }[] = [
    { title: 'Alimentação', icons: ['UtensilsIcon', 'CoffeeIcon'] },
    { title: 'Transporte', icons: ['CarIcon', 'BusIcon', 'WalletIcon'] },
    { title: 'Moradia & Contas', icons: ['HomeIcon', 'BoltIcon', 'CalendarDaysIcon'] }, 
    { title: 'Financeiro', icons: ['BankIcon', 'ReceiptPercentIcon', 'CashIcon'] },
    { title: 'Lazer & Compras', icons: ['ShoppingBagIcon', 'ShoppingCartIcon', 'TicketIcon', 'GamepadIcon', 'PlayIcon'] },
    { title: 'Vida Pessoal', icons: ['HeartIcon', 'AcademicCapIcon', 'BookOpenIcon', 'BriefcaseIcon', 'DesktopComputerIcon', 'PawPrintIcon', 'GiftIcon', 'DotsHorizontalIcon'] },
];

export const ModalWrapper = ({ title, onClose, children, maxWidth = "max-w-md" }: { title: string, onClose: () => void, children?: React.ReactNode, maxWidth?: string }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-start pt-12 sm:pt-24 p-4 animate-in fade-in duration-200 overflow-y-auto">
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidth} relative animate-in zoom-in-95 duration-200 max-h-fit overflow-hidden flex flex-col`}>
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-visible px-6 pb-6 relative">
                {children}
            </div>
        </div>
    </div>
);

const getCategoryStyles = (cat: Partial<Category>) => {
    const isTransparent = cat.color === 'transparent';
    const bgColor = isTransparent ? 'rgba(0, 0, 0, 0.2)' : (cat.color || '#3b82f6');
    const txtColor = isTransparent ? 'rgba(255, 255, 255, 0.8)' : (cat.textColor || '#ffffff');

    return {
        bg: '',
        style: {
            backgroundColor: bgColor,
            color: txtColor,
            border: 'none'
        },
        iconStyle: {
            color: txtColor
        },
        badgeStyle: {
            backgroundColor: bgColor,
            color: txtColor
        }
    };
};

const CategoryButton: React.FC<{ cat: Category, onClick: () => void }> = ({ cat, onClick }) => {
    const Icon = iconComponents[cat.icon] || iconComponents.DotsHorizontalIcon;
    const styles = getCategoryStyles(cat);
    
    return (
        <button 
            className="flex items-center space-x-2 text-left p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-[52px]"
            onClick={onClick}
        >
            <div 
                className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
                style={styles.style}
            >
                {cat.customIcon ? (
                    <img src={cat.customIcon} className="w-6 h-6 object-contain" alt={cat.name} />
                ) : (
                    <Icon className="w-5 h-5" style={styles.iconStyle} />
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center h-full">
                <p className="font-semibold leading-[1.1] text-[11px] line-clamp-2 text-gray-800 dark:text-white">
                    {cat.name}
                </p>
            </div>
        </button>
    );
};

const CategoryForm: React.FC<{ 
    category?: Partial<Category>, 
    onSave: (cat: any) => void, 
    onCancel: () => void,
    onDelete?: (id: string) => void
}> = ({ category, onSave, onCancel, onDelete }) => {
    const { categories, showNotification } = useFinance();
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState<IconName>(category?.icon || 'BriefcaseIcon');
    const [color, setColor] = useState(category?.color || '#3b82f6');
    const [textColor, setTextColor] = useState(category?.textColor || '#ffffff');
    const [lastColor, setLastColor] = useState(category?.color !== 'transparent' ? category?.color || '#3b82f6' : '#3b82f6');
    const [lastTextColor, setLastTextColor] = useState(category?.textColor || '#ffffff');
    const [customIcon, setCustomIcon] = useState<string | undefined>(category?.customIcon);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isTransparent = color === 'transparent';

    const isProtected = useMemo(() => {
        if (!category?.id) return false;
        const protectedNames = ['outro', 'investimentos', 'taxas bancárias'];
        const protectedIds = ['others', 'investments', 'bank_fees'];
        return protectedIds.includes(category.id) || protectedNames.includes(category.name?.toLowerCase() || '');
    }, [category]);

    const existingCustomIcons = useMemo(() => {
        const icons = new Set<string>();
        categories.forEach(cat => {
            if (cat.customIcon) icons.add(cat.customIcon);
        });
        return Array.from(icons);
    }, [categories]);

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

    const toggleTransparency = () => {
        if (isTransparent) {
            setColor(lastColor);
            setTextColor(lastTextColor);
        } else {
            setLastColor(color);
            setLastTextColor(textColor);
            setColor('transparent');
        }
    };

    const deleteCustomIconFromSystem = () => {
        setCustomIcon(undefined);
        showNotification('Ícone removido do editor. Salve para confirmar.', 'info');
    };

    const IconPreview = iconComponents[icon] || iconComponents.DotsHorizontalIcon;
    const styles = getCategoryStyles({ color, textColor });

    return (
        <ModalWrapper title={category?.id ? 'Editar Categoria' : 'Nova Categoria'} onClose={onCancel} maxWidth="max-w-xl">
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
                        placeholder="Ex: Academia..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-semibold">Personalização</label>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center gap-1.5">
                            <button 
                                type="button"
                                onClick={toggleTransparency}
                                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${isTransparent ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}
                            >
                                {isTransparent ? <CheckIcon className="w-6 h-6" /> : <XIcon className="w-6 h-6" />}
                            </button>
                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Sem fundo</span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                            <div className="relative w-12 h-12">
                                {isTransparent ? (
                                    <div className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white flex items-center justify-center text-gray-300 shadow-inner">
                                        <LockIcon className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="color" 
                                            value={color} 
                                            onChange={e => setColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    </>
                                )}
                            </div>
                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Cor do fundo</span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                            <div className="relative w-12 h-12">
                                {isTransparent ? (
                                    <div className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white flex items-center justify-center text-gray-300 shadow-inner">
                                        <LockIcon className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="color" 
                                            value={textColor} 
                                            onChange={e => setTextColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                                            style={{ backgroundColor: textColor }}
                                        />
                                    </>
                                )}
                            </div>
                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-tighter">Cor do nome</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Pré-visualização (ícone e badge)</label>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 p-6 bg-gray-300/80 dark:bg-gray-700/80 rounded-2xl border border-gray-100 dark:border-gray-600 flex-1 shadow-inner">
                            <div className="flex flex-col items-center gap-2">
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-all shadow-sm"
                                    style={styles.style}
                                >
                                    {customIcon ? (
                                        <img src={customIcon} className="w-10 h-10 object-contain" alt="Selected icon" />
                                    ) : (
                                        <IconPreview className="w-8 h-8" style={styles.iconStyle} />
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
                            
                            <span 
                                className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all shadow-sm"
                                style={styles.badgeStyle}
                            >
                                {name || 'Nome da categoria'}
                            </span>
                        </div>

                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center bg-accent text-white px-5 py-3 rounded-xl hover:bg-accent-light hover:scale-105 active:scale-95 transition-all flex-shrink-0"
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
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 max-h-[220px] overflow-y-auto space-y-4">
                        
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
                    {category?.id && isProtected && (
                        <div className="mb-4">
                            <p className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 italic leading-tight">
                                Esta categoria é essencial para as automações do sistema e não pode ser removida ou ter seu nome alterado.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end items-center">
                        {category?.id && !isProtected && onDelete && (
                            <button 
                                type="button"
                                onClick={() => onDelete(category.id!)}
                                className="p-2 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all mr-auto shadow-sm"
                                title="Excluir Categoria"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-none rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={() => onSave({ ...category, name, icon, color, textColor, customIcon })}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
};

export const CategoriesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { categories, updateCategory, addCategory, deleteCategory, requestConfirmation, transactions } = useFinance();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return categories;
        return categories.filter(cat => cat.name.toLowerCase().includes(query));
    }, [categories, searchQuery]);

    const categorizedList = useMemo(() => {
        const imported = filteredCategories.filter(cat => !!cat.customIcon);
        const system = filteredCategories.filter(cat => !cat.customIcon);
        return { imported, system };
    }, [filteredCategories]);

    return (
        <ModalWrapper title="Gerenciar categorias" onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col h-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" /> Nova categoria
                    </button>
                    <div className="relative flex-1">
                        <input 
                            type="text"
                            placeholder="Buscar categoria..."
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
                                {categorizedList.imported.map(cat => (
                                    <CategoryButton key={cat.id} cat={cat} onClick={() => setEditingCategory(cat)} />
                                ))}
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 w-full mt-6"></div>
                        </div>
                    )}

                    {categorizedList.system.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Sistema</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categorizedList.system.map(cat => (
                                    <CategoryButton key={cat.id} cat={cat} onClick={() => setEditingCategory(cat)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-sm font-semibold text-gray-400">Nenhuma categoria encontrada para "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {(editingCategory || isAdding) && (
                    <CategoryForm 
                        category={editingCategory || {}} 
                        onSave={(cat) => {
                            if (editingCategory) updateCategory(cat);
                            else addCategory(cat);
                            setEditingCategory(null);
                            setIsAdding(false);
                        }}
                        onCancel={() => {
                            setEditingCategory(null);
                            setIsAdding(false);
                        }}
                        onDelete={(id) => {
                            const count = transactions.filter(t => t.categoryId === id).length;
                            const textVinculo = count === 1 ? 'transação vinculada' : 'transações vinculadas';
                            
                            const msg = count > 0 
                                ? (
                                    <>
                                        Esta categoria possui <span className="text-red-500 font-bold">{count} {textVinculo}</span>. Se você excluir, todos esses registros serão movidos para a categoria "Outro". Deseja continuar?
                                    </>
                                )
                                : `Deseja realmente excluir esta categoria?`;

                            requestConfirmation(
                                'Excluir Categoria',
                                msg,
                                () => {
                                    deleteCategory(id);
                                    setEditingCategory(null);
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
