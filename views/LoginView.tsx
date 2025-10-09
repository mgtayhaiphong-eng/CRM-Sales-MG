import React, { useState } from 'react';
import { useCrm } from '../services/firebase';
import { BriefcaseIcon, LoadingSpinner } from '../components/UIComponents';

const LoginView: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useCrm();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        // Use an email like admin@example.com / user@example.com
        const success = await login(email, password);
        if (!success) {
            setError('Email hoặc mật khẩu không hợp lệ.');
        }
        // No need to setIsLoading(false) because onAuthStateChanged will trigger a re-render
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex justify-center mb-6">
                    <BriefcaseIcon className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-2">CRM Sales MG</h2>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Đăng nhập để tiếp tục</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            placeholder="e.g., admin@example.com"
                            autoComplete="email"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 flex justify-center items-center">
                        {isLoading ? <div className="loading-spinner w-5 h-5 border-white border-t-transparent"></div> : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginView;