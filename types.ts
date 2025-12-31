
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
  password?: string;
};

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
  color: string; // Armazena Hex ou 'transparent'
  textColor?: string; // Armazena Hex
  customIcon?: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: IconName;
  color: string; // Armazena Hex ou 'transparent'
  textColor?: string; // Armazena Hex
  customIcon?: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  paymentMethod: string;
  isRecurring?: boolean;
  frequency?: 'diaria' | 'semanal' | 'mensal';
  endDate?: string;
  recurringId?: string;
  isCardBillPayment?: boolean;
  isInvestmentWithdrawal?: boolean;
};

export type Goal = {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  creationDate: string;
  icon: string;
  customIcon?: string;
  isAiGenerated?: boolean;
  aiBreakdown?: string;
  aiSources?: any[];
};

export type GoalTransaction = {
  id: string;
  goalId: string;
  amount: number; 
  date: string;
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
    message: React.ReactNode;
    onConfirm: () => void;
    isDestructive?: boolean;
    waitSeconds?: number;
};
