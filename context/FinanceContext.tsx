import { createContext, useContext } from 'react';
import type { useFinanceData } from '../hooks/useFinanceData';

interface FinanceContextType {
    financeData: ReturnType<typeof useFinanceData>;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context.financeData;
};
