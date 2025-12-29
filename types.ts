
import type React from 'react';

export enum TransactionType {
  Receita = 'receita',
  Despesa = 'despesa',
  Investimento = 'investimento',
}

export enum Page {
  Dashboard = 'dashboard',
  Transactions = 'transactions',
  Reports = 'reports',
  Goals = 'goals',
  Budgets = 'budgets',
  Settings = 'settings',
  Projection = 'projection',
}

export type User = {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  password?: string; // Usado apenas para o mock de login no localStorage
};

/**
 * Representa os nomes dos ícones disponíveis no sistema.
 */
export type IconName = 
  | 'HomeIcon' | 'UtensilsIcon' | 'CarIcon' | 'CalendarDaysIcon' | 'TrendingUpIcon'
  | 'ShoppingBagIcon' | 'HeartIcon' | 'TicketIcon' | 'AcademicCapIcon' | 'BriefcaseIcon'
  | 'PawPrintIcon' | 'PlayIcon' | 'GiftIcon' | 'BankIcon' | 'DotsHorizontalIcon'
  | 'CoffeeIcon' | 'BusIcon' | 'BoltIcon' | 'ShoppingCartIcon' | 'GamepadIcon'
  | 'ReceiptPercentIcon' | 'BookOpenIcon' | 'DesktopComputerIcon' | 'WalletIcon'
  | 'SunIcon' | 'MoonIcon' | 'UserIcon' | 'PaletteIcon' | 'CashIcon' | 'TrashIcon' 
  | 'ArrowLeftIcon' | 'PencilIcon' | 'PlusIcon' | 'XIcon' | 'SparklesIcon'
  | 'CameraIcon' | 'MicrophoneIcon' | 'StopIcon' | 'SpeakerWaveIcon' | 'SpeakerXMarkIcon'
  | 'EyeIcon' | 'EyeOffIcon' | 'SettingsIcon' | 'ListIcon' | 'ChartIcon' | 'FlagIcon' | 'SearchIcon' | 'CheckIcon';

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  customIcon?: string; // Base64 PNG string
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  customIcon?: string; // Base64 PNG string
};

export type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: string; // ISO String
  paymentMethod: string; // Mantido como string (nome) para compatibilidade, ou ID se preferir refatorar tudo
  isRecurring?: boolean;
  frequency?: 'diaria' | 'semanal' | 'mensal';
  endDate?: string; // ISO String
  recurringId?: string;
  isCardBillPayment?: boolean;
  isInvestmentWithdrawal?: boolean;
};

export type Goal = {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO String
  creationDate: string; // ISO String
  icon: string; // Emoji
  customIcon?: string; // Base64 PNG string
  isAiGenerated?: boolean;
  aiBreakdown?: string;
  aiSources?: any[];
};

export type GoalTransaction = {
  id: string;
  goalId: string;
  amount: number; 
  date: string; // ISO String
  description: string;
};

export type Budget = {
  categoryId: string;
  limit: number;
};

export type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
};

export type AppNotification = {
    message: string;
    type: 'success' | 'error' | 'info';
};

export type AppConfirmation = {
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
};
