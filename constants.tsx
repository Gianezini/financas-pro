
import type { Category, PaymentMethod, IconName } from './types';
import { Page } from './types';
import React from 'react';

const EmojiIcon = ({ char, className = "", style = {} }: { char: string, className?: string, style?: React.CSSProperties }) => (
  <span className={`inline-flex items-center justify-center leading-none select-none ${className}`} style={{ fontSize: '1.25rem', ...style }}>
    {char}
  </span>
);

const SvgIcon = ({ children, className = 'w-5 h-5', style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
    {children}
  </svg>
);

export const HomeIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-1.125 1.125-1.125V9.75M8.25 21h8.25" /></SvgIcon>;
export const ListIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></SvgIcon>;
export const SearchIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></SvgIcon>;
export const ChartIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" /></SvgIcon>;
export const FlagIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></SvgIcon>;
export const TrendingUpIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21.75 7.5M21.75 7.5H16.5m5.25 0v5.25" /></SvgIcon>;
export const SettingsIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378.138.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l-.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></SvgIcon>;

export const PlusIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></SvgIcon>;
export const XIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></SvgIcon>;
export const ArrowLeftIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></SvgIcon>;
export const PencilIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></SvgIcon>;
export const TrashIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></SvgIcon>;
export const UserIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></SvgIcon>;
export const CameraIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316zM10.5 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" /></SvgIcon>;
export const EyeIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></SvgIcon>;
export const EyeOffIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></SvgIcon>;
export const PaletteIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-3.012 3.011 3.01 3.01 0 003.011 3.012H11.5a3.01 3.01 0 003.012-3.012 3.01 3.01 0 00-3.012-3.011H9.53zM14.25 9.432a3 3 0 113 3l-3-3zM4.5 13.5v.75a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75zM17.25 4.5h-.75a.75.75 0 00-.75.75v1.5a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75z" /></SvgIcon>;
export const CashIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></SvgIcon>;
export const SparklesIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09-3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" /></SvgIcon>;

export const StarIcon = (p: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={p.className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

export const CalendarDaysIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></SvgIcon>;
export const SunIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></SvgIcon>;
export const MoonIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></SvgIcon>;
export const MicrophoneIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></SvgIcon>;
export const StopIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></SvgIcon>;
export const CheckIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></SvgIcon>;
export const PhotoIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></SvgIcon>;

export const LockIcon = (p: any) => <SvgIcon {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></SvgIcon>;

export const ReceiptPercentIcon = (p: any) => <EmojiIcon char="💵" {...p} />;
export const BanknoteIcon = (p: any) => (
  <SvgIcon {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15M2.25 6H21.75V18H2.25V6ZM12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </SvgIcon>
);
export const WalletIcon = (p: any) => <EmojiIcon char="🛠️" {...p} />;

export const iconComponents: { [key in IconName]: React.FC<{className?: string, style?: React.CSSProperties}> } = {
  HomeIcon: (p) => <EmojiIcon char="🏠" {...p} />,
  UtensilsIcon: (p) => <EmojiIcon char="🍽️" {...p} />,
  CarIcon: (p) => <EmojiIcon char="⛽" {...p} />, 
  CalendarDaysIcon: (p) => <EmojiIcon char="📌" {...p} />, 
  TrendingUpIcon: (p) => <EmojiIcon char="📈" {...p} />, 
  ShoppingBagIcon: (p) => <EmojiIcon char="🛍️" {...p} />,
  HeartIcon: (p) => <EmojiIcon char="🏥" {...p} />, 
  TicketIcon: (p) => <EmojiIcon char="🎟️" {...p} />,
  AcademicCapIcon: (p) => <EmojiIcon char="🎓" {...p} />,
  BriefcaseIcon: (p) => <EmojiIcon char="💼" {...p} />,
  PawPrintIcon: (p) => <EmojiIcon char="🐾" {...p} />,
  PlayIcon: (p) => <EmojiIcon char="📺" {...p} />, 
  GiftIcon: (p) => <EmojiIcon char="🎁" {...p} />,
  BankIcon: (p) => <EmojiIcon char="🏦" {...p} />,
  DotsHorizontalIcon: (p) => <EmojiIcon char="🏷️" {...p} />,
  CoffeeIcon: (p) => <EmojiIcon char="☕" {...p} />,
  BusIcon: (p) => <EmojiIcon char="🚗" {...p} />, 
  BoltIcon: (p) => <EmojiIcon char="🧾" {...p} />, 
  ShoppingCartIcon: (p) => <EmojiIcon char="🛒" {...p} />,
  GamepadIcon: (p) => <EmojiIcon char="🎮" {...p} />,
  ReceiptPercentIcon,
  BookOpenIcon: (p) => <EmojiIcon char="📚" {...p} />,
  DesktopComputerIcon: (p) => <EmojiIcon char="💻" {...p} />,
  WalletIcon,
  SunIcon, MoonIcon, UserIcon, PaletteIcon, CashIcon, TrashIcon, ArrowLeftIcon, PencilIcon, PlusIcon, XIcon, SparklesIcon, CameraIcon, 
  MicrophoneIcon: (p) => <MicrophoneIcon {...p} />, 
  StopIcon: (p) => <StopIcon {...p} />, 
  CheckIcon,
  SpeakerWaveIcon: (p) => <EmojiIcon char="🔊" {...p} />, 
  SpeakerXMarkIcon: (p) => <EmojiIcon char="🔇" {...p} />, 
  EyeIcon, EyeOffIcon, SettingsIcon, ListIcon, ChartIcon, FlagIcon, SearchIcon
};

export const NAV_ITEMS = [
  { page: Page.Dashboard, label: 'Dashboard', icon: HomeIcon },
  { page: Page.Transactions, label: 'Extrato', icon: ListIcon },
  { page: Page.Reports, label: 'Relatórios', icon: ChartIcon },
  { page: Page.Goals, label: 'Metas', icon: FlagIcon },
  { page: Page.Projection, label: 'Projeção', icon: TrendingUpIcon },
  { page: Page.Settings, label: 'Configurações', icon: SettingsIcon },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salário', icon: 'BriefcaseIcon', color: '#22c55e', textColor: '#ffffff' },
  { id: 'food', name: 'Alimentação', icon: 'UtensilsIcon', color: '#f97316', textColor: '#ffffff' },
  { id: 'housing', name: 'Moradia', icon: 'HomeIcon', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'transport', name: 'Transporte', icon: 'BusIcon', color: '#6366f1', textColor: '#ffffff' },
  { id: 'investments', name: 'Investimentos', icon: 'TrendingUpIcon', color: '#0ea5e9', textColor: '#ffffff' },
  { id: 'card_bill', name: 'Fatura do Cartão', icon: 'ReceiptPercentIcon', color: '#f97316', textColor: '#ffffff' },
  { id: 'bank_fees', name: 'Taxas bancárias', icon: 'ReceiptPercentIcon', color: '#f87171', textColor: '#ffffff' },
  { id: 'leisure', name: 'Lazer', icon: 'TicketIcon', color: '#a855f7', textColor: '#ffffff' },
  { id: 'health', name: 'Saúde', icon: 'HeartIcon', color: '#ef4444', textColor: '#ffffff' },
  { id: 'others', name: 'Outro', icon: 'DotsHorizontalIcon', color: '#6b7280', textColor: '#ffffff' },
];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm_pix', name: 'PIX', icon: 'BoltIcon', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'pm_cash', name: 'Dinheiro', icon: 'CashIcon', color: '#22c55e', textColor: '#ffffff' },
  { id: 'pm_card_credit', name: 'Cartão de Crédito', icon: 'TicketIcon', color: '#f97316', textColor: '#ffffff' },
  { id: 'pm_card_debit', name: 'Cartão de Débito', icon: 'TicketIcon', color: '#6366f1', textColor: '#ffffff' },
  { id: 'pm_boleto', name: 'Boleto', icon: 'ReceiptPercentIcon', color: '#ca8a04', textColor: '#ffffff' },
  { id: 'pm_other', name: 'Outro', icon: 'DotsHorizontalIcon', color: '#9ca3af', textColor: '#ffffff' },
];
