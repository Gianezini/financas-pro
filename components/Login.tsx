
import React, { useState } from 'react';
import type { User } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            if (isRegistering) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name }
                    }
                });

                if (signUpError) throw signUpError;
                if (data.user) {
                    const newUser = {
                        id: data.user.id,
                        name: name || 'Usuário',
                        email: email,
                        photo: null
                    };
                    localStorage.setItem('finpro_current_user', JSON.stringify(newUser));
                    onLogin(newUser);
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) throw signInError;
                if (data.user) {
                    const loggedUser = {
                        id: data.user.id,
                        name: data.user.user_metadata?.name || 'Usuário',
                        email: data.user.email!,
                        photo: data.user.user_metadata?.photo_url || null
                    };
                    localStorage.setItem('finpro_current_user', JSON.stringify(loggedUser));
                    onLogin(loggedUser);
                }
            }
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Erro na autenticação.';
            
            // Tratamento robusto de mensagens de erro
            if (msg.includes('at least 6 characters')) {
                msg = 'A senha deve ter pelo menos 6 caracteres.';
            } else if (msg.includes('Invalid login credentials') || msg.includes('Invalid credentials') || msg.toLowerCase().includes('credentials')) {
                msg = 'E-mail ou senha incorretos.';
            } else if (msg.includes('User already registered') || msg.includes('already registered')) {
                msg = 'Este e-mail já está cadastrado.';
            } else if (msg.includes('Email not confirmed')) {
                msg = 'Por favor, confirme seu e-mail para entrar.';
            }

            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-dark-sidebar rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-10">
                    <img 
                        src="/Financas_pro.png" 
                        alt="Finanças Pro" 
                        className="mx-auto w-48 sm:w-56 h-auto mb-2 animate-in fade-in duration-700" 
                    />
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    {isRegistering && (
                        <div className="animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                            <input 
                                type="text" 
                                required 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm font-semibold transition-all"
                                placeholder="Como quer ser chamado?"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm font-semibold transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm font-semibold transition-all"
                            placeholder="Sua senha"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-[10px] sm:text-xs font-bold text-center px-2 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-5 bg-accent text-white rounded-2xl font-bold shadow-xl shadow-accent/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : isRegistering ? 'Criar minha conta' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
