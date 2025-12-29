
import React, { useState, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Category, IconName } from '../types';
import { 
    iconComponents, PencilIcon, PlusIcon, 
    XIcon, CameraIcon, SearchIcon, TrashIcon
} from '../constants';

const COLOR_OPTIONS = [
    'transparent', 'text-red-500', 'text-orange-500', 'text-yellow-500', 
    'text-green-500', 'text-blue-500', 'text-indigo-500', 
    'text-purple-500', 'text-pink-500', 'text-gray-500'
];

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

const CategoryButton: React.FC<{ cat: Category, onClick: () => void }> = ({ cat, onClick }) => {
    const Icon = iconComponents[cat.icon] || iconComponents.DotsHorizontalIcon;
    const isTransparent = cat.color === 'transparent';
    return (
        <button 
            className="flex items-center space-x-2 text-left p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-[52px]"
            onClick={onClick}
        >
            <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                isTransparent 
                    ? 'bg-gray-100 dark:bg-gray-800' 
                    : `${cat.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${cat.color.replace('text-', 'bg-').replace('-500', '-900/40')}`
            }`}>
                {cat.customIcon ? (
                    <img src={cat.customIcon} className="w-6 h-6 object-contain" alt={cat.name} />
                ) : (
                    <Icon className="w-5 h-5" />
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center h-full">
                <p className="font-semibold text-gray-800 dark:text-white leading-[1.1] text-[11px] line-clamp-2">
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
    const [color, setColor] = useState(category?.color || 'text-blue-500');
    const [customIcon, setCustomIcon] = useState<string | undefined>(category?.customIcon);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Proteção de categorias críticas do sistema
    const isProtected = category?.id && (
        ['salary', 'card-bill', 'others', 'investments'].includes(category.id) ||
        ['salário', 'fatura de cartão', 'outros', 'investimentos'].includes(category.name?.toLowerCase() || '')
    );

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

    const attemptDelete = () => {
        if (!category?.id || !onDelete) return;
        
        // Verificação final por nome para garantir o pedido do usuário
        if (category.name?.toLowerCase() === 'investimentos') {
            showNotification('A categoria Investimentos não pode ser excluída pois é usada nos investimentos do sistema.', 'error');
            return;
        }

        onDelete(category.id);
    };

    return (
        <ModalWrapper title={category?.id ? 'Editar Categoria' : 'Nova Categoria'} onClose={onCancel} maxWidth="max-w-xl">
            <div className="space-y-6 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-semibold transition-all"
                            placeholder="Ex: Academia..."
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
                    {category?.id && !isProtected && onDelete && (
                        <button 
                            type="button"
                            onClick={attemptDelete}
                            className="p-2 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all mr-auto shadow-sm"
                            title="Excluir Categoria"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 rounded-md hover:bg-gray-200">
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={() => onSave({ ...category, name, icon, color, customIcon })}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export const CategoriesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { categories, updateCategory, addCategory, deleteCategory, requestConfirmation } = useFinance();
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
        <ModalWrapper title="Gerenciar Categorias" onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col h-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" /> Nova Categoria
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
                            <h4 className="text-[10px] font-semibold text-gray-400 tracking-widest mb-3 px-1">Importados</h4>
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
                            <h4 className="text-[10px] font-semibold text-gray-400 tracking-widest mb-3 px-1">Sistema</h4>
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
                            requestConfirmation(
                                'Excluir Categoria',
                                'Deseja excluir esta categoria? Transações vinculadas serão movidas para "Outros".',
                                () => {
                                    deleteCategory(id);
                                    setEditingCategory(null);
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
