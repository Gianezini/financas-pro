
-- SCRIPT DE ATUALIZAÇÃO DO SUPABASE - FINANÇAS PRO
-- Copie e cole este script no SQL Editor do seu projeto Supabase para evitar erros de colunas faltantes.

-- REPARO RÁPIDO PARA ERRO DE METAS (Execute isto primeiro se tiver erro ao criar meta):
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS ai_breakdown TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS ai_sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_investment_withdrawal BOOLEAN DEFAULT FALSE;

-- 1. TABELA DE CONFIGURAÇÕES DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    initial_balance DECIMAL(12,2) DEFAULT 0,
    initial_investment DECIMAL(12,2) DEFAULT 0,
    card_closing_day INTEGER DEFAULT 25 CHECK (card_closing_day >= 1 AND card_closing_day <= 28),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    custom_icon TEXT, -- Armazena Base64
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE MÉTODOS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    custom_icon TEXT, -- Armazena Base64
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('receita', 'despesa', 'investimento')) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency TEXT CHECK (frequency IN ('diaria', 'semanal', 'mensal')),
    end_date TIMESTAMP WITH TIME ZONE,
    recurring_id UUID,
    is_card_bill_payment BOOLEAN DEFAULT FALSE,
    is_investment_withdrawal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE METAS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    icon TEXT NOT NULL,
    custom_icon TEXT, -- Armazena Base64
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_breakdown TEXT,
    ai_sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE MOVIMENTAÇÕES DE METAS (APORTES/RETIRADAS)
CREATE TABLE IF NOT EXISTS public.goal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CONFIGURAÇÃO DE SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso por usuário
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goal transactions" ON public.goal_transactions FOR ALL USING (auth.uid() = user_id);
